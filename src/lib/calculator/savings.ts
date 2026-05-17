import { z } from 'zod';

export const savingsCalculatorSchema = z.object({
  propertyType: z.enum(['flat', 'house', 'terraced']).default('flat'),
  area: z.coerce.number().min(20).max(600),
  currentLetter: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
  measure: z.enum(['windows', 'insulation', 'heat_pump', 'pv', 'deep_retrofit']),
  monthlySpend: z.coerce.number().min(20).max(2000),
  city: z.string().trim().max(80).optional(),
});

export type SavingsCalculatorInput = z.infer<typeof savingsCalculatorSchema>;

const savingsRateByMeasure: Record<SavingsCalculatorInput['measure'], [number, number]> = {
  windows: [0.06, 0.14],
  insulation: [0.12, 0.28],
  heat_pump: [0.15, 0.35],
  pv: [0.18, 0.45],
  deep_retrofit: [0.28, 0.55],
};

const costByMeasurePerM2: Record<SavingsCalculatorInput['measure'], [number, number]> = {
  windows: [120, 260],
  insulation: [80, 180],
  heat_pump: [90, 190],
  pv: [75, 180],
  deep_retrofit: [300, 700],
};

export function calculateSavingsRange(input: SavingsCalculatorInput) {
  const parsed = savingsCalculatorSchema.parse(input);
  const [minRate, maxRate] = savingsRateByMeasure[parsed.measure];
  const annualSpend = parsed.monthlySpend * 12;
  const minAnnualSavings = Math.round(annualSpend * minRate);
  const maxAnnualSavings = Math.round(annualSpend * maxRate);
  const [minCostM2, maxCostM2] = costByMeasurePerM2[parsed.measure];
  const minCost = Math.round(parsed.area * minCostM2);
  const maxCost = Math.round(parsed.area * maxCostM2);
  const minPaybackYears = maxAnnualSavings > 0 ? Math.round((minCost / maxAnnualSavings) * 10) / 10 : null;
  const maxPaybackYears = minAnnualSavings > 0 ? Math.round((maxCost / minAnnualSavings) * 10) / 10 : null;

  return {
    input: parsed,
    annualSavingsRange: [minAnnualSavings, maxAnnualSavings] as const,
    costRange: [minCost, maxCost] as const,
    paybackYearsRange: [minPaybackYears, maxPaybackYears] as const,
    disclaimer: 'Rango orientativo no garantizado. Requiere validacion tecnica y datos completos de la vivienda.',
  };
}
