import esLocale from '../public/locales/es/common.json';
import enLocale from '../public/locales/en/common.json';
import deLocale from '../public/locales/de/common.json';
import { buildProviderHandoffRequest, PROVIDER_HANDOFF_CONSENT_COPY } from '../src/lib/integrations/synergi/provider-handoff';
import { sendProviderHandoffToSynergi } from '../src/lib/integrations/synergi/client';
import { providerHandoffRequestSchema } from '../src/lib/integrations/synergi/schema';

const baseInput = {
  assessment: { id: 'assessment-123', isDemo: false, score: 67, estimatedLetter: 'D', confidence: 0.7 },
  propertyContext: {
    province: 'Illes Balears',
    municipality: 'Palma',
    postalCode: '07001',
    propertyType: 'flat',
    constructionYear: 1990,
    builtAreaM2: 92,
  },
  requestedServices: ['cee_official_certificate', 'windows'] as const,
  contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+34123456789', preferredLanguage: 'es' as const },
  consent: {
    providerContactAccepted: true,
    privacyAccepted: true,
    acceptedAt: '2026-05-16T10:00:00.000Z',
    consentVersion: '2026-05-16-v1',
  },
  routing: { priority: 'normal' as const, preferredProviderType: 'certifier' as const, territory: 'mallorca' as const },
  metadata: { locale: 'es' as const, sourceUrl: 'https://example.test/assessment/assessment-123' },
  occurredAt: '2026-05-16T10:00:00.000Z',
};

describe('ProviderHandoffRequest', () => {
  it('requires explicit provider consent', () => {
    expect(() => buildProviderHandoffRequest({
      ...baseInput,
      consent: { ...baseInput.consent, providerContactAccepted: false },
    })).toThrow('providerContactAccepted');
  });

  it('builds a valid payload with consent snapshot and without attachments', () => {
    const payload = buildProviderHandoffRequest(baseInput);

    expect(providerHandoffRequestSchema.parse(payload)).toEqual(payload);
    expect(payload.consent.providerContactAccepted).toBe(true);
    expect(payload.consent.consentTextSnapshot).toBe(PROVIDER_HANDOFF_CONSENT_COPY.es);
    expect(JSON.stringify(payload)).not.toContain('attachments');
    expect(JSON.stringify(payload)).not.toContain('images');
  });

  it('marks demos so they are not real opportunities', () => {
    const payload = buildProviderHandoffRequest({
      ...baseInput,
      assessment: { ...baseInput.assessment, id: 'local_demo', isDemo: true },
    });

    expect(payload.assessment.demo).toBe(true);
    expect(payload.routing.priority).toBe('normal');
  });

  it('locale files expose the required consent copy and default checkbox state', () => {
    expect(esLocale['providerHandoff.consent']).toBe(PROVIDER_HANDOFF_CONSENT_COPY.es);
    expect(enLocale['providerHandoff.consent']).toBe(PROVIDER_HANDOFF_CONSENT_COPY.en);
    expect(deLocale['providerHandoff.consent']).toBe(PROVIDER_HANDOFF_CONSENT_COPY.de);
    expect(esLocale['providerHandoff.checkboxDefault']).toBe('false');
    expect(enLocale['providerHandoff.checkboxDefault']).toBe('false');
    expect(deLocale['providerHandoff.checkboxDefault']).toBe('false');
  });

  it('client returns no-op when Synergi is not configured', async () => {
    const result = await sendProviderHandoffToSynergi({} as any, { env: {}, fetchImpl: jest.fn() });
    expect(result).toEqual({ ok: true, skipped: true, reason: 'missing_config' });
  });
});
