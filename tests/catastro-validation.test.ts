import {
  CadastralReferenceInputSchema,
  CatastroAddressInputSchema,
  CatastroCoordinatesInputSchema,
  CatastroResolveRequestSchema,
} from '@/lib/catastro/types';

describe('Catastro input validation', () => {
  it('normalizes valid cadastral references before resolving', () => {
    expect(CadastralReferenceInputSchema.parse(' 6485534dd6768e0003qd ')).toBe('6485534DD6768E0003QD');
    expect(CatastroResolveRequestSchema.parse({
      mode: 'rc',
      rc: '6485534 dd6768e0003qd',
    })).toEqual({
      mode: 'rc',
      rc: '6485534DD6768E0003QD',
    });
  });

  it('rejects empty or malformed cadastral references', () => {
    expect(CadastralReferenceInputSchema.safeParse('').success).toBe(false);
    expect(CadastralReferenceInputSchema.safeParse('not-a-reference').success).toBe(false);
  });

  it('rejects incomplete address lookups', () => {
    expect(CatastroAddressInputSchema.safeParse({
      province: 'ILLES BALEARS',
      municipality: 'PALMA',
      street: 'MIQUEL ROSSELLO I ALEMANY',
      number: '',
    }).success).toBe(false);
  });

  it('rejects invalid coordinates', () => {
    expect(CatastroCoordinatesInputSchema.safeParse({ lat: 91, lng: 2.65 }).success).toBe(false);
    expect(CatastroCoordinatesInputSchema.safeParse({ lat: 39.57, lng: -181 }).success).toBe(false);
  });
});
