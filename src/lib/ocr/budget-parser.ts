import { BudgetData } from './types';

export function parseBudgetText(text: string): BudgetData {
  const data: BudgetData = {
    lineItems: [],
    detectedMeasures: [],
  };

  // 1. Total Amount detection
  const totalMatches = text.match(/(?:TOTAL|IMPORTE TOTAL|TOTAL PRESUPUESTO|A PAGAR|BASE IMPONIBLE).*?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*€?/i);
  if (totalMatches) {
    data.totalAmount = parseFloat(totalMatches[1].replace(/\./g, '').replace(',', '.'));
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
