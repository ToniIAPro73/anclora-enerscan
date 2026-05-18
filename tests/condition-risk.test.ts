import { buildConditionRiskItems } from '../src/lib/condition-risk/rules';
import { buildConditionRiskSummary, getTopRiskItems } from '../src/lib/condition-risk/summary';
import { getCategoryLabel, getElementLabel, getModuleDisclaimer } from '../src/lib/condition-risk/types';

const baseInput = {
  year: 1990,
  propertyType: 'flat',
  roofType: 'shared',
  windows: 'double',
  facadeInsulation: 'none',
  roofInsulation: null,
  ventilation: 'natural',
  heating: 'gas',
  waterHeating: 'gas',
  cooling: null,
  renewables: null,
  hasCeeDocument: false,
  hasBudgetDocument: false,
  hasCatastro: false,
  isMultiFamily: true,
  photoCount: 0,
};

describe('buildConditionRiskItems', () => {
  it('generates one item per element', () => {
    const items = buildConditionRiskItems(baseInput);
    expect(items.length).toBe(11);
  });

  it('marks windows as category 2 when single and old building', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      year: 1970,
      windows: 'single',
    });
    const windowsItem = items.find((i) => i.element === 'windows');
    expect(windowsItem?.category).toBe(2);
  });

  it('marks windows as category 2 when no windows data on old building', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      year: 1970,
      windows: null,
    });
    const windowsItem = items.find((i) => i.element === 'windows');
    expect(windowsItem?.category).toBe(2);
  });

  it('marks dampness as category 3 when declared', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      declaredDampness: true,
    });
    const dampnessItem = items.find((i) => i.element === 'dampness');
    expect(dampnessItem?.category).toBe(3);
    expect(dampnessItem?.requiresProfessionalReview).toBe(true);
  });

  it('marks dampness as category 2 when condensation declared', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      declaredCondensation: true,
    });
    const dampnessItem = items.find((i) => i.element === 'dampness');
    expect(dampnessItem?.category).toBe(2);
  });

  it('does not set high confidence for unknown data', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      heating: null,
    });
    const heatingItem = items.find((i) => i.element === 'heating');
    expect(heatingItem?.confidence).not.toBe('high');
  });

  it('marks electricity as category 2 for very old building', () => {
    const items = buildConditionRiskItems({ ...baseInput, year: 1950 });
    const elecItem = items.find((i) => i.element === 'electricity_basic');
    expect(elecItem?.category).toBe(2);
  });

  it('marks electricity as category 1 for newer building', () => {
    const items = buildConditionRiskItems({ ...baseInput, year: 1995 });
    const elecItem = items.find((i) => i.element === 'electricity_basic');
    expect(elecItem?.category).toBe(1);
  });

  it('marks accessibility as category 2 for high floor without elevator', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      isMultiFamily: true,
      floor: 4,
      hasElevator: false,
    });
    const accessItem = items.find((i) => i.element === 'accessibility');
    expect(accessItem?.category).toBe(2);
  });

  it('marks accessibility as category 1 for ground floor', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      isMultiFamily: true,
      floor: 0,
      hasElevator: null,
    });
    const accessItem = items.find((i) => i.element === 'accessibility');
    expect(accessItem?.category).toBe(1);
  });

  it('marks common_elements as category 2 for multiunit with facade intervention', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      isMultiFamily: true,
      affectsCommonElements: true,
    });
    const ceItem = items.find((i) => i.element === 'common_elements');
    expect(ceItem?.category).toBe(2);
  });

  it('does not invent high confidence category 3 without data', () => {
    const items = buildConditionRiskItems({
      ...baseInput,
      windows: null,
      heating: null,
      ventilation: null,
    });
    const highConfCat3 = items.filter((i) => i.category === 3 && i.confidence === 'high');
    expect(highConfCat3.length).toBe(0);
  });
});

describe('buildConditionRiskSummary', () => {
  it('returns overallCategory 3 when any item is 3', () => {
    const items = buildConditionRiskItems({ ...baseInput, declaredDampness: true });
    const summary = buildConditionRiskSummary(items);
    expect(summary.overallCategory).toBe(3);
    expect(summary.highPriorityCount).toBeGreaterThan(0);
  });

  it('returns overallCategory 2 when no 3 but some 2', () => {
    const items = buildConditionRiskItems({ ...baseInput, year: 1970, windows: 'single' });
    const summary = buildConditionRiskSummary(items);
    expect(summary.overallCategory).toBeGreaterThanOrEqual(2);
  });

  it('getTopRiskItems returns items sorted by category desc', () => {
    const items = buildConditionRiskItems({ ...baseInput, declaredDampness: true, year: 1970, windows: 'single' });
    const top = getTopRiskItems(items, 3);
    expect(top[0].category).toBeGreaterThanOrEqual(top[1]?.category ?? 1);
  });
});

describe('condition-risk label helpers', () => {
  it('returns category 1 label in ES', () => {
    expect(getCategoryLabel(1, 'es')).toBe('Sin acción inmediata');
  });
  it('returns category 3 label in EN', () => {
    expect(getCategoryLabel(3, 'en')).toBe('High priority');
  });
  it('returns element label in DE', () => {
    expect(getElementLabel('windows', 'de')).toBe('Fenster');
  });
  it('returns disclaimer in ES', () => {
    expect(getModuleDisclaimer('es')).toContain('no es una inspección técnica');
  });
  it('returns disclaimer in EN', () => {
    expect(getModuleDisclaimer('en')).toContain('not a technical inspection');
  });
  it('returns disclaimer in DE', () => {
    expect(getModuleDisclaimer('de')).toContain('keine technische Inspektion');
  });
});
