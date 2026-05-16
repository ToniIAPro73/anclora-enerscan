import { buildEnergyAssessmentLead } from '../src/lib/integrations/nexus/energy-assessment-lead';
import { sendEnergyAssessmentLeadToNexus } from '../src/lib/integrations/nexus/client';
import { energyAssessmentLeadSchema } from '../src/lib/integrations/nexus/schema';

const baseAssessment = {
  id: 'assessment-123',
  isDemo: false,
  score: 72,
  estimatedLetter: 'C',
  confidence: 'Alta',
  paidAt: new Date('2026-05-16T10:00:00.000Z'),
  stripeSessionId: 'cs_test_123',
  budgetRange: 'medium',
  propertyType: 'flat',
  year: 1998,
  area: 92,
  zipcode: '07141',
  cadastralRecord: {
    province: 'Illes Balears',
    municipality: 'Marratxi',
    address: 'Calle Demo 1',
    cadastralReference: '07036A000000000001AA',
    surfaceBuiltM2: 104,
    surfaceDwellingM2: 92,
  },
  attachments: [
    { id: 'att-1', name: 'cee.pdf', path: '/private/cee.pdf', previewDataUri: 'data:image/png;base64,abc' },
  ],
};

describe('EnergyAssessmentLead', () => {
  it('builds a valid lead payload without attachments or images', () => {
    const payload = buildEnergyAssessmentLead({
      assessment: baseAssessment,
      sourceChannel: 'premium_report',
      eventType: 'premium_report_paid',
      contact: { name: 'Ada', email: 'ada@example.com', phone: '+34123456789', preferredLanguage: 'es' },
      consent: {
        privacyAccepted: true,
        providerContactAccepted: false,
        analyticsAggregationAccepted: true,
        acceptedAt: '2026-05-16T10:00:00.000Z',
        consentVersion: '2026-05-16-v1',
      },
      metadata: { locale: 'es', currency: 'EUR', units: 'metric', sourceUrl: 'https://example.test/assessment/assessment-123' },
      occurredAt: '2026-05-16T10:00:00.000Z',
    });

    expect(energyAssessmentLeadSchema.parse(payload)).toEqual(payload);
    expect(payload.assessment.status).toBe('premium_unlocked');
    expect(payload.commercial.premiumUnlocked).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('attachments');
    expect(JSON.stringify(payload)).not.toContain('previewDataUri');
    expect(JSON.stringify(payload)).not.toContain('/private/cee.pdf');
  });

  it('marks demo assessments and lowers routing priority', () => {
    const payload = buildEnergyAssessmentLead({
      assessment: { ...baseAssessment, id: 'local_demo', isDemo: true, paidAt: null },
      sourceChannel: 'energy_assessment',
      eventType: 'energy_assessment_created',
      consent: { privacyAccepted: true, providerContactAccepted: false, consentVersion: '2026-05-16-v1' },
      metadata: { locale: 'de', currency: 'EUR', units: 'metric' },
      occurredAt: '2026-05-16T10:00:00.000Z',
    });

    expect(payload.assessment.demo).toBe(true);
    expect(payload.routing.priority).toBe('low');
    expect(payload.routing.tags).toContain('demo');
  });

  it('does not include contact when privacy consent is missing', () => {
    const payload = buildEnergyAssessmentLead({
      assessment: baseAssessment,
      sourceChannel: 'provider_request',
      eventType: 'provider_contact_requested',
      contact: { name: 'Ada', email: 'ada@example.com', phone: '+34123456789', preferredLanguage: 'es' },
      consent: { privacyAccepted: false, providerContactAccepted: true, consentVersion: '2026-05-16-v1' },
      metadata: { locale: 'es', currency: 'EUR', units: 'metric' },
      occurredAt: '2026-05-16T10:00:00.000Z',
    });

    expect(payload.contact).toBeNull();
    expect(payload.consent.privacyAccepted).toBe(false);
  });

  it('client returns no-op when Nexus is not configured', async () => {
    const result = await sendEnergyAssessmentLeadToNexus({} as any, {
      env: {},
      fetchImpl: jest.fn(),
    });

    expect(result).toEqual({ ok: true, skipped: true, reason: 'missing_config' });
  });
});
