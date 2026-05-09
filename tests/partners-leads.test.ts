import {
  calculateAttributionExpiry,
  formatLeadStatus,
  formatProviderCategory,
  formatProviderStatus,
  parseJsonArray,
  safeCentsToEuros,
} from '../src/lib/domain/partners';
import { leadRequestSchema } from '../src/lib/lead-validation';

describe('partner and lead helpers', () => {
  it('parses JSON arrays and comma separated fallbacks', () => {
    expect(parseJsonArray('["CEE","WINDOWS"]')).toEqual(['CEE', 'WINDOWS']);
    expect(parseJsonArray('CEE, WINDOWS')).toEqual(['CEE', 'WINDOWS']);
    expect(parseJsonArray(null)).toEqual([]);
  });

  it('formats known categories and statuses', () => {
    expect(formatProviderCategory('CEE')).toBe('Certificación energética');
    expect(formatProviderStatus('PREFERRED')).toBe('Preferente');
    expect(formatLeadStatus('QUOTED')).toBe('Presupuestado');
  });

  it('calculates attribution expiry by month', () => {
    const result = calculateAttributionExpiry(12, new Date('2026-05-09T00:00:00.000Z'));
    expect(result.toISOString().slice(0, 10)).toBe('2027-05-09');
  });

  it('formats cents safely as euros', () => {
    expect(safeCentsToEuros(12345)).toContain('123,45');
    expect(safeCentsToEuros(null)).toBe('0,00 EUR');
  });
});

describe('lead request validation', () => {
  it('requires consent and at least one contact method', () => {
    const result = leadRequestSchema.safeParse({ consentAccepted: false });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid lead request', () => {
    const result = leadRequestSchema.safeParse({
      assessmentId: 'assessment-demo',
      providerId: 'provider-demo',
      userEmail: 'demo@example.com',
      requestedService: 'CEE',
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
  });
});
