import {
  buildAdvancedFindings,
  detectBudgetCategory,
  getOmissionsForCategory,
  getSuggestedQuestions,
  buildBudgetAdvancedAnalysis,
  getFindingStatusLabel,
} from '../src/lib/budget-review/advanced-analysis';
import type { BudgetLineItem } from '../src/lib/ingestion/types';

const windowsItems: BudgetLineItem[] = [
  { description: 'Ventana PVC doble acristalamiento', quantity: 3, unitPrice: 680, total: 2040 },
  { description: 'Retira ventanas existentes', quantity: 3, unitPrice: 80, total: 240 },
];

const aerothermiaItems: BudgetLineItem[] = [
  { description: 'Aerotermia bomba de calor 12kW', quantity: 1, unitPrice: 7500, total: 7500 },
];

describe('detectBudgetCategory', () => {
  it('detects windows category', () => {
    const descriptions = windowsItems.map((i) => i.description);
    expect(detectBudgetCategory(descriptions)).toBe('windows');
  });

  it('detects aerothermia category', () => {
    const descriptions = aerothermiaItems.map((i) => i.description);
    expect(detectBudgetCategory(descriptions)).toBe('aerothermia');
  });

  it('returns general for unrecognized content', () => {
    expect(detectBudgetCategory(['Material de limpieza', 'Gestión general'])).toBe('general');
  });
});

describe('buildAdvancedFindings', () => {
  it('marks high unit price as HIGH_REVIEW', () => {
    const items: BudgetLineItem[] = [
      { description: 'Ventana premium', quantity: 1, unitPrice: 1200, total: 1200 },
    ];
    const findings = buildAdvancedFindings(items);
    expect(findings[0].status).toBe('HIGH_REVIEW');
  });

  it('marks low unit price as LOW_REVIEW', () => {
    const items: BudgetLineItem[] = [
      { description: 'Tornillo', quantity: 100, unitPrice: 0.5, total: 50 },
    ];
    const findings = buildAdvancedFindings(items);
    expect(findings[0].status).toBe('LOW_REVIEW');
  });

  it('marks normal unit price as IN_RANGE', () => {
    const findings = buildAdvancedFindings(windowsItems);
    const first = findings[0];
    expect(first.status).toBe('HIGH_REVIEW'); // 680 > 450
    const second = findings[1];
    expect(second.status).toBe('IN_RANGE');
  });

  it('marks item without total as INCOMPLETE', () => {
    const items: BudgetLineItem[] = [
      { description: 'Partida sin importe', quantity: undefined, unitPrice: undefined, total: undefined },
    ];
    const findings = buildAdvancedFindings(items);
    expect(findings[0].status).toBe('INCOMPLETE');
  });

  it('marks item with total but no quantity/unit price as REQUIRES_CLARIFICATION', () => {
    const items: BudgetLineItem[] = [
      { description: 'Partida a tanto alzado', quantity: undefined, unitPrice: undefined, total: 5000 },
    ];
    const findings = buildAdvancedFindings(items);
    expect(findings[0].status).toBe('REQUIRES_CLARIFICATION');
  });
});

describe('getOmissionsForCategory', () => {
  it('returns omissions for windows category', () => {
    const omissions = getOmissionsForCategory('windows');
    expect(omissions.length).toBeGreaterThan(0);
    expect(omissions[0].category).toBe('windows');
  });

  it('returns omissions for aerothermia category', () => {
    const omissions = getOmissionsForCategory('aerothermia');
    expect(omissions.length).toBeGreaterThan(0);
    expect(omissions.some((o) => o.reasonKey.includes('aerothermia'))).toBe(true);
  });

  it('returns at least some omissions for general', () => {
    const omissions = getOmissionsForCategory('general');
    expect(omissions.length).toBeGreaterThan(0);
  });
});

describe('getSuggestedQuestions', () => {
  it('returns questions in ES for windows', () => {
    const questions = getSuggestedQuestions('windows', 'es');
    expect(questions.length).toBeGreaterThan(0);
    expect(typeof questions[0]).toBe('string');
  });

  it('returns questions in EN', () => {
    const questions = getSuggestedQuestions('windows', 'en');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).not.toMatch(/ventana|Ventana/);
  });

  it('returns questions in DE', () => {
    const questions = getSuggestedQuestions('aerothermia', 'de');
    expect(questions.length).toBeGreaterThan(0);
  });
});

describe('buildBudgetAdvancedAnalysis', () => {
  it('builds a complete analysis for windows items in ES', () => {
    const analysis = buildBudgetAdvancedAnalysis(windowsItems, 2280, 'es');
    expect(analysis.category).toBe('windows');
    expect(analysis.findings.length).toBe(2);
    expect(analysis.omissions.length).toBeGreaterThan(0);
    expect(analysis.suggestedQuestions.length).toBeGreaterThan(0);
    expect(analysis.legalNotice).toContain('orientativo');
  });

  it('sets high total alert key when total > 30000', () => {
    const analysis = buildBudgetAdvancedAnalysis(windowsItems, 35000, 'es');
    expect(analysis.alertKey).toBe('budget.alert_high_total');
  });

  it('sets general alert key for lower totals', () => {
    const analysis = buildBudgetAdvancedAnalysis(windowsItems, 2000, 'es');
    expect(analysis.alertKey).toBe('budget.alert_general');
  });

  it('works in EN', () => {
    const analysis = buildBudgetAdvancedAnalysis(aerothermiaItems, 7500, 'en');
    expect(analysis.legalNotice).toContain('Indicative');
  });

  it('works in DE', () => {
    const analysis = buildBudgetAdvancedAnalysis(windowsItems, 2280, 'de');
    expect(analysis.legalNotice).toContain('Orientierende');
  });
});

describe('getFindingStatusLabel', () => {
  it('translates IN_RANGE in ES', () => {
    expect(getFindingStatusLabel('IN_RANGE', 'es')).toContain('rango');
  });
  it('translates HIGH_REVIEW in EN', () => {
    expect(getFindingStatusLabel('HIGH_REVIEW', 'en')).toBe('High unit price');
  });
  it('translates INCOMPLETE in DE', () => {
    expect(getFindingStatusLabel('INCOMPLETE', 'de')).toContain('vollständig');
  });
});
