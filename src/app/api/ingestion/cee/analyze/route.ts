import { NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/ocr/pdf-extractor';
import { parseCeeToCertificate } from '@/lib/ocr/cee-parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function readInput(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json();
    return {
      text: typeof body.text === 'string' ? body.text : undefined,
      fileName: typeof body.fileName === 'string' ? body.fileName : 'cee.pdf',
    };
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('CEE PDF requerido');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('El CEE debe ser un PDF');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('El PDF supera el limite de 10 MB');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractTextFromPdf(bytes);
  return {
    text: extracted.fullText,
    fileName: file.name,
    textQuality: extracted.textQuality,
  };
}

export async function POST(req: Request) {
  try {
    const input = await readInput(req);
    const certificate = parseCeeToCertificate(input.text || '', {
      sourceFormat: input.textQuality === 'empty' ? 'PDF_OCR' : 'PDF_TEXT',
    });
    const warnings = [];
    if (input.textQuality === 'weak') warnings.push('La extraccion de texto del PDF es parcial. Revisa los datos antes de aplicarlos.');
    if (certificate.extractionStatus === 'NEEDS_REVIEW') warnings.push('Faltan campos clave del CEE o hay ambiguedad en el documento.');

    return NextResponse.json({
      ok: true,
      fileName: input.fileName,
      certificate,
      appliedFields: certificate.extractedFields || [],
      warnings,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo analizar el CEE',
    }, { status: 400 });
  }
}
