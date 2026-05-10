import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { ImageOcrData } from './types';

export async function extractTextFromImage(imageBytes: Buffer): Promise<ImageOcrData> {
  const data: ImageOcrData = {
    detectedSignals: [],
  };

  try {
    // 1. Preprocess with Sharp
    const processedImage = await sharp(imageBytes)
      .grayscale()
      .resize(1500, null, { withoutEnlargement: true, fit: 'inside' })
      .normalize()
      .toBuffer();

    // 2. OCR with Tesseract
    const worker = await createWorker('spa+eng');
    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();

    data.detectedText = text;

    // 3. Signal detection
    const signalKeywords = [
      { signal: 'caldera', patterns: [/caldera/i, /boiler/i, /vaillant/i, /saunier/i, /junkers/i, /baxi/i] },
      { signal: 'bomba de calor', patterns: [/bomba\s+de\s+calor/i, /heat\s+pump/i, /aerotermia/i, /daikin/i, /mitsubishi/i, /panasonic/i] },
      { signal: 'placa solar', patterns: [/placa\s+solar/i, /panel\s+solar/i, /fotovoltaic/i, /inversor/i, /huawei/i, /fronius/i] },
      { signal: 'ventana', patterns: [/ventana/i, /window/i, /pvc/i, /climalit/i, /guardian\s+sun/i] },
      { signal: 'etiqueta energética', patterns: [/etiqueta/i, /label/i, /energétic/i, /consumo/i] },
    ];

    for (const item of signalKeywords) {
      if (item.patterns.some(p => p.test(text))) {
        data.detectedSignals!.push(item.signal);
      }
    }

    // 4. Category inference
    if (data.detectedSignals!.includes('caldera')) data.probableCategory = 'heating';
    else if (data.detectedSignals!.includes('bomba de calor')) data.probableCategory = 'heating';
    else if (data.detectedSignals!.includes('placa solar')) data.probableCategory = 'renewables';
    else if (data.detectedSignals!.includes('ventana')) data.probableCategory = 'windows';

  } catch (error) {
    console.error('Image OCR failed:', error);
  }

  return data;
}
