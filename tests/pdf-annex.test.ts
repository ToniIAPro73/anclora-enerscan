import { PDFDocument, rgb } from 'pdf-lib';
import { appendPdfAnnexes, PdfAnnex } from '@/lib/pdf/append-pdf-annex';

async function createTestPdf(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText(text, { x: 50, y: 350, size: 30, color: rgb(0, 0.53, 0.71) });
  return pdfDoc.save();
}

describe('appendPdfAnnexes', () => {
  it('should append multiple PDF annexes to a main PDF', async () => {
    const mainPdfBytes = await createTestPdf('Main Report');
    const annex1Bytes = await createTestPdf('Annex 1');
    const annex2Bytes = await createTestPdf('Annex 2');

    const annexes: PdfAnnex[] = [
      { name: 'annex1.pdf', bytes: annex1Bytes },
      { name: 'annex2.pdf', bytes: annex2Bytes },
    ];

    const combinedPdfBytes = await appendPdfAnnexes(mainPdfBytes, annexes);
    const combinedPdf = await PDFDocument.load(combinedPdfBytes);

    expect(combinedPdf.getPageCount()).toBe(3);
  });

  it('should handle corrupt annexes gracefully', async () => {
    const mainPdfBytes = await createTestPdf('Main Report');
    const corruptAnnexBytes = Buffer.from('this is not a pdf');

    const annexes: PdfAnnex[] = [
      { name: 'corrupt.pdf', bytes: corruptAnnexBytes },
    ];

    const combinedPdfBytes = await appendPdfAnnexes(mainPdfBytes, annexes);
    const combinedPdf = await PDFDocument.load(combinedPdfBytes);

    expect(combinedPdf.getPageCount()).toBe(1); // Only the main report page
  });

  it('should return only main PDF if no annexes provided', async () => {
    const mainPdfBytes = await createTestPdf('Main Report');
    const combinedPdfBytes = await appendPdfAnnexes(mainPdfBytes, []);
    const combinedPdf = await PDFDocument.load(combinedPdfBytes);

    expect(combinedPdf.getPageCount()).toBe(1);
  });
});
