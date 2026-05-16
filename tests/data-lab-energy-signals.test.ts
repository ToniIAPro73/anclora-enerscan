import { buildEnergySignalAggregates, getAreaBucket, getConstructionYearBucket } from '../src/lib/integrations/data-lab/aggregator';
import { sendEnergySignalsToDataLab } from '../src/lib/integrations/data-lab/client';
import { energySignalAggregateSchema } from '../src/lib/integrations/data-lab/schema';

const assessments = [
  { id: 'a1', province: 'Illes Balears', municipality: 'Palma', postalCode: '07001', propertyType: 'flat', year: 1975, area: 55, score: 40, confidence: 0.5, estimatedLetter: 'F', paidAt: null, providerRequested: false, regulatoryGap: 'high', improvementPotential: 'high', address: 'Street 1', cadastralReference: 'RC1' },
  { id: 'a2', province: 'Illes Balears', municipality: 'Palma', postalCode: '07002', propertyType: 'flat', year: 1990, area: 80, score: 55, confidence: 0.6, estimatedLetter: 'E', paidAt: new Date(), providerRequested: true, regulatoryGap: null, improvementPotential: 'medium', address: 'Street 2', cadastralReference: 'RC2' },
  { id: 'a3', province: 'Illes Balears', municipality: 'Palma', postalCode: '07003', propertyType: 'flat', year: 2010, area: 120, score: 75, confidence: 0.7, estimatedLetter: 'C', paidAt: null, providerRequested: false, regulatoryGap: null, improvementPotential: 'low', address: 'Street 3', cadastralReference: 'RC3' },
  { id: 'a4', province: 'Illes Balears', municipality: 'Palma', postalCode: '07004', propertyType: 'flat', year: 2021, area: 220, score: 88, confidence: 0.8, estimatedLetter: 'B', paidAt: new Date(), providerRequested: true, regulatoryGap: null, improvementPotential: 'low', address: 'Street 4', cadastralReference: 'RC4' },
  { id: 'a5', province: 'Illes Balears', municipality: 'Palma', postalCode: '07005', propertyType: 'flat', year: null, area: null, score: 61, confidence: 0.6, estimatedLetter: 'D', paidAt: null, providerRequested: false, regulatoryGap: 'medium', improvementPotential: 'high', address: 'Street 5', cadastralReference: 'RC5' },
];

describe('EnergySignalAggregate', () => {
  it('builds anonymized aggregates and validates schema', () => {
    const [aggregate] = buildEnergySignalAggregates(assessments, {
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-16T00:00:00.000Z',
      granularity: 'week',
      minGroupSize: 5,
    });

    expect(energySignalAggregateSchema.parse(aggregate)).toEqual(aggregate);
    expect(aggregate.metrics.assessmentCount).toBe(5);
    expect(aggregate.geography.postalCodePrefix).toBe('07');
    expect(aggregate.privacy).toEqual({
      anonymized: true,
      minGroupSize: 5,
      piiIncluded: false,
      aggregationRule: 'k-anonymity-threshold',
    });
    expect(JSON.stringify(aggregate)).not.toContain('Street');
    expect(JSON.stringify(aggregate)).not.toContain('RC');
    expect(JSON.stringify(aggregate)).not.toContain('a1');
  });

  it('suppresses groups below minGroupSize', () => {
    const aggregates = buildEnergySignalAggregates(assessments.slice(0, 4), {
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-16T00:00:00.000Z',
      granularity: 'week',
      minGroupSize: 5,
    });

    expect(aggregates).toEqual([]);
  });

  it('generates construction year and area buckets', () => {
    expect(getConstructionYearBucket(1979)).toBe('pre_1980');
    expect(getConstructionYearBucket(1990)).toBe('1980_2006');
    expect(getConstructionYearBucket(2015)).toBe('2007_2019');
    expect(getConstructionYearBucket(2024)).toBe('2020_plus');
    expect(getConstructionYearBucket(null)).toBe('unknown');
    expect(getAreaBucket(50)).toBe('lt_60');
    expect(getAreaBucket(80)).toBe('60_100');
    expect(getAreaBucket(120)).toBe('100_180');
    expect(getAreaBucket(220)).toBe('180_plus');
    expect(getAreaBucket(null)).toBe('unknown');
  });

  it('client returns no-op when Data Lab is not configured', async () => {
    const result = await sendEnergySignalsToDataLab([], { env: {}, fetchImpl: jest.fn() });
    expect(result).toEqual({ ok: true, skipped: true, reason: 'missing_config' });
  });
});
