import type { CostConfidence, CostEngineInput, CostEstimateLine, CostQuality, CostComplexity, ScenarioCostEstimate } from './types';
import { priceItems, measurePriceMaps } from './seed-data';
import { resolveQuantity, mapPropertyType } from './quantity-resolver';
import { buildSourceSummary } from './source-summary';
import { COST_ESTIMATE_DISCLAIMER, COST_LEGAL_DISCLAIMER, HEAT_PUMP_TECHNICAL_NOTE } from './cost-disclaimers';

const qualityFactor: Record<CostQuality, number> = { BASIC: 0.85, MEDIUM: 1, PREMIUM: 1.25 };
const complexityFactor: Record<CostComplexity, number> = { LOW: 0.9, MEDIUM: 1, HIGH: 1.2 };
const regionFactor: Record<string, number> = { ES: 1, BALEARES: 1.12, MALLORCA: 1.12, MADRID: 1.05, DEFAULT: 1 };

function combineConfidence(values: CostConfidence[]): CostConfidence {
  if (values.includes('LOW')) return 'LOW';
  if (values.includes('MEDIUM')) return 'MEDIUM';
  return 'HIGH';
}

function factorForRegion(region?: string) {
  const normalized = (region || 'ES').toUpperCase();
  if (normalized.includes('071') || normalized.includes('BALEAR') || normalized.includes('MALLORCA')) return regionFactor.MALLORCA;
  return regionFactor[normalized] || regionFactor.DEFAULT;
}

export function calculateScenarioCostEstimate(input: CostEngineInput): ScenarioCostEstimate | null {
  const propertyType = input.propertyType || mapPropertyType(input.propertyData.propertyType);
  const qFactor = qualityFactor[input.quality || 'MEDIUM'];
  const cFactor = complexityFactor[input.complexity || 'MEDIUM'];
  const rFactor = factorForRegion(input.region || input.propertyData.zipcode);
  const factor = qFactor * cFactor * rFactor;
  const lines: CostEstimateLine[] = [];
  const sourceNames: string[] = [];

  for (const measureCode of input.measureCodes) {
    const mappings = measurePriceMaps.filter((mapping) => mapping.measureCode === measureCode);
    for (const mapping of mappings) {
      const priceItem = priceItems.find((item) => item.code === mapping.priceItemCode);
      if (!priceItem || !priceItem.applicableTo.includes(propertyType)) continue;
      const resolved = resolveQuantity({ formula: mapping.quantityFormula, propertyData: input.propertyData, propertyType });
      if (!resolved || resolved.quantity <= 0) continue;
      const mappingFactor = mapping.defaultFactor || 1;
      const quantity = resolved.quantity * mappingFactor;
      const minUnitPrice = priceItem.minUnitPrice * factor;
      const midUnitPrice = (priceItem.midUnitPrice ?? (priceItem.minUnitPrice + priceItem.maxUnitPrice) / 2) * factor;
      const maxUnitPrice = priceItem.maxUnitPrice * factor;
      sourceNames.push(priceItem.sourceName);

      lines.push({
        measureCode,
        priceItemCode: priceItem.code,
        title: priceItem.title,
        unit: priceItem.unit,
        quantity: Number(quantity.toFixed(2)),
        minUnitPrice: Number(minUnitPrice.toFixed(2)),
        midUnitPrice: Number(midUnitPrice.toFixed(2)),
        maxUnitPrice: Number(maxUnitPrice.toFixed(2)),
        minSubtotal: Number((quantity * minUnitPrice).toFixed(2)),
        midSubtotal: Number((quantity * midUnitPrice).toFixed(2)),
        maxSubtotal: Number((quantity * maxUnitPrice).toFixed(2)),
        sourceLabel: priceItem.sourceName,
        confidence: combineConfidence([priceItem.confidence, resolved.confidence]),
        assumptions: resolved.assumptions,
      });
    }
  }

  if (lines.length === 0) return null;

  const minSubtotal = lines.reduce((sum, line) => sum + line.minSubtotal, 0);
  const midSubtotal = lines.reduce((sum, line) => sum + (line.midSubtotal || 0), 0);
  const maxSubtotal = lines.reduce((sum, line) => sum + line.maxSubtotal, 0);
  const minTotal = minSubtotal * 1.08;
  const midTotal = midSubtotal * 1.1;
  const maxTotal = maxSubtotal * 1.12;

  if (maxTotal < minTotal) throw new Error('Invalid cost range: maxTotal is lower than minTotal');

  const assumptions = Array.from(new Set(lines.flatMap((line) => line.assumptions)));
  assumptions.push('Rango con contingencia orientativa del 8-12%. IVA, licencias, tasas y honorarios técnicos no incluidos salvo indicación expresa.');

  const hasHeatPump = input.measureCodes.some((code) => code.includes('heat_pump'));

  return {
    scenarioId: input.scenarioId,
    scenarioTitle: input.scenarioTitle,
    currency: 'EUR',
    minTotal: Number(minTotal.toFixed(2)),
    midTotal: Number(midTotal.toFixed(2)),
    maxTotal: Number(maxTotal.toFixed(2)),
    confidence: combineConfidence(lines.map((line) => line.confidence)),
    lines,
    assumptions,
    disclaimers: [COST_ESTIMATE_DISCLAIMER, COST_LEGAL_DISCLAIMER],
    sourceSummary: buildSourceSummary(sourceNames),
    interventionLevel: input.interventionLevel,
    letterGainTarget: input.letterGainTarget,
    heatPumpTechnicalNote: hasHeatPump ? HEAT_PUMP_TECHNICAL_NOTE : undefined,
  };
}
