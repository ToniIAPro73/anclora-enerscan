import { scoreProviderMatch, parseJsonArray } from '../src/lib/domain/partners';

const baseProvider = {
  categories: JSON.stringify(['WINDOWS', 'INSULATION']),
  zones: JSON.stringify(['Mallorca', 'Palma']),
  status: 'VERIFIED',
  verified: true,
  rating: 4.5,
};

describe('scoreProviderMatch', () => {
  it('gives higher score for exact category match', () => {
    const scoreMatch = scoreProviderMatch(baseProvider, { category: 'WINDOWS', zone: 'Mallorca' });
    const scoreNoMatch = scoreProviderMatch(baseProvider, { category: 'SOLAR', zone: 'Mallorca' });
    expect(scoreMatch).toBeGreaterThan(scoreNoMatch);
  });

  it('gives higher score for zone match', () => {
    const scoreMatch = scoreProviderMatch(baseProvider, { category: 'WINDOWS', zone: 'Palma' });
    const scoreNoZone = scoreProviderMatch(baseProvider, { category: 'WINDOWS', zone: 'Barcelona' });
    expect(scoreMatch).toBeGreaterThan(scoreNoZone);
  });

  it('gives bonus score for PREFERRED status', () => {
    const preferred = { ...baseProvider, status: 'PREFERRED' };
    const verified = { ...baseProvider, status: 'VERIFIED' };
    const scorePreferred = scoreProviderMatch(preferred, { category: 'WINDOWS', zone: 'Mallorca' });
    const scoreVerified = scoreProviderMatch(verified, { category: 'WINDOWS', zone: 'Mallorca' });
    expect(scorePreferred).toBeGreaterThan(scoreVerified);
  });

  it('gives highest bonus for EXCLUSIVE status', () => {
    const exclusive = { ...baseProvider, status: 'EXCLUSIVE' };
    const preferred = { ...baseProvider, status: 'PREFERRED' };
    const scoreExclusive = scoreProviderMatch(exclusive, { category: 'WINDOWS', zone: 'Mallorca' });
    const scorePreferred = scoreProviderMatch(preferred, { category: 'WINDOWS', zone: 'Mallorca' });
    expect(scoreExclusive).toBeGreaterThan(scorePreferred);
  });

  it('returns 0 score for no match at all', () => {
    const isolated = { ...baseProvider, categories: JSON.stringify(['HVAC']), zones: JSON.stringify(['Barcelona']), status: 'PENDING', verified: false, rating: 3 };
    const score = scoreProviderMatch(isolated, { category: 'WINDOWS', zone: 'Mallorca' });
    expect(score).toBeLessThan(10);
  });

  it('handles string categories/zones (not JSON)', () => {
    const flatProvider = { ...baseProvider, categories: 'WINDOWS,INSULATION', zones: 'Mallorca,Palma' };
    const score = scoreProviderMatch(flatProvider, { category: 'WINDOWS', zone: 'Mallorca' });
    expect(score).toBeGreaterThan(0);
  });

  it('does zone partial match', () => {
    const score = scoreProviderMatch(baseProvider, { category: 'WINDOWS', zone: 'mallorca' });
    expect(score).toBeGreaterThan(0);
  });
});

describe('parseJsonArray', () => {
  it('parses JSON array', () => {
    expect(parseJsonArray('["WINDOWS","SOLAR"]')).toEqual(['WINDOWS', 'SOLAR']);
  });

  it('parses comma-separated string as fallback', () => {
    expect(parseJsonArray('WINDOWS, SOLAR')).toEqual(['WINDOWS', 'SOLAR']);
  });

  it('returns empty for null', () => {
    expect(parseJsonArray(null)).toEqual([]);
  });
});
