import { classifyAttachment } from '@/lib/ocr/attachment-classifier';

describe('classifyAttachment', () => {
  it('should classify PDF with CEE in name as cee_pdf', () => {
    expect(classifyAttachment({ name: 'mi_cee.pdf', type: 'application/pdf' })).toBe('cee_pdf');
  });

  it('should classify PDF with CEE category as cee_pdf', () => {
    expect(classifyAttachment({ name: 'doc.pdf', type: 'application/pdf', category: 'CEE' })).toBe('cee_pdf');
  });

  it('should classify PDF with presupuesto in name as budget_pdf', () => {
    expect(classifyAttachment({ name: 'presupuesto_reforma.pdf', type: 'application/pdf' })).toBe('budget_pdf');
  });

  it('should classify image MIME type as image', () => {
    expect(classifyAttachment({ name: 'foto.jpg', type: 'image/jpeg' })).toBe('image');
  });

  it('should classify image extension as image', () => {
    expect(classifyAttachment({ name: 'captura.png', type: 'application/octet-stream' })).toBe('image');
  });

  it('should return unknown for unsupported files', () => {
    expect(classifyAttachment({ name: 'notas.txt', type: 'text/plain' })).toBe('unknown');
  });
});
