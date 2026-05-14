export async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<{
  fullText: string;
  pages: Array<{ pageNumber: number; text: string }>;
  textQuality: 'good' | 'weak' | 'empty';
}> {
  // Use dynamic import for pdfjs-dist to avoid issues in some environments
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = (getDocument as any)({
    data: pdfBytes,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const pages: Array<{ pageNumber: number; text: string }> = [];
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str)
      .join(' ');

    pages.push({ pageNumber: i, text: pageText });
    fullText += ` ${pageText}`;
  }

  const trimmed = fullText.trim();
  return { fullText: trimmed, pages, textQuality: assessPdfTextQuality(trimmed) };
}

export function assessPdfTextQuality(text: string): 'good' | 'weak' | 'empty' {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length < 40) return 'empty';
  const anchors = [
    /certificado\s+de\s+eficiencia\s+energ[eé]tica/i,
    /calificaci[oó]n\s+de\s+eficiencia\s+energ[eé]tica/i,
    /energ[ií]a\s+primaria\s+no\s+renovable/i,
    /emisiones\s+de\s+di[oó]xido\s+de\s+carbono/i,
    /presupuesto/i,
    /importe\s+total/i,
  ];
  const anchorHits = anchors.filter((pattern) => pattern.test(normalized)).length;
  if (normalized.length > 300 && anchorHits > 0) return 'good';
  return 'weak';
}
