import { calculateScenarioCostEstimate } from '../src/lib/costs/cost-engine';
import { PropertyDataV2 } from '../src/lib/domain/energy-assessment';

const propertyData: PropertyDataV2 = {
  year: 1998,
  area: 185,
  zipcode: '07141',
  propertyType: 'house',
  roofType: 'pitched',
  heating: 'gas',
  cooling: 'split',
  waterHeating: 'gas',
  windows: 'double',
  renewables: 'none',
  facadeInsulation: 'partial',
  roofInsulation: 'good',
};

describe('cost engine', () => {
  it('returns ranges, source summary and required disclaimers', () => {
    const estimate = calculateScenarioCostEstimate({
      scenarioId: 'systems',
      scenarioTitle: 'Electrificación eficiente',
      propertyData,
      measureCodes: ['install_heat_pump_air_water'],
      propertyType: 'SINGLE_FAMILY',
      region: '07141',
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.minTotal).toBeLessThan(estimate!.maxTotal);
    expect(estimate!.midTotal).toBeGreaterThan(estimate!.minTotal);
    expect(estimate!.sourceSummary).toMatch(/ANCLORA_INTERNAL_COST_SEED_2026_05/);
    expect(estimate!.disclaimers.join(' ')).toMatch(/oferta vinculante|presupuesto/);
    expect(estimate!.heatPumpTechnicalNote).toMatch(/COP/);
  });

  it('does not produce invalid ranges for deep scenarios', () => {
    const estimate = calculateScenarioCostEstimate({
      scenarioId: 'deep',
      scenarioTitle: 'Reforma profunda',
      propertyData,
      measureCodes: ['deep_energy_retrofit', 'install_pv'],
      propertyType: 'SINGLE_FAMILY',
      quality: 'PREMIUM',
      complexity: 'HIGH',
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.lines.length).toBeGreaterThan(0);
    expect(estimate!.minTotal).toBeLessThanOrEqual(estimate!.maxTotal);
  });

  it('skips non applicable measures instead of forcing costs', () => {
    const flat = { ...propertyData, propertyType: 'flat' as const, area: 90 };
    const estimate = calculateScenarioCostEstimate({
      scenarioId: 'community',
      scenarioTitle: 'Comunidad',
      propertyData: flat,
      measureCodes: ['community_facade_rehab'],
      propertyType: 'FLAT',
    });
    expect(estimate).toBeNull();
  });
});
