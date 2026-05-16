import { assertCanDownloadPremiumPdf, canAccessPremiumContent } from '@/lib/premium-access';

describe('premium access', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_DEMO_PREMIUM;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows premium access when paidAt is present', () => {
    const access = canAccessPremiumContent({ paidAt: new Date('2026-05-16T10:00:00Z') });
    expect(access.isPaid).toBe(true);
    expect(access.reason).toBe('paid');
    expect(assertCanDownloadPremiumPdf(access)).toBe(true);
  });

  it('does not treat legacy isPremium as paid without paidAt', () => {
    const access = canAccessPremiumContent({ isPremium: true });
    expect(access.isPaid).toBe(false);
    expect(access.reason).toBe('unpaid');
    expect(assertCanDownloadPremiumPdf(access)).toBe(false);
  });

  it('allows authorized demo premium access', () => {
    process.env.ENABLE_DEMO_PREMIUM = 'true';
    const access = canAccessPremiumContent({ isDemo: true });
    expect(access.isPaid).toBe(true);
    expect(access.reason).toBe('demo');
  });

  it('keeps unpaid assessments blocked', () => {
    const access = canAccessPremiumContent({});
    expect(access.isPaid).toBe(false);
    expect(assertCanDownloadPremiumPdf(access)).toBe(false);
  });
});
