import type { AppLanguage } from '@/lib/preferences';
import type { BudgetLineItem } from '@/lib/ingestion/types';

export type FindingStatus =
  | 'IN_RANGE'
  | 'HIGH_REVIEW'
  | 'LOW_REVIEW'
  | 'INCOMPLETE'
  | 'REQUIRES_CLARIFICATION';

export type AdvancedFinding = {
  description: string;
  total?: number | null;
  unitPrice?: number | null;
  quantity?: number | null;
  status: FindingStatus;
  deviationPct?: number;
  deviationAbs?: number;
};

export type Omission = {
  category: string;
  item: string;
  reasonKey: string;
};

export type BudgetCategory =
  | 'windows'
  | 'aerothermia'
  | 'insulation'
  | 'photovoltaic'
  | 'full_renovation'
  | 'general';

// --- Status labels ---
const statusLabels: Record<AppLanguage, Record<FindingStatus, string>> = {
  es: {
    IN_RANGE: 'Dentro del rango orientativo',
    HIGH_REVIEW: 'Precio unitario elevado',
    LOW_REVIEW: 'Precio unitario bajo — revisar alcance',
    INCOMPLETE: 'Partida incompleta',
    REQUIRES_CLARIFICATION: 'Requiere aclaración',
  },
  en: {
    IN_RANGE: 'Within indicative range',
    HIGH_REVIEW: 'High unit price',
    LOW_REVIEW: 'Low unit price — check scope',
    INCOMPLETE: 'Incomplete line item',
    REQUIRES_CLARIFICATION: 'Requires clarification',
  },
  de: {
    IN_RANGE: 'Im orientierenden Bereich',
    HIGH_REVIEW: 'Hoher Stückpreis',
    LOW_REVIEW: 'Niedriger Stückpreis — Umfang prüfen',
    INCOMPLETE: 'Unvollständige Position',
    REQUIRES_CLARIFICATION: 'Erläuterung erforderlich',
  },
};

export function getFindingStatusLabel(status: FindingStatus, lang: AppLanguage = 'es'): string {
  return (statusLabels[lang] ?? statusLabels.es)[status];
}

// --- Category detection ---
const categoryKeywords: Record<BudgetCategory, string[]> = {
  windows: ['ventana', 'window', 'fenster', 'carpintería', 'acristalamiento', 'perfilería', 'vidrio'],
  aerothermia: ['aerotermia', 'bomba de calor', 'heat pump', 'wärmepumpe', 'acs', 'calefacción', 'hvac'],
  insulation: ['aislamiento', 'insulation', 'dämmung', 'sate', 'fachada', 'cubierta', 'lana', 'poliestireno', 'pu'],
  photovoltaic: ['fotovoltaica', 'solar', 'paneles', 'inversor', 'kwp', 'autoconsumo', 'photovoltaik'],
  full_renovation: ['reforma', 'renovation', 'renovierung', 'integral', 'demolición', 'albañilería', 'obra'],
  general: [],
};

export function detectBudgetCategory(descriptions: string[]): BudgetCategory {
  const text = descriptions.join(' ').toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords) as [BudgetCategory, string[]][]) {
    if (cat === 'general') continue;
    if (keywords.some((kw) => text.includes(kw))) return cat;
  }
  return 'general';
}

// --- Omissions per category ---
const omissionsByCategory: Record<BudgetCategory, { item: string; reasonKey: string }[]> = {
  windows: [
    { item: 'Medición por m² de cada ventana', reasonKey: 'windows.no_measurement' },
    { item: 'Tipo de vidrio (simple, doble, triple)', reasonKey: 'windows.no_glass_spec' },
    { item: 'Material de perfilería (PVC, aluminio, madera)', reasonKey: 'windows.no_frame_spec' },
    { item: 'Retirada de ventanas existentes', reasonKey: 'windows.no_removal' },
    { item: 'Remates y sellado', reasonKey: 'windows.no_finishing' },
    { item: 'IVA desglosado', reasonKey: 'windows.no_vat' },
  ],
  aerothermia: [
    { item: 'Potencia nominal del equipo (kW)', reasonKey: 'aerothermia.no_power' },
    { item: 'Depósito de ACS (litros)', reasonKey: 'aerothermia.no_tank' },
    { item: 'Instalación eléctrica asociada', reasonKey: 'aerothermia.no_electrical' },
    { item: 'Puesta en marcha y configuración', reasonKey: 'aerothermia.no_commissioning' },
    { item: 'Legalización si aplica', reasonKey: 'aerothermia.no_legalization' },
  ],
  insulation: [
    { item: 'Superficie tratada en m²', reasonKey: 'insulation.no_area' },
    { item: 'Espesor del aislamiento (mm)', reasonKey: 'insulation.no_thickness' },
    { item: 'Tipo de acabado exterior', reasonKey: 'insulation.no_finish' },
    { item: 'Medios auxiliares (andamios)', reasonKey: 'insulation.no_scaffolding' },
    { item: 'Remates, esquinas y ventanas', reasonKey: 'insulation.no_details' },
  ],
  photovoltaic: [
    { item: 'Potencia pico total (kWp)', reasonKey: 'photovoltaic.no_kwp' },
    { item: 'Marca y modelo del inversor', reasonKey: 'photovoltaic.no_inverter' },
    { item: 'Estructura de soporte', reasonKey: 'photovoltaic.no_structure' },
    { item: 'Tramitación y legalización', reasonKey: 'photovoltaic.no_legalization' },
    { item: 'Sistema de monitorización', reasonKey: 'photovoltaic.no_monitoring' },
  ],
  full_renovation: [
    { item: 'Capítulos sin medición por partida', reasonKey: 'full_renovation.no_measurement' },
    { item: 'Partidas alzadas sin desglose', reasonKey: 'full_renovation.lump_sum' },
    { item: 'Licencias y tasas', reasonKey: 'full_renovation.no_permits' },
    { item: 'Gestión de residuos', reasonKey: 'full_renovation.no_waste' },
    { item: 'IVA desglosado', reasonKey: 'full_renovation.no_vat' },
  ],
  general: [
    { item: 'Mediciones por partida', reasonKey: 'general.no_measurement' },
    { item: 'IVA desglosado', reasonKey: 'general.no_vat' },
    { item: 'Garantías y condiciones de pago', reasonKey: 'general.no_warranty' },
  ],
};

export function getOmissionsForCategory(category: BudgetCategory): Omission[] {
  const entries = omissionsByCategory[category] ?? omissionsByCategory.general;
  return entries.map((e) => ({ category, item: e.item, reasonKey: e.reasonKey }));
}

// --- Suggested questions ---
const suggestedQuestions: Record<AppLanguage, Record<BudgetCategory, string[]>> = {
  es: {
    windows: [
      '¿La superficie usada corresponde a medida de luz, de premarco o de hoja?',
      '¿El tipo de vidrio cumple con los requisitos térmicos del CTE DB-HE?',
      '¿Está incluida la retirada y gestión de las ventanas antiguas?',
      '¿Cuál es el coeficiente Uw total de cada ventana propuesta?',
    ],
    aerothermia: [
      '¿La potencia propuesta cubre las necesidades de calefacción y ACS de la vivienda?',
      '¿Incluye la adaptación eléctrica necesaria?',
      '¿Está incluida la legalización ante el organismo competente?',
      '¿Se puede integrarse con la instalación eléctrica existente?',
    ],
    insulation: [
      '¿La superficie tratada corresponde a la fachada completa o solo a zonas específicas?',
      '¿El espesor propuesto cumple con los valores límite del CTE DB-HE?',
      '¿Se requiere autorización de la comunidad de propietarios?',
      '¿Están incluidos andamios y medios auxiliares?',
    ],
    photovoltaic: [
      '¿La potencia propuesta en kWp cubre el consumo anual estimado?',
      '¿Están incluidos la tramitación y el acceso a la red?',
      '¿La garantía de los paneles y el inversor es de al menos 25 y 10 años respectivamente?',
      '¿Es compatible con el sistema de compensación simplificada?',
    ],
    full_renovation: [
      '¿Hay partidas alzadas sin medición por capítulo?',
      '¿Están incluidas licencias, tasas y gestión de residuos?',
      '¿Cómo se gestiona el acceso y la seguridad durante la obra?',
      '¿Cuáles son las condiciones de pago y retención de garantía?',
    ],
    general: [
      '¿Están todas las partidas con medición y precio unitario?',
      '¿El precio incluye o excluye IVA?',
      '¿Cuáles son las garantías ofrecidas?',
      '¿Qué materiales o marcas específicas se incluyen?',
    ],
  },
  en: {
    windows: [
      'Does the area measurement correspond to the clear opening, frame or sash?',
      'Does the glazing type meet the thermal requirements of the applicable energy code?',
      'Is the removal and disposal of existing windows included?',
      'What is the total Uw coefficient for each proposed window?',
    ],
    aerothermia: [
      'Does the proposed capacity cover the heating and DHW needs of the property?',
      'Is the necessary electrical upgrade included?',
      'Is the regulatory approval/legalization included?',
      'Can it be integrated with the existing electrical installation?',
    ],
    insulation: [
      'Does the treated area cover the full facade or only specific zones?',
      'Does the proposed thickness meet the applicable energy code minimum values?',
      'Is community owners association approval required?',
      'Are scaffolding and auxiliary means included?',
    ],
    photovoltaic: [
      'Does the proposed kWp capacity cover the estimated annual consumption?',
      'Are grid connection and regulatory filing included?',
      'Are panel and inverter warranties at least 25 and 10 years respectively?',
      'Is it compatible with simplified net metering compensation?',
    ],
    full_renovation: [
      'Are there lump-sum items without detailed breakdown?',
      'Are permits, fees and waste management included?',
      'How is site access and safety managed during works?',
      'What are the payment terms and retention conditions?',
    ],
    general: [
      'Do all line items include measurement and unit price?',
      'Does the price include or exclude VAT?',
      'What warranties are offered?',
      'Which specific materials or brands are included?',
    ],
  },
  de: {
    windows: [
      'Bezieht sich die Flächenmessung auf das Lichtmaß, den Rahmen oder den Flügel?',
      'Entspricht die Verglasung den Wärmeschutzanforderungen der EnEV/GEG?',
      'Ist der Ausbau und die Entsorgung der alten Fenster enthalten?',
      'Wie hoch ist der Gesamtwert Uw jedes vorgeschlagenen Fensters?',
    ],
    aerothermia: [
      'Deckt die vorgeschlagene Leistung den Heizungs- und TWW-Bedarf ab?',
      'Ist die erforderliche Elektroanpassung enthalten?',
      'Ist die behördliche Genehmigung/Zulassung enthalten?',
      'Ist es mit der bestehenden Elektroinstallation kompatibel?',
    ],
    insulation: [
      'Umfasst die behandelte Fläche die gesamte Fassade oder nur bestimmte Bereiche?',
      'Entspricht die vorgeschlagene Dicke den Mindestwerten des GEG?',
      'Ist eine Genehmigung der Eigentümergemeinschaft erforderlich?',
      'Sind Gerüste und Hilfsmittel enthalten?',
    ],
    photovoltaic: [
      'Deckt die vorgeschlagene kWp-Leistung den geschätzten Jahresverbrauch?',
      'Sind Netzanschluss und behördliche Meldung enthalten?',
      'Betragen die Garantien für Module und Wechselrichter mindestens 25 bzw. 10 Jahre?',
      'Ist es mit der Einspeisevergütung kompatibel?',
    ],
    full_renovation: [
      'Gibt es Pauschalposten ohne detaillierte Aufschlüsselung?',
      'Sind Genehmigungen, Gebühren und Abfallentsorgung enthalten?',
      'Wie wird der Zugang und die Sicherheit während der Bauarbeiten geregelt?',
      'Wie lauten die Zahlungsbedingungen und die Einbehaltsregelungen?',
    ],
    general: [
      'Haben alle Positionen eine Mengenangabe und einen Stückpreis?',
      'Ist der Preis mit oder ohne MwSt.?',
      'Welche Garantien werden angeboten?',
      'Welche spezifischen Materialien oder Marken sind enthalten?',
    ],
  },
};

export function getSuggestedQuestions(category: BudgetCategory, lang: AppLanguage = 'es'): string[] {
  return (suggestedQuestions[lang] ?? suggestedQuestions.es)[category] ?? suggestedQuestions.es.general;
}

// --- Advanced findings builder ---
const UNIT_PRICE_HIGH_THRESHOLD = 450;
const UNIT_PRICE_LOW_THRESHOLD = 25;

export function buildAdvancedFindings(lineItems: BudgetLineItem[]): AdvancedFinding[] {
  return lineItems.map((item) => {
    const unitPrice = item.unitPrice || (item.total && item.quantity ? item.total / item.quantity : undefined);
    const hasQuantity = item.quantity != null && item.quantity > 0;
    const hasTotal = item.total != null && item.total > 0;

    if (!hasTotal) {
      return {
        description: item.description,
        total: null,
        unitPrice: null,
        status: 'INCOMPLETE' as FindingStatus,
      };
    }

    if (!hasQuantity && !unitPrice) {
      return {
        description: item.description,
        total: item.total,
        unitPrice: null,
        status: 'REQUIRES_CLARIFICATION' as FindingStatus,
      };
    }

    const high = unitPrice !== undefined && unitPrice > UNIT_PRICE_HIGH_THRESHOLD;
    const low = unitPrice !== undefined && unitPrice < UNIT_PRICE_LOW_THRESHOLD;

    return {
      description: item.description,
      total: item.total,
      unitPrice,
      quantity: item.quantity,
      status: high ? 'HIGH_REVIEW' : low ? 'LOW_REVIEW' : 'IN_RANGE',
    };
  });
}

// --- Consolidated advanced analysis ---
export type BudgetAdvancedAnalysis = {
  category: BudgetCategory;
  findings: AdvancedFinding[];
  omissions: Omission[];
  suggestedQuestions: string[];
  legalNotice: string;
  alertKey: string;
};

const legalNotices: Record<AppLanguage, string> = {
  es: 'Análisis automático orientativo. No sustituye la revisión de un técnico, arquitecto, aparejador ni asesor legal.',
  en: 'Indicative automatic analysis. Does not replace the review of a qualified technician, architect, surveyor or legal adviser.',
  de: 'Orientierende automatische Analyse. Ersetzt nicht die Prüfung durch qualifizierte Fachleute, Architekten oder Rechtsberater.',
};

export function buildBudgetAdvancedAnalysis(
  lineItems: BudgetLineItem[],
  totalAmount: number | undefined,
  lang: AppLanguage = 'es',
): BudgetAdvancedAnalysis {
  const descriptions = lineItems.map((i) => i.description).filter(Boolean) as string[];
  const category = detectBudgetCategory(descriptions);
  const findings = buildAdvancedFindings(lineItems);
  const omissions = getOmissionsForCategory(category);
  const questions = getSuggestedQuestions(category, lang);

  const isHighTotal = totalAmount !== undefined && totalAmount > 30000;

  return {
    category,
    findings,
    omissions,
    suggestedQuestions: questions,
    legalNotice: legalNotices[lang] ?? legalNotices.es,
    alertKey: isHighTotal ? 'budget.alert_high_total' : 'budget.alert_general',
  };
}
