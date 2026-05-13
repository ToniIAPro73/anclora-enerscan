import { mapMatchesToFeatures } from '@/lib/catastro/map-features';
import type { CadastralMatch } from '@/lib/catastro/types';

describe('Catastro map features', () => {
  it('creates selectable fallback features from matches with coordinates', () => {
    const match: CadastralMatch = {
      cadastralReference: '6485534DD6768E0003QD',
      parcelReference: '6485534DD6768E',
      province: 'ILLES BALEARS',
      municipality: 'PALMA',
      address: 'CL MIQUEL ROSSELLO I ALEMANY, 48',
      floor: '01',
      door: 'B',
      lat: 39.5696,
      lng: 2.6502,
      source: 'catastro',
      confidence: 1,
    };

    const features = mapMatchesToFeatures([match], match.cadastralReference);

    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      id: '6485534DD6768E0003QD',
      kind: 'unit',
      selected: true,
      source: 'fallback',
      center: { lat: 39.5696, lng: 2.6502 },
    });
    expect(features[0].bounds).toBeDefined();
  });
});
