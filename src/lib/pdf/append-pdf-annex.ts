import { PDFDocument } from 'pdf-lib';

export type PdfAnnex = {
  name: string;
  bytes: Buffer | Uint8Array;
  category?: string | null;
};

/**
 * Appends PDF documents to a main PDF document.
 * @param mainPdfBytes The bytes of the main PDF document.
 * @param annexes Array of PDF annexes to append.
 * @returns The combined PDF as Uint8Array.
 */
export async function appendPdfAnnexes(mainPdfBytes: Uint8Array, annexes: PdfAnnex[]) {
  const outputPdf = await PDFDocument.load(mainPdfBytes);

  for (const annex of annexes) {
    try {
      const sourcePdf = await PDFDocument.load(annex.bytes, { ignoreEncryption: true });
      const pages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      for (const page of pages) {
        outputPdf.addPage(page);
      }
    } catch (error) {
      // Do not break the entire report generation if one attachment is corrupt.
      console.error('Could not append PDF annex:', { name: annex.name, error });
    }
  }

  return outputPdf.save();
}
