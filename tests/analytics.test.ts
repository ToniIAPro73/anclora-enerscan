import { sanitizeAnalyticsPayload, trackEvent } from '@/lib/analytics';

describe('analytics', () => {
  it('removes personal data from payloads', () => {
    const payload = sanitizeAnalyticsPayload({
      assessmentId: 'assess_1',
      userEmail: 'person@example.com',
      userPhone: '+34123456789',
      address: 'Calle Mayor 1',
      cadastralReference: '1234567AB1234C0001DE',
      zipcode: '07015',
    });
    expect(payload).toEqual({ assessmentId: 'assess_1', zipcodePrefix: '07' });
  });

  it('does not throw without PostHog configuration', () => {
    expect(() => trackEvent('checkout_initiated', { assessmentId: 'assess_1' })).not.toThrow();
  });
});
