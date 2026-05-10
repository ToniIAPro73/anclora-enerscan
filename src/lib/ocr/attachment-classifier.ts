import { OcrSourceKind } from './types';

export function classifyAttachment(attachment: {
  name: string;
  type: string;
  category?: string | null;
}): OcrSourceKind {
  const name = attachment.name.toLowerCase();
  const type = attachment.type.toLowerCase();
  const category = attachment.category?.toUpperCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    if (
      category === 'CEE' ||
      name.includes('cee') ||
      name.includes('certificado') ||
      name.includes('energetic') ||
      name.includes('energetico') ||
      name.includes('cex')
    ) {
      return 'cee_pdf';
    }

    if (
      name.includes('presupuesto') ||
      name.includes('oferta') ||
      name.includes('quote') ||
      name.includes('invoice') ||
      name.includes('factura')
    ) {
      return 'budget_pdf';
    }

    return 'unknown';
  }

  if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(name)) {
    return 'image';
  }

  return 'unknown';
}
