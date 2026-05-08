import { isAllowedAttachment, MAX_ATTACHMENT_SIZE } from '../src/lib/attachments';
import { normalizeLanguage, normalizeTheme } from '../src/lib/preferences';

describe('attachment validation', () => {
  it('accepts supported document and image formats under the limit', () => {
    expect(isAllowedAttachment({ name: 'fachada.webp', type: 'image/webp', size: 1200 })).toBe(true);
    expect(isAllowedAttachment({ name: 'cee.pdf', type: 'application/pdf', size: 1200 })).toBe(true);
    expect(isAllowedAttachment({ name: 'notas.md', type: 'text/plain', size: 1200 })).toBe(true);
  });

  it('rejects unsupported extensions even with a generic mime type', () => {
    expect(isAllowedAttachment({ name: 'script.exe', type: 'application/octet-stream', size: 1200 })).toBe(false);
  });

  it('exposes an 8 MB upload limit', () => {
    expect(MAX_ATTACHMENT_SIZE).toBe(8 * 1024 * 1024);
  });
});

describe('preference normalization', () => {
  it('persists only supported language and theme values', () => {
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('fr')).toBe('es');
    expect(normalizeTheme('system')).toBe('system');
    expect(normalizeTheme('sepia')).toBe('dark');
  });
});
