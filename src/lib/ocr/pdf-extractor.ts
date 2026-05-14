export async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<{
  fullText: string;
  pages: Array<{ pageNumber: number; text: string }>;
  textQuality: 'good' | 'weak' | 'empty';
}> {
  await ensurePdfJsNodeCanvasGlobals();

  // Use dynamic import for pdfjs-dist to avoid issues in some environments
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTask = (getDocument as any)({
    data: pdfBytes,
    disableWorker: true,
    isEvalSupported: false,
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

async function ensurePdfJsNodeCanvasGlobals() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  };

  if (
    globalScope.DOMMatrix &&
    globalScope.ImageData &&
    globalScope.Path2D &&
    globalScope.pdfjsWorker?.WorkerMessageHandler
  ) return;

  const canvas = await import('@napi-rs/canvas');
  globalScope.DOMMatrix ??= canvas.DOMMatrix as unknown as typeof DOMMatrix;
  globalScope.ImageData ??= canvas.ImageData as unknown as typeof ImageData;
  globalScope.Path2D ??= canvas.Path2D as unknown as typeof Path2D;

  if (!globalScope.pdfjsWorker?.WorkerMessageHandler) {
    globalScope.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  }
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
