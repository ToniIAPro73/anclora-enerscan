export async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<{
  fullText: string;
  pages: Array<{ pageNumber: number; text: string }>;
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

  return { fullText: fullText.trim(), pages };
}

