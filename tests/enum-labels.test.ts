import {
  getPropertyTypeLabel,
  getBudgetReviewStatusLabel,
  getProviderStatusLabel,
  getLeadStatusLabel,
  getProfessionalAccessStatusLabel,
  getAssessmentPaymentStatusLabel,
  getConfidenceLevelLabel,
} from '../src/lib/enum-labels';

describe('getPropertyTypeLabel', () => {
  it('translates house in ES', () => {
    expect(getPropertyTypeLabel('house', 'es')).toBe('Casa unifamiliar');
  });
  it('translates flat in EN', () => {
    expect(getPropertyTypeLabel('flat', 'en')).toBe('Flat / Apartment');
  });
  it('translates house in DE', () => {
    expect(getPropertyTypeLabel('house', 'de')).toBe('Einfamilienhaus');
  });
  it('translates flat in ES', () => {
    expect(getPropertyTypeLabel('flat', 'es')).toBe('Piso / Apartamento');
  });
  it('returns em dash for null', () => {
    expect(getPropertyTypeLabel(null, 'es')).toBe('—');
  });
  it('returns em dash for undefined', () => {
    expect(getPropertyTypeLabel(undefined, 'es')).toBe('—');
  });
  it('returns unknown type label for unrecognized value', () => {
    expect(getPropertyTypeLabel('studio', 'es')).toBe('studio');
  });
});

describe('getBudgetReviewStatusLabel', () => {
  it('translates DRAFT in ES', () => {
    expect(getBudgetReviewStatusLabel('DRAFT', 'es')).toBe('Borrador');
  });
  it('translates ANALYZED in EN', () => {
    expect(getBudgetReviewStatusLabel('ANALYZED', 'en')).toBe('Analysed');
  });
  it('translates DRAFT in DE', () => {
    expect(getBudgetReviewStatusLabel('DRAFT', 'de')).toBe('Entwurf');
  });
});

describe('getProviderStatusLabel', () => {
  it('translates PENDING in ES', () => {
    expect(getProviderStatusLabel('PENDING', 'es')).toBe('Pendiente de verificación');
  });
  it('translates VERIFIED in EN', () => {
    expect(getProviderStatusLabel('VERIFIED', 'en')).toBe('Verified');
  });
  it('translates PREFERRED in DE', () => {
    expect(getProviderStatusLabel('PREFERRED', 'de')).toBe('Bevorzugt');
  });
  it('translates SUSPENDED in ES', () => {
    expect(getProviderStatusLabel('SUSPENDED', 'es')).toBe('Suspendido');
  });
});

describe('getLeadStatusLabel', () => {
  it('translates PENDING in ES', () => {
    expect(getLeadStatusLabel('PENDING', 'es')).toBe('Pendiente');
  });
  it('translates WON in EN', () => {
    expect(getLeadStatusLabel('WON', 'en')).toBe('Won');
  });
  it('translates CANCELLED in DE', () => {
    expect(getLeadStatusLabel('CANCELLED', 'de')).toBe('Abgebrochen');
  });
});

describe('getProfessionalAccessStatusLabel', () => {
  it('translates PENDING in ES', () => {
    expect(getProfessionalAccessStatusLabel('PENDING', 'es')).toBe('Pendiente de revisión');
  });
  it('translates APPROVED in EN', () => {
    expect(getProfessionalAccessStatusLabel('APPROVED', 'en')).toBe('Approved');
  });
  it('translates NONE in DE', () => {
    expect(getProfessionalAccessStatusLabel('NONE', 'de')).toBe('Keine Anfrage');
  });
});

describe('getAssessmentPaymentStatusLabel', () => {
  it('translates DRAFT in ES', () => {
    expect(getAssessmentPaymentStatusLabel('DRAFT', 'es')).toBe('Borrador');
  });
  it('translates unpaid in EN', () => {
    expect(getAssessmentPaymentStatusLabel('unpaid', 'en')).toBe('Free');
  });
  it('translates paid in DE', () => {
    expect(getAssessmentPaymentStatusLabel('paid', 'de')).toBe('Premium');
  });
});

describe('getConfidenceLevelLabel', () => {
  it('translates high in ES', () => {
    expect(getConfidenceLevelLabel('high', 'es')).toBe('Alta');
  });
  it('translates medium in EN', () => {
    expect(getConfidenceLevelLabel('medium', 'en')).toBe('Medium');
  });
  it('translates low in DE', () => {
    expect(getConfidenceLevelLabel('low', 'de')).toBe('Niedrig');
  });
});
