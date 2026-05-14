import { REGULATORY_DISCLAIMER, REGULATORY_TIMELINE } from '../src/lib/regulatory';
import { calculateScoreV2 } from '../src/lib/scoring';
import { generateScenarios } from '../src/lib/simulator';
import { getRelevantSubsidies, SUBSIDY_DISCLAIMER } from '../src/lib/subsidies';
import { PropertyDataV2 } from '../src/lib/domain/energy-assessment';

const property: PropertyDataV2 = {
  year: 1998,
  area: 185,
  zipcode: '07141',
  propertyType: 'house',
  orientation: 'south',
  roofType: 'pitched',
  heating: 'gas',
  cooling: 'split',
  waterHeating: 'gas',
  ventilation: 'natural',
  windows: 'double',
  renewables: 'none',
  facadeInsulation: 'partial',
  roofInsulation: 'good',
};

describe('regulatory context', () => {
  it('uses current EPBD wording and distinguishes Spanish official CEE', () => {
    expect(REGULATORY_DISCLAIMER).toContain('Directiva (UE) 2024/1275');
    expect(REGULATORY_DISCLAIMER).toContain('Real Decreto 390/2021');
    expect(REGULATORY_DISCLAIMER).not.toMatch(/borrador/i);
    expect(REGULATORY_TIMELINE.map((item) => item.legalReference)).toEqual(expect.arrayContaining([
      'Real Decreto 390/2021',
      'Directiva (UE) 2024/1275',
    ]));
    expect(REGULATORY_TIMELINE.every((item) => item.impactOnUser.length > 20)).toBe(true);
  });
});

describe('simulator v1.1', () => {
  it('returns actionable scenarios with qualitative disclaimers', () => {
    const score = calculateScoreV2(property);
    const scenarios = generateScenarios(property, score);

    expect(scenarios.length).toBeGreaterThanOrEqual(4);
    expect(scenarios.map((scenario) => scenario.id)).toEqual(expect.arrayContaining(['envelope', 'systems', 'renewables', 'deep']));
    expect(scenarios.every((scenario) => scenario.rationale && scenario.complexity && scenario.priority)).toBe(true);
    expect(scenarios.flatMap((scenario) => scenario.measures)).toEqual(expect.arrayContaining([
      expect.stringMatching(/bomba de calor|aerotermia/i),
      expect.stringMatching(/fotovoltaica/i),
    ]));
  });

  it('adapts scenario focus to the assessment objective', () => {
    const score = calculateScoreV2(property);
    const targetScenarios = generateScenarios({ ...property, objective: 'target_letter', targetLetter: 'C' }, score);
    const saleScenarios = generateScenarios({ ...property, objective: 'sale_rent' }, score);
    const diagnosticScenarios = generateScenarios({ ...property, objective: 'current_state' }, score);

    expect(targetScenarios[0].objective).toContain('letra C');
    expect(targetScenarios[0].estimatedScoreDelta).toBeGreaterThanOrEqual(targetScenarios[targetScenarios.length - 1].estimatedScoreDelta ?? 0);
    expect(saleScenarios[0].objective).toMatch(/venta o alquiler/i);
    expect(saleScenarios[0].dependencies).toEqual(expect.arrayContaining([
      expect.stringMatching(/documentaci[oó]n de mejoras/i),
    ]));
    expect(diagnosticScenarios[0].id).toBe('basic');
    expect(diagnosticScenarios[0].objective).toMatch(/situaci[oó]n energ[eé]tica actual/i);
  });
});

describe('subsidies', () => {
  it('returns informational subsidy items without promising eligibility', () => {
    const items = getRelevantSubsidies(property);

    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(SUBSIDY_DISCLAIMER).toContain('no garantiza elegibilidad');
    expect(items.every((item) => item.eligibilityDisclaimer.length > 40)).toBe(true);
    expect(items.map((item) => item.eligibilityDisclaimer).join(' ')).not.toMatch(/elegible automáticamente|importe garantizado/i);
  });
});
