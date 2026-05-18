import {
  buildEvidenceMatrix,
  buildEvidenceSummary,
  getEvidenceSourceLabel,
  getEvidenceConfidenceLabel,
  getEvidenceFieldLabel,
} from '../src/lib/evidence/evidence-matrix';

const baseAssessment = {
  year: 1985,
  area: 90,
  zipcode: '07001',
  propertyType: 'flat',
  windows: 'double',
  facadeInsulation: 'none',
  roofInsulation: null,
  heating: 'gas',
  waterHeating: 'gas',
  cooling: null,
  renewables: null,
};

describe('buildEvidenceMatrix', () => {
  it('marks year as user_declared when no catastro', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const yearItem = matrix.find((i) => i.key === 'yearBuilt');
    expect(yearItem?.source).toBe('user_declared');
    expect(yearItem?.value).toBe(1985);
  });

  it('marks year as catastro when cadastral record has yearBuilt', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: {
        cadastralReference: 'TEST001',
        address: 'Calle Mayor 1',
        postalCode: '07001',
        yearBuilt: 1990,
        surfaceBuiltM2: 95,
        surfaceDwellingM2: 80,
      },
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const yearItem = matrix.find((i) => i.key === 'yearBuilt');
    expect(yearItem?.source).toBe('catastro');
    expect(yearItem?.confidence).toBe('high');
  });

  it('marks CEE as not_available when no CEE document', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const ceeItem = matrix.find((i) => i.key === 'ceeSubmitted');
    expect(ceeItem?.source).toBe('not_available');
    expect(ceeItem?.value).toBeNull();
    expect(ceeItem?.usedInScore).toBe(false);
  });

  it('marks CEE as cee_document when CEE is present', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: true,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const ceeItem = matrix.find((i) => i.key === 'ceeSubmitted');
    expect(ceeItem?.source).toBe('cee_document');
    expect(ceeItem?.confidence).toBe('high');
    expect(ceeItem?.usedInScore).toBe(true);
  });

  it('marks manually declared data as user_declared', () => {
    const matrix = buildEvidenceMatrix({
      assessment: { ...baseAssessment, windows: 'single' },
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const windowsItem = matrix.find((i) => i.key === 'windows');
    expect(windowsItem?.source).toBe('user_declared');
  });

  it('includes photos when photoCount > 0', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 3,
    });
    const photoItem = matrix.find((i) => i.key === 'photosSubmitted');
    expect(photoItem).toBeDefined();
    expect(photoItem?.value).toBe(3);
    expect(photoItem?.source).toBe('photo_attachment');
  });

  it('does not include photos item when photoCount is 0', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const photoItem = matrix.find((i) => i.key === 'photosSubmitted');
    expect(photoItem).toBeUndefined();
  });

  it('sets requiresReview when property type is missing', () => {
    const matrix = buildEvidenceMatrix({
      assessment: { ...baseAssessment, propertyType: null },
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const typeItem = matrix.find((i) => i.key === 'propertyType');
    expect(typeItem?.requiresReview).toBe(true);
    expect(typeItem?.source).toBe('not_available');
  });

  it('does not include personal data fields', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: null,
      hasCeeDocument: false,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const keys = matrix.map((i) => i.key);
    expect(keys).not.toContain('userEmail');
    expect(keys).not.toContain('userPhone');
    expect(keys).not.toContain('userName');
  });
});

describe('buildEvidenceSummary', () => {
  it('counts items with data', () => {
    const matrix = buildEvidenceMatrix({
      assessment: baseAssessment,
      cadastralRecord: {
        cadastralReference: 'TEST001',
        address: 'Test',
        postalCode: '07001',
        yearBuilt: 1990,
        surfaceBuiltM2: 95,
      },
      hasCeeDocument: true,
      hasBudgetDocument: false,
      photoCount: 0,
    });
    const summary = buildEvidenceSummary(matrix);
    expect(summary.catastroItems).toBeGreaterThan(0);
    expect(summary.ceeItems).toBeGreaterThan(0);
    expect(summary.withData).toBeGreaterThan(0);
    expect(summary.total).toBeGreaterThan(0);
  });
});

describe('evidence label helpers', () => {
  it('returns source label in ES', () => {
    expect(getEvidenceSourceLabel('catastro', 'es')).toBe('Catastro oficial');
  });
  it('returns source label in EN', () => {
    expect(getEvidenceSourceLabel('not_available', 'en')).toBe('Not available');
  });
  it('returns confidence label in DE', () => {
    expect(getEvidenceConfidenceLabel('high', 'de')).toBe('Hoch');
  });
  it('returns field label in ES', () => {
    expect(getEvidenceFieldLabel('yearBuilt', 'es')).toBe('Año de construcción');
  });
  it('returns field label in EN', () => {
    expect(getEvidenceFieldLabel('windows', 'en')).toBe('Windows');
  });
});
