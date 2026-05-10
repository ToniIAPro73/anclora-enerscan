import { selectCostScenarioTemplates } from '../src/lib/costs/scenario-matrix';
import { generateScenarios } from '../src/lib/simulator';
import { PropertyDataV2, ScoreResultV2 } from '../src/lib/domain/energy-assessment';

describe('scenario cost matrix', () => {
  it('selects local scenarios for commercial properties', () => {
    const templates = selectCostScenarioTemplates({ propertyType: 'LOCAL', simulatorScenarioId: 'basic', currentLetter: 'E', targetLetter: 'C' });
    expect(templates[0].id).toMatch(/local/);
  });

  it('selects community scenarios for deep community rehab', () => {
    const templates = selectCostScenarioTemplates({ propertyType: 'COMMUNITY', simulatorScenarioId: 'deep', currentLetter: 'F', targetLetter: 'B' });
    expect(templates.some((template) => template.id.includes('community'))).toBe(true);
  });

  it('adds cost estimates to existing simulator scenarios', () => {
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
      targetLetter: 'C',
    };
    const scoreResult: ScoreResultV2 = {
      score: 75,
      estimatedLetter: 'E',
      confidence: 'Alta',
      climateZone: 'Mediterránea litoral',
      penalties: [],
      strengths: [],
      missingData: [],
      explanation: '',
    };
    const scenarios = generateScenarios(propertyData, scoreResult);
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.some((scenario) => scenario.costEstimate)).toBe(true);
    expect(scenarios.find((scenario) => scenario.id === 'systems')?.costEstimate?.heatPumpTechnicalNote).toMatch(/bomba de calor/i);
  });
});
