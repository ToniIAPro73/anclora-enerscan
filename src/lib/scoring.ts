import {
  ConfidenceLevel,
  EnergyLetter,
  HeatingSystem,
  PropertyDataV2,
  PropertyType,
  RenewableSystem,
  ScoreResultV2,
  ScoreRuleBreakdownItem,
  ScoreRuleCategory,
  WindowType,
} from "./domain/energy-assessment";

// Keep old interfaces for backward compatibility.
export interface PropertyData {
  year: number;
  propertyType: string;
  heating: string;
  windows: string;
  renewables: string;
}

export interface ScoringResult {
  estimatedLetter: string;
  confidence: string;
  penalties: string[];
}

export type ScoreRuleContext = {
  property: PropertyDataV2;
  climateZone?: string | null;
};

export type ScoreRuleResult = {
  delta: number;
  reason: string;
  type: "penalty" | "bonus" | "neutral";
  missingData?: string[];
  confidence?: ConfidenceLevel;
};

export type ScoreRule = {
  id: string;
  category: ScoreRuleCategory;
  label: string;
  apply: (context: ScoreRuleContext) => ScoreRuleResult | null;
};

function isExposedTypology(propertyType: PropertyDataV2["propertyType"]) {
  return ["house", "terraced", "ground_floor", "penthouse"].includes(propertyType);
}

function hasPhotovoltaic(renewables: PropertyDataV2["renewables"]) {
  return renewables === "photovoltaic" || renewables === "both";
}

function hasSolarThermal(renewables: PropertyDataV2["renewables"]) {
  return renewables === "solar_thermal" || renewables === "both";
}

export function inferClimateZoneFromZipcode(zipcode: string): string {
  if (!zipcode || zipcode.length !== 5) return "Desconocida";

  const prefix = zipcode.substring(0, 2);
  const med = ["03", "07", "08", "12", "17", "43", "46", "29", "04"];
  const south = ["11", "21", "41", "14", "18"];
  const north = ["15", "27", "33", "36", "39", "31", "48", "20", "40", "01"];
  const islands = ["35", "38"];

  if (med.includes(prefix)) return "Aproximada: Mediterránea litoral";
  if (south.includes(prefix)) return "Aproximada: Sur";
  if (north.includes(prefix)) return "Aproximada: Norte atlántico";
  if (islands.includes(prefix)) return "Aproximada: Islas Canarias";

  return "Aproximada: Interior peninsular";
}

export const dataQualityRules: ScoreRule[] = [
  {
    id: "missing-climate-zone",
    category: "data_quality",
    label: "Código postal y zona climática",
    apply: ({ climateZone }) => climateZone === "Desconocida"
      ? { delta: 0, reason: "Código postal", type: "neutral", missingData: ["Código postal"], confidence: "Media" }
      : null,
  },
  {
    id: "missing-year",
    category: "data_quality",
    label: "Año de construcción",
    apply: ({ property }) => !property.year
      ? { delta: 0, reason: "Año de construcción", type: "neutral", missingData: ["Año de construcción"], confidence: "Baja" }
      : null,
  },
  {
    id: "missing-area",
    category: "data_quality",
    label: "Superficie útil",
    apply: ({ property }) => !property.area
      ? { delta: 0, reason: "Superficie", type: "neutral", missingData: ["Superficie"], confidence: "Media" }
      : null,
  },
  {
    id: "missing-property-type",
    category: "data_quality",
    label: "Tipo de inmueble",
    apply: ({ property }) => property.propertyType === "unknown"
      ? { delta: 0, reason: "Tipo de inmueble", type: "neutral", missingData: ["Tipo de inmueble"] }
      : null,
  },
  {
    id: "missing-orientation",
    category: "data_quality",
    label: "Orientación principal",
    apply: ({ property }) => property.orientation === "unknown"
      ? { delta: 0, reason: "Orientación principal", type: "neutral", missingData: ["Orientación principal"] }
      : null,
  },
  {
    id: "missing-roof-type",
    category: "data_quality",
    label: "Tipo de cubierta",
    apply: ({ property }) => property.roofType === "unknown"
      ? { delta: 0, reason: "Tipo de cubierta", type: "neutral", missingData: ["Tipo de cubierta"] }
      : null,
  },
  {
    id: "missing-windows",
    category: "data_quality",
    label: "Tipo de ventanas",
    apply: ({ property }) => property.windows === "unknown"
      ? { delta: 0, reason: "Tipo de ventanas", type: "neutral", missingData: ["Tipo de ventanas"], confidence: "Baja" }
      : null,
  },
  {
    id: "missing-facade-insulation",
    category: "data_quality",
    label: "Aislamiento de fachada",
    apply: ({ property }) => !property.facadeInsulation || property.facadeInsulation === "unknown"
      ? { delta: 0, reason: "Aislamiento de fachada", type: "neutral", missingData: ["Aislamiento de fachada"], confidence: "Baja" }
      : null,
  },
  {
    id: "missing-roof-insulation",
    category: "data_quality",
    label: "Aislamiento de cubierta",
    apply: ({ property }) => !property.roofInsulation || property.roofInsulation === "unknown"
      ? { delta: 0, reason: "Aislamiento de cubierta", type: "neutral", missingData: ["Aislamiento de cubierta"] }
      : null,
  },
  {
    id: "missing-heating",
    category: "data_quality",
    label: "Sistema de calefacción",
    apply: ({ property }) => property.heating === "unknown"
      ? { delta: 0, reason: "Sistema de calefacción", type: "neutral", missingData: ["Sistema de calefacción"], confidence: "Baja" }
      : null,
  },
  {
    id: "missing-ventilation",
    category: "data_quality",
    label: "Tipo de ventilación",
    apply: ({ property }) => property.ventilation === "unknown"
      ? { delta: 0, reason: "Tipo de ventilación", type: "neutral", missingData: ["Tipo de ventilación"] }
      : null,
  },
  {
    id: "missing-water-heating",
    category: "data_quality",
    label: "Sistema de ACS",
    apply: ({ property }) => property.waterHeating === "unknown"
      ? { delta: 0, reason: "Sistema de ACS", type: "neutral", missingData: ["Sistema de ACS"] }
      : null,
  },
  {
    id: "missing-renewables",
    category: "data_quality",
    label: "Sistemas renovables",
    apply: ({ property }) => property.renewables === "unknown"
      ? { delta: 0, reason: "Sistemas renovables", type: "neutral", missingData: ["Sistemas renovables"] }
      : null,
  },
];

export const climateRules: ScoreRule[] = [];

export const typologyRules: ScoreRule[] = [
  {
    id: "construction-year",
    category: "typology",
    label: "Año de construcción",
    apply: ({ property }) => {
      if (!property.year) return null;
      if (property.year < 1980) return { delta: 25, reason: "Antigüedad (pre-1980, sin aislamiento obligatorio)", type: "penalty" };
      if (property.year < 2006) return { delta: 15, reason: "Aislamiento estándar antiguo (NBE-CT-79)", type: "penalty" };
      if (property.year < 2020) return { delta: -5, reason: "Año de construcción reciente (CTE 2006)", type: "bonus" };
      return { delta: -15, reason: "Construcción muy reciente (CTE 2019)", type: "bonus" };
    },
  },
  {
    id: "large-area-with-inefficient-system",
    category: "typology",
    label: "Superficie y sistema térmico",
    apply: ({ property }) => property.area > 150 && (property.heating === "electric" || property.heating === "gas")
      ? { delta: 10, reason: "Superficie grande con sistemas ineficientes", type: "penalty" }
      : null,
  },
  {
    id: "exposed-typology",
    category: "typology",
    label: "Exposición térmica por tipología",
    apply: ({ property }) => {
      if (property.propertyType === "unknown") return null;
      if (isExposedTypology(property.propertyType)) {
        return { delta: 5, reason: "Mayor área de exposición (unifamiliar/ático/bajo)", type: "penalty" };
      }
      return { delta: -5, reason: "Menor exposición térmica relativa (piso)", type: "bonus" };
    },
  },
  {
    id: "orientation",
    category: "typology",
    label: "Orientación principal",
    apply: ({ property }) => {
      if (property.orientation === "north") return { delta: 4, reason: "Orientación norte con menor ganancia solar útil", type: "penalty" };
      if (property.orientation === "south") return { delta: -4, reason: "Orientación sur favorable para captación solar", type: "bonus" };
      return null;
    },
  },
];

export const envelopeRules: ScoreRule[] = [
  {
    id: "window-performance",
    category: "envelope",
    label: "Prestación de ventanas",
    apply: ({ property }) => {
      if (property.windows === "single") return { delta: 15, reason: "Ventanas simples (alta pérdida de energía)", type: "penalty" };
      if (property.windows === "double") return { delta: -5, reason: "Doble acristalamiento declarado", type: "bonus" };
      if (property.windows === "triple") return { delta: -15, reason: "Ventanas de alta eficiencia (triple vidrio)", type: "bonus" };
      return null;
    },
  },
  {
    id: "facade-insulation",
    category: "envelope",
    label: "Aislamiento de fachada",
    apply: ({ property }) => property.facadeInsulation === "good"
      ? { delta: -10, reason: "Buen aislamiento de fachada", type: "bonus" }
      : null,
  },
  {
    id: "roof-insulation",
    category: "envelope",
    label: "Aislamiento de cubierta",
    apply: ({ property }) => {
      if (property.roofInsulation === "good") return { delta: -5, reason: "Buen aislamiento de cubierta", type: "bonus" };
      if (property.roofInsulation === "none" && isExposedTypology(property.propertyType)) {
        return { delta: 7, reason: "Cubierta expuesta sin aislamiento declarado", type: "penalty" };
      }
      return null;
    },
  },
  {
    id: "roof-type",
    category: "envelope",
    label: "Tipo de cubierta",
    apply: ({ property }) => {
      if (property.roofType === "flat" && isExposedTypology(property.propertyType)) {
        return { delta: 2, reason: "Cubierta plana expuesta a ganancias y pérdidas térmicas", type: "penalty" };
      }
      if (property.roofType === "pitched" && property.renewables === "photovoltaic") {
        return { delta: 0, reason: "Cubierta inclinada compatible con fotovoltaica declarada", type: "bonus" };
      }
      return null;
    },
  },
];

export const systemRules: ScoreRule[] = [
  {
    id: "heating-system",
    category: "systems",
    label: "Sistema de calefacción",
    apply: ({ property }) => {
      if (property.heating === "electric" && !hasPhotovoltaic(property.renewables)) {
        return { delta: 20, reason: "Calefacción eléctrica directa sin apoyo renovable", type: "penalty" };
      }
      if (property.heating === "gas") return { delta: 5, reason: "Calefacción basada en combustibles fósiles", type: "penalty" };
      if (property.heating === "heat_pump") return { delta: -20, reason: "Calefacción muy eficiente (Bomba de calor/Aerotermia)", type: "bonus" };
      if (property.heating === "biomass") return { delta: -10, reason: "Calefacción por biomasa", type: "bonus" };
      return null;
    },
  },
  {
    id: "ventilation",
    category: "systems",
    label: "Ventilación",
    apply: ({ property }) => {
      if (property.ventilation === "natural") return { delta: 4, reason: "Ventilación natural sin recuperación de calor", type: "penalty" };
      if (property.ventilation === "heat_recovery") return { delta: -8, reason: "Ventilación con recuperación de calor", type: "bonus" };
      return null;
    },
  },
  {
    id: "cooling",
    category: "systems",
    label: "Refrigeración",
    apply: ({ property }) => {
      if (property.cooling === "central" && property.heating !== "heat_pump") {
        return { delta: 3, reason: "Refrigeración central no vinculada a bomba de calor eficiente", type: "penalty" };
      }
      if (property.cooling === "heat_pump") return { delta: -4, reason: "Refrigeración mediante bomba de calor eficiente", type: "bonus" };
      return null;
    },
  },
  {
    id: "domestic-hot-water",
    category: "systems",
    label: "Agua caliente sanitaria",
    apply: ({ property }) => {
      if (property.waterHeating === "electric" && !hasPhotovoltaic(property.renewables) && !hasSolarThermal(property.renewables)) {
        return { delta: 10, reason: "ACS eléctrico directo", type: "penalty" };
      }
      if (property.waterHeating === "heat_pump") return { delta: -10, reason: "ACS por bomba de calor/aerotermia", type: "bonus" };
      if (property.waterHeating === "solar") return { delta: -15, reason: "ACS apoyado por solar térmica", type: "bonus" };
      return null;
    },
  },
];

export const renewableRules: ScoreRule[] = [
  {
    id: "renewables",
    category: "renewables",
    label: "Energías renovables",
    apply: ({ property }) => {
      if (property.renewables === "photovoltaic") return { delta: -15, reason: "Generación fotovoltaica", type: "bonus" };
      if (property.renewables === "solar_thermal") return { delta: -10, reason: "Energía solar térmica", type: "bonus" };
      if (property.renewables === "both") return { delta: -25, reason: "Mix renovable completo (FV + Térmica)", type: "bonus" };
      return null;
    },
  },
];

export const scoreRules: ScoreRule[] = [
  ...dataQualityRules,
  ...climateRules,
  ...typologyRules,
  ...envelopeRules,
  ...systemRules,
  ...renewableRules,
];

function confidenceRank(confidence: ConfidenceLevel) {
  return confidence === "Alta" ? 3 : confidence === "Media" ? 2 : 1;
}

function lowerConfidence(current: ConfidenceLevel, next: ConfidenceLevel): ConfidenceLevel {
  return confidenceRank(next) < confidenceRank(current) ? next : current;
}

function scoreToLetter(score: number): EnergyLetter {
  if (score <= 15) return "A";
  if (score <= 30) return "B";
  if (score <= 45) return "C";
  if (score <= 60) return "D";
  if (score <= 75) return "E";
  if (score <= 90) return "F";
  return "G";
}

export function calculateScoreV2(data: PropertyDataV2): ScoreResultV2 {
  const climateZone = inferClimateZoneFromZipcode(data.zipcode);
  const context: ScoreRuleContext = { property: data, climateZone };

  let score = 50;
  let confidence: ConfidenceLevel = "Alta";
  const penalties: string[] = [];
  const strengths: string[] = [];
  const missingData = new Set<string>();
  const ruleBreakdown: ScoreRuleBreakdownItem[] = [];

  for (const rule of scoreRules) {
    const result = rule.apply(context);
    if (!result) continue;

    score += result.delta;

    if (result.type === "penalty") penalties.push(result.reason);
    if (result.type === "bonus" && result.delta <= 0) strengths.push(result.reason);
    for (const missing of result.missingData || []) missingData.add(missing);
    if (result.confidence) confidence = lowerConfidence(confidence, result.confidence);

    ruleBreakdown.push({
      id: rule.id,
      category: rule.category,
      label: rule.label,
      delta: result.delta,
      reason: result.reason,
      type: result.type,
    });
  }

  const missingDataList = Array.from(missingData);
  if (missingDataList.length > 3) confidence = "Baja";

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    estimatedLetter: scoreToLetter(score),
    confidence,
    climateZone,
    penalties,
    strengths,
    missingData: missingDataList,
    ruleBreakdown,
    explanation: "Estimación v2.1 basada en reglas trazables sobre año de construcción, tipología, zona climática, envolvente, ventilación, sistemas térmicos y renovables declarados.",
  };
}

// Wrapper legacy
export function calculateScore(data: PropertyData): ScoringResult {
  const propertyType = data.propertyType === "piso" ? "flat" : data.propertyType === "unifamiliar" ? "house" : data.propertyType;
  const heating = data.heating === "aerothermia" ? "heat_pump" : data.heating;
  const windows = data.windows === "simple" ? "single" : data.windows;
  const renewables = data.renewables === "fv" ? "photovoltaic" : data.renewables;
  const result = calculateScoreV2({
    year: data.year,
    area: 100,
    zipcode: "00000",
    propertyType: propertyType as PropertyType || "unknown",
    heating: heating as HeatingSystem || "unknown",
    cooling: "unknown",
    waterHeating: "unknown",
    orientation: "unknown",
    roofType: "unknown",
    ventilation: "unknown",
    windows: windows as WindowType || "unknown",
    renewables: renewables as RenewableSystem || "unknown",
  });

  return {
    estimatedLetter: result.estimatedLetter,
    confidence: result.confidence,
    penalties: result.penalties,
  };
}
