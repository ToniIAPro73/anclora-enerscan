import { mapCadastralMatchToWizardFields } from '@/lib/catastro/autofill';
import type { CadastralMatch } from '@/lib/catastro/types';

const MOCK_MATCH: CadastralMatch = {
  cadastralReference: '6485534DD6768E0003QD',
  parcelReference: '6485534DD6768E',
  province: 'ILLES BALEARS',
  municipality: 'PALMA',
  address: 'CL MIQUEL ROSSELLO I ALEMANY, 48',
  postalCode: '07015',
  floor: '01',
  door: 'B',
  propertyUse: 'RESIDENCIAL',
  surfaceBuiltM2: 67.45,
  surfaceDwellingM2: 52.3,
  surfaceCommonM2: 15.15,
  yearBuilt: 2003,
  participationCoefficient: 14.57,
  lat: 39.57,
  lng: 2.65,
  source: 'catastro',
  confidence: 1
};

describe('Catastro Autofill Mapping', () => {
  it('should map full cadastral data correctly to wizard fields', () => {
    const autofill = mapCadastralMatchToWizardFields(MOCK_MATCH);
    
    expect(autofill.cadastralReference).toBe('6485534DD6768E0003QD');
    expect(autofill.year).toBe(2003);
    expect(autofill.zipcode).toBe('07015');
    expect(autofill.area).toBe(52); // Dwelling area prioritized and rounded
    expect(autofill.builtAreaM2).toBe(67.45);
    expect(autofill.participationPercent).toBe(14.57);
    expect(autofill.areaSource).toBe('usable');
    expect(autofill.areaRequiresReview).toBe(false);
    expect(autofill.propertyType).toBe('flat');
    expect(autofill.lat).toBe(39.57);
    expect(autofill.lng).toBe(2.65);
  });

  it('should fallback to built area when dwelling area is missing', () => {
    const matchWithoutDwelling = { ...MOCK_MATCH, surfaceDwellingM2: undefined };
    const autofill = mapCadastralMatchToWizardFields(matchWithoutDwelling);
    
    expect(autofill.area).toBe(67); // 67.45 rounded
    expect(autofill.areaSource).toBe('built_fallback');
    expect(autofill.areaRequiresReview).toBe(true);
  });

  it('should handle missing fields gracefully', () => {
    const minimalMatch: CadastralMatch = {
      cadastralReference: 'REF123',
      province: 'PROV',
      municipality: 'MUNI',
      address: 'ADDR',
      source: 'catastro',
      confidence: 1
    };

    const autofill = mapCadastralMatchToWizardFields(minimalMatch);
    expect(autofill.cadastralReference).toBe('REF123');
    expect(autofill.year).toBeUndefined();
    expect(autofill.area).toBeUndefined();
    expect(autofill.areaRequiresReview).toBe(false);
  });
});
