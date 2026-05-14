import type { BudgetImpactResult, BudgetMeasure, BudgetMeasureCategory, ConfidenceBand, EnergyLetter } from './types';

const LETTERS: EnergyLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const CATEGORY_LETTER_GAIN: Partial<Record<BudgetMeasureCategory, { min: number; max: number }>> = {
  WINDOWS: { min: 0, max: 1 },
  ENVELOPE_FACADE: { min: 1, max: 2 },
  ENVELOPE_ROOF: { min: 0, max: 1 },
  HEATING_SYSTEM: { min: 1, max: 2 },
  COOLING_SYSTEM: { min: 0, max: 1 },
  DHW_SYSTEM: { min: 0, max: 1 },
  PV: { min: 0, max: 1 },
  SOLAR_THERMAL: { min: 0, max: 1 },
  VENTILATION: { min: 0, max: 1 },
  LIGHTING: { min: 0, max: 0 },
};

function improveLetter(current: EnergyLetter | undefined, gain: number): EnergyLetter | undefined {
  if (!current) return undefined;
  const currentIndex = LETTERS.indexOf(current);
  if (currentIndex < 0) return undefined;
  return LETTERS[Math.max(0, currentIndex - gain)];
}

function letterDistance(from?: EnergyLetter, to?: EnergyLetter) {
  if (!from || !to) return undefined;
  return LETTERS.indexOf(from) - LETTERS.indexOf(to);
}

function uniqueCategories(measures: BudgetMeasure[]) {
  return Array.from(new Set(measures.map((measure) => measure.category).filter((category) => category !== 'UNKNOWN' && category !== 'OTHER_NON_ENERGY')));
}

function confidenceFor(input: {
  currentLetter?: EnergyLetter;
  currentNonRenewableEP?: number;
  currentEmissions?: number;
  usefulAreaM2?: number;
  detectedCount: number;
}): ConfidenceBand {
  if (!input.currentLetter || input.detectedCount === 0) return 'LOW';
  if (input.currentNonRenewableEP && input.currentEmissions && input.usefulAreaM2 && input.detectedCount >= 2) return 'HIGH';
  return 'MEDIUM';
}

export function analyzeBudgetImpact(input: {
  currentLetter?: EnergyLetter;
  targetLetter?: EnergyLetter;
  currentNonRenewableEP?: number;
  currentEmissions?: number;
  propertyType?: string;
  usefulAreaM2?: number;
  climateZone?: string;
  detectedMeasures: BudgetMeasure[];
}): BudgetImpactResult {
  const categories = uniqueCategories(input.detectedMeasures);
  const assumptions: string[] = [
    'Estimacion heuristica conservadora basada en categorias detectadas en el presupuesto.',
    'No sustituye una simulacion oficial ni una medicion tecnica.',
  ];
  const warnings: string[] = [];

  if (!input.currentLetter) {
    warnings.push('No hay letra energetica base aportada por CEE o scoring; la confianza del impacto es baja.');
  }

  const rawGain = categories.reduce((sum, category) => sum + (CATEGORY_LETTER_GAIN[category]?.min || 0), 0);
  const hasEnvelope = categories.some((category) => category === 'ENVELOPE_FACADE' || category === 'ENVELOPE_ROOF' || category === 'WINDOWS');
  const hasEnvelopeInsulation = categories.some((category) => category === 'ENVELOPE_FACADE' || category === 'ENVELOPE_ROOF');
  const hasSystem = categories.some((category) => category === 'HEATING_SYSTEM' || category === 'DHW_SYSTEM' || category === 'COOLING_SYSTEM');
  const maxGain = hasEnvelope && hasSystem ? 3 : hasEnvelope || hasSystem ? 2 : 1;
  const conservativeGain = Math.max(0, Math.min(maxGain, rawGain));
  const estimatedPostBudgetLetter = improveLetter(input.currentLetter, conservativeGain);
  const targetReached = input.targetLetter && estimatedPostBudgetLetter
    ? LETTERS.indexOf(estimatedPostBudgetLetter) <= LETTERS.indexOf(input.targetLetter)
    : undefined;

  const missingMeasures: BudgetMeasureCategory[] = [];
  if (!hasEnvelopeInsulation) missingMeasures.push('ENVELOPE_FACADE');
  if (!hasSystem) missingMeasures.push('HEATING_SYSTEM');
  if (!categories.includes('PV')) missingMeasures.push('PV');
  if (input.targetLetter && input.currentLetter) {
    const needed = letterDistance(input.currentLetter, input.targetLetter);
    if (needed !== undefined && needed > conservativeGain && !missingMeasures.includes('VENTILATION')) {
      missingMeasures.push('VENTILATION');
    }
  }

  const impactConfidence = confidenceFor({
    currentLetter: input.currentLetter,
    currentNonRenewableEP: input.currentNonRenewableEP,
    currentEmissions: input.currentEmissions,
    usefulAreaM2: input.usefulAreaM2,
    detectedCount: categories.length,
  });

  const summary = estimatedPostBudgetLetter && input.currentLetter
    ? `Con las medidas detectadas, EnergyScan estima una mejora orientativa de ${input.currentLetter} a ${estimatedPostBudgetLetter}.`
    : 'Se han detectado medidas energeticas, pero falta una letra base fiable para estimar el salto.';

  return {
    estimatedCurrentLetter: input.currentLetter,
    estimatedPostBudgetLetter,
    targetReached,
    impactConfidence,
    missingMeasures,
    summary: targetReached === false
      ? `${summary} Para alcanzar ${input.targetLetter} probablemente harian falta medidas adicionales.`
      : summary,
    assumptions,
    warnings,
  };
}
