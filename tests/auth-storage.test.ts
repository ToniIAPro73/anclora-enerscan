import { hashPassword, verifyPassword, createPasswordResetToken, hashToken } from '../src/lib/password';
import { isBlobAttachmentPath, toBlobPathname } from '../src/lib/blob-storage';

describe('auth password helpers', () => {
  it('hashes and verifies passwords without storing the raw value', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^scrypt:/);
    expect(hash).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('hashes reset tokens deterministically for database lookup', () => {
    const token = createPasswordResetToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});

describe('blob attachment helpers', () => {
  it('detects and unwraps internal blob paths', () => {
    expect(isBlobAttachmentPath('blob:assessments/a/file.pdf')).toBe(true);
    expect(isBlobAttachmentPath('/tmp/file.pdf')).toBe(false);
    expect(toBlobPathname('blob:assessments/a/file.pdf')).toBe('assessments/a/file.pdf');
  });
});
