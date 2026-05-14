import type { BudgetData } from './types';
import type { BudgetLineItem, RehabBudgetAnalysis } from '@/lib/ingestion/types';
import { classifyBudgetLineItems } from '@/lib/ingestion/budget-classifier';
import { analyzeBudgetImpact } from '@/lib/ingestion/budget-impact-engine';

export function parseCurrencyAmount(value: string): number | undefined {
  const raw = value.replace(/\s/g, '').replace(/[€£]/g, '').replace(/[^\d,.-]/g, '');
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let normalized = raw;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = raw
      .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    normalized = /\d+,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replace(/,/g, '');
  } else if (lastDot >= 0) {
    normalized = /\d+\.\d{1,2}$/.test(raw) ? raw : raw.replace(/\./g, '');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isBudgetTotalLine(line: string): boolean {
  return /^(?:total|importe\s+total|total\s+presupuesto|a\s+pagar|base\s+imponible)\b/i.test(line.trim());
}

const AMOUNT_PATTERN = String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?`;
const UNIT_PATTERN = String.raw`m2|m²|ml|m(?!\d)|ud\.?|uds\.?|und\.?|unidad|unidades|h|kg|kwp`;
const QUANTITY_PATTERN = new RegExp(String.raw`\b(\d+(?:[,.]\d+)?)\s*(${UNIT_PATTERN})\b`, 'i');
const UNIT_PRICE_PATTERN = new RegExp(String.raw`\b(${AMOUNT_PATTERN})\s*€\s*\/?\s*(${UNIT_PATTERN})\b`, 'i');

function isTableNoise(line: string): boolean {
  return /^(?:cantidad|precio|importe|resumen\s+por\s+cap[ií]tulos)\b/i.test(line.trim());
}

export function parseBudgetLineItems(text: string): BudgetLineItem[] {
  const items: BudgetLineItem[] = [];
  let pendingDescription = '';
  let inSummary = false;

  for (const rawLine of text.split(/\r?\n|(?<=€)\s+(?=[A-ZÁÉÍÓÚÑ])/)) {
    const line = rawLine
      .replace(/\bpartida\s+cantidad\s+precio\s+importe\b/ig, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!line || line.length <= 2) continue;
    if (/^resumen\s+por\s+cap[ií]tulos\b/i.test(line)) {
      inSummary = true;
      pendingDescription = '';
      continue;
    }
    if (/^tipo\s+de\s+contrato\b/i.test(line)) inSummary = false;
    if (inSummary || isTableNoise(line) || isBudgetTotalLine(line)) continue;

    const totalMatch = line.match(new RegExp(String.raw`(${AMOUNT_PATTERN})\s*€\s*$`));
    const quantityMatch = line.match(QUANTITY_PATTERN);

    if (!totalMatch || !quantityMatch) {
      if (!/[€]/.test(line) && !/^(?:presupuesto|cliente|direcci[oó]n|c[oó]digo postal|fecha|nota|desde\b|llame\b|hemos\b|de nuevo\b)/i.test(line)) {
        pendingDescription = pendingDescription ? `${pendingDescription} ${line}` : line;
      }
      continue;
    }

    const total = parseCurrencyAmount(totalMatch[1]);
    if (!total) {
      pendingDescription = '';
      continue;
    }

    const descriptionLine = line.replace(totalMatch[0], '').trim();
    const unitPriceMatch = descriptionLine.match(UNIT_PRICE_PATTERN);
    const currencyMatches = Array.from(descriptionLine.matchAll(new RegExp(String.raw`(${AMOUNT_PATTERN})\s*€(?:\s*\/?\s*(?:${UNIT_PATTERN}))?`, 'gi')));
    const unitPrice = unitPriceMatch
      ? parseCurrencyAmount(unitPriceMatch[1])
      : currencyMatches.length > 0
        ? parseCurrencyAmount(currencyMatches[currencyMatches.length - 1][1])
        : undefined;
    const description = `${pendingDescription} ${descriptionLine}`
      .replace(QUANTITY_PATTERN, '')
      .replace(UNIT_PRICE_PATTERN, '')
      .replace(new RegExp(String.raw`\b${AMOUNT_PATTERN}\s*€(?:\s*\/?\s*(?:${UNIT_PATTERN}))?`, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim();

    items.push({
      description: description || descriptionLine,
      quantity: parseCurrencyAmount(quantityMatch[1]),
      unit: quantityMatch[2].replace(/\.$/, ''),
      unitPrice,
      total,
      confidence: pendingDescription ? 0.82 : 0.72,
    });
    pendingDescription = '';
  }

  return items;
}

export function detectBudgetTotal(text: string, lineItems: BudgetLineItem[] = []): number | undefined {
  const totalMatch = text.match(new RegExp(String.raw`(?:TOTAL|IMPORTE\s+TOTAL|TOTAL\s+PRESUPUESTO|A\s+PAGAR|BASE\s+IMPONIBLE)[^\d]{0,40}(${AMOUNT_PATTERN})\s*€?`, 'i'));
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
    budgetDate: detectBudgetDate(text),
    totalAmount,
    currency: 'EUR',
    lineItems,
    detectedMeasures,
    targetLetter: input.targetLetter,
    analysisSummary: impact.summary,
  };
}

function detectBudgetDate(text: string): string | undefined {
  const spanishMonths: Record<string, string> = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    setiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  };
  const longDate = text.match(/fecha:\s*(\d{1,2})\s+de\s+([a-záéíóú]+)\s+del?\s+(\d{4})/i);
  if (longDate) {
    const month = spanishMonths[longDate[2].toLowerCase()];
    if (month) return `${longDate[3]}-${month}-${longDate[1].padStart(2, '0')}`;
  }
  const shortDate = text.match(/fecha:\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/i);
  if (shortDate) {
    const year = shortDate[3].length === 2 ? `20${shortDate[3]}` : shortDate[3];
    return `${year}-${shortDate[2].padStart(2, '0')}-${shortDate[1].padStart(2, '0')}`;
  }
  return undefined;
}
