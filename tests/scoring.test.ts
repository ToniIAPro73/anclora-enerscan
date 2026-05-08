import { calculateScore } from '../src/lib/scoring';

describe('Scoring Logic', () => {
  test('calculates letter G for old house with electric heating and simple windows', () => {
    const result = calculateScore({
      year: 1970,
      propertyType: 'piso',
      heating: 'electric',
      windows: 'simple',
      renewables: 'none'
    });
    expect(['F', 'G']).toContain(result.estimatedLetter);
    expect(result.penalties.length).toBeGreaterThan(0);
  });

  test('calculates a better letter for modern house with aerothermia', () => {
    const result = calculateScore({
      year: 2020,
      propertyType: 'unifamiliar',
      heating: 'aerothermia',
      windows: 'triple',
      renewables: 'fv'
    });
    // Expected to be much better than G
    expect(['A', 'B', 'C']).toContain(result.estimatedLetter);
  });
});
