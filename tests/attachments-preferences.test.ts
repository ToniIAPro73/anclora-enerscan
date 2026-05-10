import { isAllowedAttachment, MAX_ATTACHMENT_SIZE, MAX_TOTAL_ATTACHMENT_SIZE_BYTES, validateAttachments } from '../src/lib/attachments';
import { normalizeLanguage, normalizeTheme } from '../src/lib/preferences';

describe('attachment validation', () => {
  it('accepts supported document and image formats under the limit', () => {
    expect(isAllowedAttachment({ name: 'fachada.webp', type: 'image/webp', size: 1200 })).toBe(true);
    expect(isAllowedAttachment({ name: 'cee.pdf', type: 'application/pdf', size: 1200 })).toBe(true);
    expect(isAllowedAttachment({ name: 'foto.png', type: 'image/png', size: 1200 })).toBe(true);
  });

  it('rejects unsupported extensions even with a generic mime type', () => {
    expect(isAllowedAttachment({ name: 'script.exe', type: 'application/octet-stream', size: 1200 })).toBe(false);
  });

  it('exposes per-file and total upload limits', () => {
    expect(MAX_ATTACHMENT_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_TOTAL_ATTACHMENT_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('rejects unsupported markdown and oversized batches with clear errors', () => {
    expect(validateAttachments([{ name: 'notas.md', type: 'text/plain', size: 1200 }])).toContain('Tipo de archivo no admitido');
    expect(validateAttachments([
      { name: 'a.pdf', type: 'application/pdf', size: 30 * 1024 * 1024 },
    ])).toContain('supera el límite');
  });
});

describe('preference normalization', () => {
  it('keeps the public app in Spanish until full translations are complete', () => {
    expect(normalizeLanguage('en')).toBe('es');
    expect(normalizeLanguage('de')).toBe('es');
    expect(normalizeLanguage('fr')).toBe('es');
  });

  it('persists only supported theme values', () => {
    expect(normalizeTheme('system')).toBe('system');
    expect(normalizeTheme('sepia')).toBe('dark');
  });
});
