import type { BudgetLineItem, BudgetMeasure, BudgetMeasureCategory } from './types';

const CATEGORY_KEYWORDS: Record<BudgetMeasureCategory, RegExp[]> = {
  WINDOWS: [/ventanas?/i, /doble\s+acristalamiento/i, /climalit/i, /bajo\s+emisivo/i, /carpinter[ií]a/i, /puente\s+t[eé]rmico/i, /\bpvc\b/i],
  ENVELOPE_FACADE: [/fachada/i, /\bsate\b/i, /aislamiento\s+exterior/i, /trasdosado/i, /lana\s+mineral/i, /lana\s+de\s+roca/i, /\beps\b/i, /\bxps\b/i],
  ENVELOPE_ROOF: [/cubierta/i, /tejado/i, /azotea/i, /impermeabilizaci[oó]n/i, /aislamiento\s+.*cubierta/i],
  HEATING_SYSTEM: [/caldera/i, /bomba\s+de\s+calor/i, /aerotermia/i, /radiadores/i, /suelo\s+radiante/i, /biomasa/i, /pellets/i],
  COOLING_SYSTEM: [/aire\s+acondicionado/i, /\bsplit\b/i, /multisplit/i, /\bvrv\b/i, /climatizaci[oó]n/i],
  DHW_SYSTEM: [/\bacs\b/i, /agua\s+caliente\s+sanitaria/i, /termo/i, /acumulador/i],
  VENTILATION: [/ventilaci[oó]n/i, /recuperador\s+de\s+calor/i, /\bvmc\b/i],
  PV: [/fotovoltaica/i, /placas?\s+solares/i, /paneles?\s+solares/i, /inversor/i, /\bkwp\b/i],
  SOLAR_THERMAL: [/solar\s+t[eé]rmica/i, /captadores?\s+solares/i],
  LIGHTING: [/\bled\b/i, /iluminaci[oó]n\s+eficiente/i],
  OTHER_NON_ENERGY: [/alicatado/i, /pintura/i, /demolici[oó]n/i, /sanitario/i, /mobiliario/i, /cocina/i],
  UNKNOWN: [],
};

const ENERGY_CATEGORIES = Object.keys(CATEGORY_KEYWORDS).filter(
  (category) => category !== 'OTHER_NON_ENERGY' && category !== 'UNKNOWN'
) as BudgetMeasureCategory[];

export function classifyBudgetText(text: string): BudgetMeasureCategory[] {
  const categories = ENERGY_CATEGORIES.filter((category) =>
    CATEGORY_KEYWORDS[category].some((pattern) => pattern.test(text))
  );

  if (categories.length > 0) return categories;
  if (CATEGORY_KEYWORDS.OTHER_NON_ENERGY.some((pattern) => pattern.test(text))) return ['OTHER_NON_ENERGY'];
  return ['UNKNOWN'];
}

export function classifyBudgetLineItems(lineItems: BudgetLineItem[], fullText = ''): BudgetMeasure[] {
  const measuresByCategory = new Map<BudgetMeasureCategory, BudgetMeasure>();

  for (const line of lineItems) {
    const categories = classifyBudgetText(line.description);
    for (const category of categories) {
      const previous = measuresByCategory.get(category);
      measuresByCategory.set(category, {
        category,
        description: previous ? `${previous.description}; ${line.description}` : line.description,
        cost: (previous?.cost || 0) + (line.total || 0),
      });
    }
  }

  if (measuresByCategory.size === 0 && fullText) {
    for (const category of classifyBudgetText(fullText)) {
      measuresByCategory.set(category, {
        category,
        description: category === 'UNKNOWN' ? 'Medidas no clasificadas' : `Medida detectada: ${category}`,
      });
    }
  }

  return Array.from(measuresByCategory.values());
}

export function categoryLabel(category: BudgetMeasureCategory) {
  return category
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
