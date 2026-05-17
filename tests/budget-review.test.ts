import { buildBudgetReviewFindings, hashBudgetText } from '@/lib/budget-review/service';
import { parseBudgetAnalysisText } from '@/lib/ocr/budget-parser';

const BUDGET_TEXT = `
Presupuesto reforma energetica
Ventanas PVC 12 m2 520 €/m2 6.240,00 €
Aislamiento fachada SATE 80 m2 95 €/m2 7.600,00 €
TOTAL PRESUPUESTO 13.840,00 €
`;

describe('budget review', () => {
  it('parses amounts from budget text', () => {
    const analysis = parseBudgetAnalysisText(BUDGET_TEXT);
    expect(analysis.totalAmount).toBe(13840);
    expect(analysis.lineItems.length).toBeGreaterThan(0);
  });

  it('flags line items that need review', () => {
    const analysis = parseBudgetAnalysisText(BUDGET_TEXT);
    const findings = buildBudgetReviewFindings(analysis.lineItems, analysis.totalAmount);
    expect(findings.findings.some((finding) => finding.status === 'HIGH_REVIEW')).toBe(true);
    expect(findings.legalNotice).toContain('orientativo');
  });

  it('hashes source text without storing raw text', () => {
    expect(hashBudgetText(BUDGET_TEXT)).toHaveLength(64);
  });
});
