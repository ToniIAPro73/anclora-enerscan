type PdfItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = reconstructLines(textContent.items as PdfItem[]).join('\n');

    pages.push({ pageNumber: i, text: pageText });
    fullText += (fullText ? '\n' : '') + pageText;
  }

  const trimmed = fullText.trim();
  return { fullText: trimmed, pages, textQuality: assessPdfTextQuality(trimmed) };
}

/**
 * Reconstruct human-readable lines from pdfjs text items using their XY positions.
 * - Items at the same Y (±tolerance) → same line, sorted left to right.
 * - A horizontal gap larger than ~3 average character widths → tab separator.
 * - Lines sorted top to bottom (PDF Y axis is inverted: top = high Y).
 */
function reconstructLines(items: PdfItem[]): string[] {
  type PosItem = { str: string; x: number; y: number; right: number; height: number };

  const positioned: PosItem[] = [];
  for (const item of items) {
    const str = item.str;
    if (!str || !item.transform) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    // Font height from scale matrix; fall back to item.height
    const height = Math.abs(item.transform[3]) || item.height || 10;
    positioned.push({ str, x, y, right: x + (item.width || 0), height });
  }

  if (positioned.length === 0) return [];

  const avgHeight = positioned.reduce((s, i) => s + i.height, 0) / positioned.length;
  const yTolerance = Math.max(1.5, avgHeight * 0.45);
  const colGapThreshold = avgHeight * 2.5; // gap that indicates a column break

  // Group items by Y position
  const lineGroups: Array<{ y: number; items: PosItem[] }> = [];
  for (const item of positioned) {
    const existing = lineGroups.find((g) => Math.abs(g.y - item.y) <= yTolerance);
    if (existing) {
      existing.items.push(item);
      // Track centroid y so groups drift toward actual average
      existing.y = (existing.y * (existing.items.length - 1) + item.y) / existing.items.length;
    } else {
      lineGroups.push({ y: item.y, items: [item] });
    }
  }

  // Sort top to bottom
  lineGroups.sort((a, b) => b.y - a.y);

  const result: string[] = [];

  for (const group of lineGroups) {
    group.items.sort((a, b) => a.x - b.x);

    let line = '';
    let prevRight = -Infinity;

    for (const item of group.items) {
      const gap = item.x - prevRight;
      if (prevRight > -Infinity) {
        if (gap > colGapThreshold) {
          line += '\t';
        } else if (gap > 0.5) {
          line += ' ';
        }
      }
      line += item.str;
      prevRight = item.right;
    }

    const trimmed = line.trim();
    if (trimmed) result.push(trimmed);
  }

  return result;
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
