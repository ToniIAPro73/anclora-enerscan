import type { BudgetData } from './types';
import type { BudgetLineItem, RehabBudgetAnalysis } from '@/lib/ingestion/types';
import { classifyBudgetLineItems } from '@/lib/ingestion/budget-classifier';
import { analyzeBudgetImpact } from '@/lib/ingestion/budget-impact-engine';

export function parseCurrencyAmount(value: string): number | undefined {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/[€£]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isBudgetTotalLine(line: string): boolean {
  return /^(?:total|importe\s+total|total\s+presupuesto|a\s+pagar|base\s+imponible)\b/i.test(line.trim());
}

export function parseBudgetLineItems(text: string): BudgetLineItem[] {
  return text
    .split(/\r?\n|(?<=€)\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8)
    .filter((line) => !isBudgetTotalLine(line))
    .map((line): BudgetLineItem | null => {
      const totalMatch = line.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)\s*€\s*$/);
      if (!totalMatch) return null;
      const total = parseCurrencyAmount(totalMatch[1]);
      if (!total) return null;
      const quantityMatch = line.match(/\b(\d+(?:[,.]\d+)?)\s*(m2|m²|ud|uds|unidad|unidades|h|kg|kwp)\b/i);
      const unitPriceMatch = line.match(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)\s*€\s*\/?\s*(m2|m²|ud|uds|unidad|unidades|h|kg|kwp)\b/i);
      return {
        description: line.replace(totalMatch[0], '').trim(),
        quantity: quantityMatch ? parseCurrencyAmount(quantityMatch[1]) : undefined,
        unit: quantityMatch?.[2],
        unitPrice: unitPriceMatch ? parseCurrencyAmount(unitPriceMatch[1]) : undefined,
        total,
        confidence: 0.75,
      } satisfies BudgetLineItem;
    })
    .filter((item): item is BudgetLineItem => item !== null);
}

export function detectBudgetTotal(text: string, lineItems: BudgetLineItem[] = []): number | undefined {
  const totalMatch = text.match(/(?:TOTAL|IMPORTE\s+TOTAL|TOTAL\s+PRESUPUESTO|A\s+PAGAR|BASE\s+IMPONIBLE)[^\d]{0,40}(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)\s*€?/i);
  if (totalMatch) return parseCurrencyAmount(totalMatch[1]);
  const sum = lineItems.reduce((total, item) => total + (item.total || 0), 0);
  return sum > 0 ? Number(sum.toFixed(2)) : undefined;
}

export function parseBudgetText(text: string): BudgetData {
  const lineItems = parseBudgetLineItems(text);
  const data: BudgetData = {
    lineItems: lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      amount: item.total,
    })),
    detectedMeasures: [],
  };

  // 1. Total Amount detection
  const totalAmount = detectBudgetTotal(text, lineItems);
  if (totalAmount) {
    data.totalAmount = totalAmount;
    data.currency = 'EUR';
  }

  // 2. Measure detection
  const measureKeywords = [
    { key: 'aerotermia', patterns: [/aerotermia/i, /bomba\s+de\s+calor/i] },
    { key: 'ventanas', patterns: [/ventanas/i, /cerramientos/i, /vidrio/i, /pvc/i, /aluminio/i] },
    { key: 'aislamiento', patterns: [/aislamiento/i, /sate/i, /insuflado/i, /lana\s+de\s+roca/i, /eps/i] },
    { key: 'fotovoltaica', patterns: [/fotovoltaica/i, /placas\s+solares/i, /paneles\s+solares/i, /inversor/i] },
    { key: 'solar térmica', patterns: [/solar\s+térmica/i, /colector\s+solar/i] },
    { key: 'caldera', patterns: [/caldera/i, /estufa/i, /biomasa/i, /pellets/i] },
    { key: 'climatización', patterns: [/climatización/i, /aire\s+acondicionado/i, /fancoil/i] },
    { key: 'acs', patterns: [/acs/i, /agua\s+caliente/i, /termo/i, /acumulador/i] },
  ];

  for (const measure of measureKeywords) {
    if (measure.patterns.some(p => p.test(text))) {
      data.detectedMeasures!.push(measure.key);
    }
  }

  // 3. Provider detection (simple heuristic - often at the top or near "CIF/NIF")
  const providerMatch = text.match(/^([A-Z\s,.]+)\s+CIF/i) || text.match(/CIF\s+([A-Z0-9]+)\s+([A-Z\s,.]+)/i);
  if (providerMatch) {
    data.providerName = providerMatch[1].trim();
  }

  return data;
}

export function parseBudgetAnalysisText(text: string, input: {
  currentLetter?: RehabBudgetAnalysis['estimatedCurrentLetter'];
  targetLetter?: RehabBudgetAnalysis['targetLetter'];
  currentNonRenewableEP?: number;
  currentEmissions?: number;
  usefulAreaM2?: number;
  propertyType?: string;
  climateZone?: string;
} = {}): RehabBudgetAnalysis {
  const lineItems = parseBudgetLineItems(text);
  const detectedMeasures = classifyBudgetLineItems(lineItems, text);
  const totalAmount = detectBudgetTotal(text, lineItems);
  const legacy = parseBudgetText(text);
  const impact = analyzeBudgetImpact({
    currentLetter: input.currentLetter,
    targetLetter: input.targetLetter,
    currentNonRenewableEP: input.currentNonRenewableEP,
    currentEmissions: input.currentEmissions,
    usefulAreaM2: input.usefulAreaM2,
    propertyType: input.propertyType,
    climateZone: input.climateZone,
    detectedMeasures,
  });
  const extractionConfidence = totalAmount && detectedMeasures.some((measure) => measure.category !== 'UNKNOWN') ? 0.78 : 0.45;

  return {
    ...impact,
    extractionStatus: extractionConfidence >= 0.65 ? 'PARSED' : 'NEEDS_REVIEW',
    extractionConfidence,
    providerName: legacy.providerName,
    totalAmount,
    currency: 'EUR',
    lineItems,
    detectedMeasures,
    targetLetter: input.targetLetter,
    analysisSummary: impact.summary,
  };
}
