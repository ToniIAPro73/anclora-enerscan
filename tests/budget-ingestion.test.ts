import { parseBudgetAnalysisText, parseBudgetLineItems, parseCurrencyAmount, detectBudgetTotal } from '@/lib/ocr/budget-parser';
import { classifyBudgetText } from '@/lib/ingestion/budget-classifier';
import { analyzeBudgetImpact } from '@/lib/ingestion/budget-impact-engine';

describe('budget ingestion', () => {
  const text = `
    PRESUPUESTO REFORMA ENERGÉTICA
    Ventanas PVC doble acristalamiento bajo emisivo 10 m2 450,00 €/m2 4.500,00 €
    Sistema de aerotermia con bomba de calor 1 ud 8.000,00 €
    Instalación fotovoltaica 3 kwp con inversor 5.950,00 €
    Pintura interior vivienda 1.200,00 €
    IMPORTE TOTAL 18.450,00 €
  `;

  it('parses currency and total', () => {
    expect(parseCurrencyAmount('18.450,00 €')).toBe(18450);
    expect(detectBudgetTotal(text)).toBe(18450);
  });

  it('extracts line items', () => {
    const lines = parseBudgetLineItems(text);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.some((line) => line.description.toLowerCase().includes('ventanas'))).toBe(true);
  });

  it('classifies measure categories', () => {
    expect(classifyBudgetText('Ventanas PVC con doble acristalamiento')).toContain('WINDOWS');
    expect(classifyBudgetText('SATE fachada lana mineral')).toContain('ENVELOPE_FACADE');
    expect(classifyBudgetText('bomba de calor aerotermia')).toContain('HEATING_SYSTEM');
    expect(classifyBudgetText('placas solares fotovoltaica inversor')).toContain('PV');
    expect(classifyBudgetText('pintura interior')).toContain('OTHER_NON_ENERGY');
  });

  it('analyzes conservative impact and missing measures', () => {
    const analysis = parseBudgetAnalysisText(text, { currentLetter: 'E', targetLetter: 'C', usefulAreaM2: 80 });
    expect(analysis.totalAmount).toBe(18450);
    expect(analysis.detectedMeasures.map((measure) => measure.category)).toEqual(expect.arrayContaining(['WINDOWS', 'HEATING_SYSTEM', 'PV']));
    expect(analysis.estimatedPostBudgetLetter).toBe('D');
    expect(analysis.targetReached).toBe(false);
    expect(analysis.missingMeasures).toContain('ENVELOPE_FACADE');
  });

  it('returns low confidence without a base letter', () => {
    const impact = analyzeBudgetImpact({ detectedMeasures: [{ category: 'WINDOWS', description: 'Ventanas' }] });
    expect(impact.impactConfidence).toBe('LOW');
  });
});
