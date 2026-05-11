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
  yearBuilt: 2003,
  lat: 39.57,
  lng: 2.65,
  source: 'catastro',
  confidence: 1
};

describe('Catastro Autofill Mapping', () => {
  it('should map cadastral match to wizard fields correctly', () => {
    const autofill = mapCadastralMatchToWizardFields(MOCK_MATCH);
    
    expect(autofill.year).toBe(2003);
    expect(autofill.area).toBe(67); // Rounded
    expect(autofill.zipcode).toBe('07015');
    expect(autofill.address).toBe('CL MIQUEL ROSSELLO I ALEMANY, 48');
    expect(autofill.cadastralReference).toBe('6485534DD6768E0003QD');
    expect(autofill.lat).toBe(39.57);
    expect(autofill.lng).toBe(2.65);
    expect(autofill.propertyType).toBe('flat');
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
  });
});
