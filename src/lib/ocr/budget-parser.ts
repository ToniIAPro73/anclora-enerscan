import type { BudgetData } from './types';
import type { BudgetLineItem, RehabBudgetAnalysis } from '@/lib/ingestion/types';
import { classifyBudgetLineItems } from '@/lib/ingestion/budget-classifier';
import { analyzeBudgetImpact } from '@/lib/ingestion/budget-impact-engine';

// ─── Amount parsing ───────────────────────────────────────────────────────────

export function parseCurrencyAmount(value: string): number | undefined {
  const raw = value.replace(/\s/g, '').replace(/[€£$]/g, '').replace(/[^\d,.-]/g, '');
  if (!raw) return undefined;
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
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

// ─── Shared patterns ──────────────────────────────────────────────────────────

const AMOUNT_PAT = String.raw`\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?`;
const UNIT_PAT = String.raw`m2|m²|ml|m(?!\d)|ud\.?|uds\.?|und\.?|unidad(?:es)?|h\.?|kg|kwp|pa\.?|jor\.?|l\.?`;
const QTY_RE = new RegExp(String.raw`\b(\d+(?:[,.]\d+)?)\s*(${UNIT_PAT})\b`, 'i');
const UPRICE_RE = new RegExp(String.raw`\b(${AMOUNT_PAT})\s*€\s*/?\s*(${UNIT_PAT})\b`, 'i');
const TERMINAL_EUR_RE = new RegExp(String.raw`(${AMOUNT_PAT})\s*€\s*$`);
// Loose terminal: optional €, used for tabular columns
const TERMINAL_LOOSE_RE = new RegExp(String.raw`(${AMOUNT_PAT})\s*€?\s*$`);

// Budget-code prefix: 01.01, 01.01.01, A01, CAP-1 etc.
const CODE_PREFIX_RE = /^(?:[A-Z]{0,3}\d+(?:[.\-]\d+){0,3})\s+/i;

// ─── Line classification ──────────────────────────────────────────────────────

function isSummarySectionStart(line: string): boolean {
  return /^resumen\s+(?:por\s+cap[ií]tulos|general)\b/i.test(line);
}

function isSummarySectionEnd(line: string): boolean {
  return /^tipo\s+de\s+contrato\b/i.test(line);
}

const HEADER_WORD_RE = /(?:descripci[oó]n|partida|concepto|referencia|cantidad|unidades?|ud\.?s?|precio\s*unit(?:ario)?|precio|importe|total|iva\s*%?|subtotal|p\.?\s*u\.?|m[eé]d\.?|medici[oó]n|material(?:es)?|mano\s+de\s+obra|parcial)/gi;

function isColumnHeader(line: string): boolean {
  // ≥ 2 header-keyword hits and no monetary amount → header row
  const hits = (line.match(HEADER_WORD_RE) ?? []).length;
  if (hits >= 2 && !/\d{2,}[,.]/.test(line)) return true;
  return false;
}

function isSectionHeader(line: string): boolean {
  return /^(?:cap[ií]tulo|apartado|secci[oó]n|grupo|parte|chapter)\s+[\d\w.-]+/i.test(line);
}

function isChapterSubtotal(description: string): boolean {
  const d = description.trim();
  // "Total Capítulo X" or "Capítulo X Total" or "Capítulo X — Total"
  return /(?:^|\s)total\s+(?:del\s+)?cap[ií]tulo/i.test(d)
    || /^(?:cap[ií]tulo|cap\.?)\s+\d[\w.]*.*\btotal\b/i.test(d)
    || /^resumen\s+(?:por\s+)?cap[ií]tulos?\b/i.test(d);
}

function isNoiseLine(line: string): boolean {
  if (line.length <= 2) return true;
  // Page headers/footers, contact info, titles
  return /^(?:presupuesto\s+(?:orientativo|de\s+(?:obra|reforma|trabajo))|cliente|direcci[oó]n|c[oó]digo\s+postal|tel[eé]fono|m[oó]vil|fax|email|web|c\.?i\.?f\.?|n\.?i\.?f\.?|p[aá]gina?\s*\d|hoja\s+\d|fecha\s*:|elaborado\s+por|firmado\s+por|v[aá]lido\s+hasta|condiciones\s+de\s+pago|forma\s+de\s+pago|observaciones|notas?:?|nota\s+aclaratoria|aviso\s+legal|propietario)\b/i.test(line);
}

function isTotalLine(line: string): boolean {
  if (/^(?:total\s+(?:presupuesto|obra|general|s[./]?\s*iva|neto)|importe\s+total|a\s+pagar|base\s+imponible|suma\s+total|importe\s+base|coste\s+total|precio\s+total|presupuesto\s+total)\b/i.test(line)) return true;
  // Bare "TOTAL" or "TOTAL:" immediately followed by a digit (e.g., "TOTAL: 2.277,65€")
  if (/^total\s*:?\s*\d/i.test(line)) return true;
  return false;
}

function isDescriptionCandidate(line: string): boolean {
  // A line that has no € and doesn't start with skip patterns → potential description
  if (/[€]/.test(line)) return false;
  if (isNoiseLine(line)) return false;
  // Pure numbers are not descriptions
  if (/^\d+([.,]\d+)?\s*$/.test(line)) return false;
  return true;
}

// ─── Strategy helpers ─────────────────────────────────────────────────────────

function buildItem(
  rawDescription: string,
  pending: string,
  total: number,
  opts: { quantity?: number; unit?: string; unitPrice?: number; confidence?: number } = {},
): BudgetLineItem {
  const description = `${pending} ${rawDescription}`.replace(/\s+/g, ' ').trim();
  return {
    description: description || rawDescription,
    quantity: opts.quantity,
    unit: opts.unit,
    unitPrice: opts.unitPrice,
    total,
    confidence: opts.confidence ?? (pending ? 0.82 : 0.72),
  };
}

function extractAmountFromField(col: string): number | undefined {
  const m = col.trim().match(TERMINAL_LOOSE_RE);
  if (!m) return undefined;
  return parseCurrencyAmount(m[1]);
}

/** Strategy 1: tab-separated columns (from position-aware PDF extractor). */
function tryTabular(line: string, pending: string): BudgetLineItem | null {
  if (!line.includes('\t')) return null;

  const cols = line.split('\t').map((c) => c.trim());
  if (cols.length < 2) return null;

  // Find the rightmost column that parses as a positive monetary amount.
  // Require at least 1 € to confirm currency, or the column must be the last one.
  let totalIdx = -1;
  for (let i = cols.length - 1; i >= 0; i--) {
    const amt = extractAmountFromField(cols[i]);
    if (amt !== undefined && amt > 0) {
      totalIdx = i;
      break;
    }
  }
  if (totalIdx < 0) return null;

  const total = extractAmountFromField(cols[totalIdx])!;

  // Identify description columns: leading non-purely-numeric, non-unit columns
  // Strip a leading row-number or budget-code column (single number or code)
  let startIdx = 0;
  if (/^[\d.]+$/.test(cols[0]) || CODE_PREFIX_RE.test(cols[0] + ' ')) startIdx = 1;

  const descCols: string[] = [];
  let firstNumericIdx = totalIdx; // first numeric col from the left (for qty extraction)
  for (let i = startIdx; i < totalIdx; i++) {
    const isNumeric = /^[\d.,€%\-]+$/.test(cols[i]) || /^[\d.,]+\s*€?\s*$/.test(cols[i]);
    const isUnit = new RegExp(`^(?:${UNIT_PAT})$`, 'i').test(cols[i]);
    if (isNumeric || isUnit) {
      if (firstNumericIdx === totalIdx) firstNumericIdx = i;
    } else {
      descCols.push(cols[i]);
    }
  }

  const rawDescription = descCols.join(' ').trim();
  if (!rawDescription && !pending) return null;

  // Extract quantity and unit from middle numeric/unit columns
  const midText = cols.slice(firstNumericIdx, totalIdx).join(' ');
  const qtyMatch = midText.match(QTY_RE);

  // Unit price: second-to-last numeric column before total
  let unitPrice: number | undefined;
  for (let i = totalIdx - 1; i >= firstNumericIdx; i--) {
    const amt = extractAmountFromField(cols[i]);
    if (amt !== undefined && amt > 0 && amt <= total) {
      unitPrice = amt;
      break;
    }
  }

  return buildItem(rawDescription, pending, total, {
    quantity: qtyMatch ? parseCurrencyAmount(qtyMatch[1]) : undefined,
    unit: qtyMatch ? qtyMatch[2].replace(/\.$/, '') : undefined,
    unitPrice,
    confidence: 0.85,
  });
}

/** Strategy 2: dotted leader — "Description ........ 1.800,00 €". */
function tryDottedLeader(line: string, pending: string): BudgetLineItem | null {
  // Match leader made of dots, dashes, or underscores (≥ 3)
  const m = line.match(new RegExp(String.raw`^(.+?)\s*[.\-_]{3,}\s*(${AMOUNT_PAT})\s*€?\s*$`));
  if (!m) return null;
  const total = parseCurrencyAmount(m[2]);
  if (!total) return null;
  return buildItem(m[1].trim(), pending, total, { confidence: 0.78 });
}

/** Strategy 3: inline — "Description [qty unit] [unitPrice €/unit] totalAmount €". */
function tryInline(line: string, pending: string): BudgetLineItem | null {
  const totalMatch = line.match(TERMINAL_EUR_RE);
  if (!totalMatch) return null;
  const total = parseCurrencyAmount(totalMatch[1]);
  if (!total) return null;

  const descLine = line.slice(0, line.lastIndexOf(totalMatch[0])).trim();
  const qtyMatch = descLine.match(QTY_RE);
  const upriceMatch = descLine.match(UPRICE_RE);
  const unitPrice = upriceMatch
    ? parseCurrencyAmount(upriceMatch[1])
    : undefined;

  const description = descLine
    .replace(UPRICE_RE, '')
    .replace(QTY_RE, '')
    .replace(new RegExp(String.raw`\b${AMOUNT_PAT}\s*€(?:\s*/?\s*(?:${UNIT_PAT}))?`, 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim();

  return buildItem(description || descLine, pending, total, {
    quantity: qtyMatch ? parseCurrencyAmount(qtyMatch[1]) : undefined,
    unit: qtyMatch ? qtyMatch[2].replace(/\.$/, '') : undefined,
    unitPrice,
  });
}

/** Strategy 4: bullet or numbered list item — "- Description: 500€" or "1. Description 500€". */
function tryBulletItem(line: string, pending: string): BudgetLineItem | null {
  const stripped = line.replace(/^[-•*·▪–]\s+|^\d+[.)]\s+/, '').trim();
  if (stripped === line) return null; // no bullet found
  return tryInline(stripped, pending);
}

/** Strategy 5: code-prefixed — "01.01 Description m2 120 15,00 1.800,00". */
function tryCodePrefixed(line: string, pending: string): BudgetLineItem | null {
  const m = line.match(CODE_PREFIX_RE);
  if (!m) return null;
  const stripped = line.slice(m[0].length).trim();
  // Try tabular first, then inline
  return tryTabular(stripped, pending) ?? tryInline(stripped, pending);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseBudgetLineItems(text: string): BudgetLineItem[] {
  const items: BudgetLineItem[] = [];
  let pending = '';
  let inSummary = false;

  // Split on real newlines and on € followed by an uppercase letter (PDF artifacts)
  const rawLines = text.split(/\r?\n|(?<=€)\s+(?=[A-ZÁÉÍÓÚÑ])/);

  for (const rawLine of rawLines) {
    const line = rawLine
      .replace(/\bpartida\s+cantidad\s+precio\s+importe\b/gi, '')
      .replace(/[ \t]+/g, (m) => (m.includes('\t') ? '\t' : ' '))
      .trim();

    if (!line) continue;

    // Section guards
    if (isSummarySectionStart(line)) { inSummary = true; pending = ''; continue; }
    if (isSummarySectionEnd(line)) { inSummary = false; continue; }
    if (inSummary) continue;

    // Noise / headers / totals: clear pending and skip
    if (isColumnHeader(line) || isNoiseLine(line) || isTotalLine(line)) {
      pending = '';
      continue;
    }

    // Try each strategy in priority order — BEFORE section-header check so that
    // lines like "CAPÍTULO 1 — Pintura ...... 1.706,75 €" (dotted leader) are captured.
    const item =
      tryTabular(line, pending) ??
      tryDottedLeader(line, pending) ??
      tryCodePrefixed(line, pending) ??
      tryBulletItem(line, pending) ??
      tryInline(line, pending);

    if (item) {
      if (item.total && item.total > 0 && !isChapterSubtotal(item.description)) {
        items.push(item);
      }
      pending = '';
    } else if (isSectionHeader(line)) {
      // Section title with no parseable amount → reset pending, not a description
      pending = '';
    } else if (isDescriptionCandidate(line)) {
      // Accumulate as pending — cap at 200 chars to avoid header spill
      const next = pending ? `${pending} ${line}` : line;
      pending = next.length <= 200 ? next : line;
    } else {
      if (/[€]/.test(line)) pending = '';
    }
  }

  return items;
}

// ─── Total detection ──────────────────────────────────────────────────────────

export function detectBudgetTotal(text: string, lineItems: BudgetLineItem[] = []): number | undefined {
  // Ordered by specificity
  const totalKeywords = [
    String.raw`total\s+presupuesto`,
    String.raw`presupuesto\s+total`,
    String.raw`importe\s+total`,
    String.raw`total\s+obra`,
    String.raw`total\s+general`,
    String.raw`total\s+neto`,
    String.raw`total\s+s(?:in)?\s*\.?\s*iva`,
    String.raw`a\s+pagar`,
    String.raw`base\s+imponible`,
    String.raw`suma\s+total`,
    String.raw`coste\s+total`,
    String.raw`precio\s+total`,
    String.raw`importe\s+base`,
    String.raw`total`,
  ];

  for (const kw of totalKeywords) {
    // Amount may be on the same line or the very next line
    const re = new RegExp(
      String.raw`(?:${kw})[^\d\n]{0,50}(${AMOUNT_PAT})\s*€?(?:\s*\n.*)?`,
      'im',
    );
    const m = text.match(re);
    if (m) {
      const amt = parseCurrencyAmount(m[1]);
      if (amt && amt > 0) return amt;
    }
  }

  // Fallback: sum of detected line items
  const sum = lineItems.reduce((acc, it) => acc + (it.total ?? 0), 0);
  return sum > 0 ? Number(sum.toFixed(2)) : undefined;
}

// ─── Legacy full-text parse (used by parseBudgetAnalysisText) ─────────────────

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

  const totalAmount = detectBudgetTotal(text, lineItems);
  if (totalAmount) {
    data.totalAmount = totalAmount;
    data.currency = 'EUR';
  }

  const measureKeywords = [
    { key: 'aerotermia', patterns: [/aerotermia/i, /bomba\s+de\s+calor/i] },
    { key: 'ventanas', patterns: [/ventanas/i, /cerramientos/i, /vidrio/i, /pvc/i, /aluminio/i] },
    { key: 'aislamiento', patterns: [/aislamiento/i, /sate/i, /insuflado/i, /lana\s+de\s+roca/i, /eps/i] },
    { key: 'fotovoltaica', patterns: [/fotovoltaica/i, /placas\s+solares/i, /paneles\s+solares/i, /inversor/i] },
    { key: 'solar térmica', patterns: [/solar\s+t[eé]rmica/i, /colector\s+solar/i] },
    { key: 'caldera', patterns: [/caldera/i, /estufa/i, /biomasa/i, /pellets/i] },
    { key: 'climatización', patterns: [/climatizaci[oó]n/i, /aire\s+acondicionado/i, /fancoil/i] },
    { key: 'acs', patterns: [/\bacs\b/i, /agua\s+caliente/i, /termo/i, /acumulador/i] },
  ];

  for (const measure of measureKeywords) {
    if (measure.patterns.some((p) => p.test(text))) {
      data.detectedMeasures!.push(measure.key);
    }
  }

  const providerMatch =
    text.match(/^([A-Z][A-Z\s,.]+)\s+CIF/im) ||
    text.match(/CIF[:\s]+[A-Z0-9]+\s+([A-Z][A-Z\s,.]+)/i);
  if (providerMatch) {
    data.providerName = providerMatch[1].trim();
  }

  return data;
}

// ─── Main analysis entry point ────────────────────────────────────────────────

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
  const extractionConfidence =
    totalAmount && detectedMeasures.some((m) => m.category !== 'UNKNOWN') ? 0.78 : 0.45;

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

// ─── Date detection ───────────────────────────────────────────────────────────

function detectBudgetDate(text: string): string | undefined {
  const months: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', setiembre: '09', octubre: '10',
    noviembre: '11', diciembre: '12',
  };

  // "10 de abril de 2026" or "10 abril 2026" (with or without "Fecha:")
  const longDate = text.match(/(?:fecha:\s*)?(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de(?:l)?\s+)?(\d{4})/i);
  if (longDate) {
    const month = months[longDate[2].toLowerCase()];
    if (month) return `${longDate[3]}-${month}-${longDate[1].padStart(2, '0')}`;
  }

  // "Fecha: 10/04/2026" or "10-04-2026"
  const shortDate = text.match(/(?:fecha:\s*)?(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/i);
  if (shortDate) {
    const year = shortDate[3].length === 2 ? `20${shortDate[3]}` : shortDate[3];
    return `${year}-${shortDate[2].padStart(2, '0')}-${shortDate[1].padStart(2, '0')}`;
  }

  return undefined;
}
