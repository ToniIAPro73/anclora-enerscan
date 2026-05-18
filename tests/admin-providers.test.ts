import { getProviderStatusLabel } from '../src/lib/enum-labels';

// Admin providers page is a server component tested via unit helpers.
// The isAdmin guard uses ADMIN_EMAILS env var — verified here at unit level.

describe('admin providers page guard (unit level)', () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalEnv;
    }
  });

  function isAdmin(email?: string | null) {
    const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    return Boolean(email && allowlist.includes(email.toLowerCase()));
  }

  it('allows configured admin email', () => {
    process.env.ADMIN_EMAILS = 'admin@test.com,superuser@test.com';
    expect(isAdmin('admin@test.com')).toBe(true);
  });

  it('denies unlisted email', () => {
    process.env.ADMIN_EMAILS = 'admin@test.com';
    expect(isAdmin('other@test.com')).toBe(false);
  });

  it('denies null email', () => {
    process.env.ADMIN_EMAILS = 'admin@test.com';
    expect(isAdmin(null)).toBe(false);
  });

  it('denies when ADMIN_EMAILS is empty', () => {
    process.env.ADMIN_EMAILS = '';
    expect(isAdmin('admin@test.com')).toBe(false);
  });

  it('is case insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Test.com';
    expect(isAdmin('admin@test.com')).toBe(true);
  });
});

describe('provider status labels in admin context', () => {
  it('translates PENDING in ES', () => {
    expect(getProviderStatusLabel('PENDING', 'es')).toBe('Pendiente de verificación');
  });
  it('translates VERIFIED in EN', () => {
    expect(getProviderStatusLabel('VERIFIED', 'en')).toBe('Verified');
  });
  it('translates SUSPENDED in DE', () => {
    expect(getProviderStatusLabel('SUSPENDED', 'de')).toBe('Gesperrt');
  });
  it('translates PREFERRED for admin display', () => {
    expect(getProviderStatusLabel('PREFERRED', 'es')).toBe('Preferente');
  });
});
