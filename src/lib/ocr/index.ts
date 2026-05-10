import { OcrResult } from './types';
import { classifyAttachment } from './attachment-classifier';
import { extractTextFromPdf } from './pdf-extractor';
import { parseCeeText } from './cee-parser';
import { parseBudgetText } from './budget-parser';
import { extractTextFromImage } from './image-ocr';

export async function processAttachmentOcr(input: {
  attachment: {
    id: string;
    name: string;
    type: string;
    category?: string | null;
    path: string;
  };
  bytes: Buffer;
}): Promise<OcrResult> {
  const { attachment, bytes } = input;
  const processedAt = new Date().toISOString();

  if (process.env.ENABLE_OCR !== 'true') {
    return {
      sourceKind: 'unknown',
      status: 'skipped',
      processedAt,
      warnings: ['OCR is disabled via ENABLE_OCR environment variable.'],
    };
  }

  // Skip demo assets from real OCR to save resources in local/dev
  if (attachment.path.startsWith('demo://') || attachment.path.includes('demo-assets')) {
     return {
      sourceKind: classifyAttachment(attachment),
      status: 'skipped',
      processedAt,
      warnings: ['OCR skipped for demo asset.'],
    };
  }

  const sourceKind = classifyAttachment(attachment);

  try {
    if (sourceKind === 'cee_pdf') {
      const { fullText, pages } = await extractTextFromPdf(new Uint8Array(bytes));
      const extracted = parseCeeText(fullText);
      return {
        sourceKind,
        status: 'done',
        text: fullText,
        pages,
        extracted,
        processedAt,
      };
    }

    if (sourceKind === 'budget_pdf') {
      const { fullText, pages } = await extractTextFromPdf(new Uint8Array(bytes));
      const extracted = parseBudgetText(fullText);
      return {
        sourceKind,
        status: 'done',
        text: fullText,
        pages,
        extracted,
        processedAt,
      };
    }

    if (sourceKind === 'image') {
      const extracted = await extractTextFromImage(bytes);
      return {
        sourceKind,
        status: 'done',
        text: extracted.detectedText,
        extracted,
        processedAt,
      };
    }

    return {
      sourceKind: 'unknown',
      status: 'skipped',
      processedAt,
      warnings: ['Document type not supported for OCR or could not be classified.'],
    };

  } catch (error) {
    console.error(`OCR processing failed for ${attachment.name}:`, error);
    return {
      sourceKind,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      processedAt,
    };
  }
}
