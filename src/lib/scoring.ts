import {
  PropertyDataV2,
  ScoreResultV2,
  ConfidenceLevel,
  EnergyLetter,
  PropertyType,
  HeatingSystem,
  WindowType,
  RenewableSystem
} from "./domain/energy-assessment";

// Keep old interfaces for backward compatibility
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

export function calculateScoreV2(data: PropertyDataV2): ScoreResultV2 {
  let score = 50;
  let confidence: ConfidenceLevel = "Alta";
  const penalties: string[] = [];
  const strengths: string[] = [];
  const missingData: string[] = [];

  const isHouse = ["house", "terraced", "ground_floor", "penthouse"].includes(data.propertyType);

  // Zona climática
  const climateZone = inferClimateZoneFromZipcode(data.zipcode);
  if (climateZone === "Desconocida") {
    missingData.push("Código postal");
    confidence = "Media";
  }

  // Antigüedad
  if (!data.year) {
    missingData.push("Año de construcción");
    confidence = "Baja";
  } else if (data.year < 1980) {
    score += 25;
    penalties.push("Antigüedad (pre-1980, sin aislamiento obligatorio)");
  } else if (data.year < 2006) {
    score += 15;
    penalties.push("Aislamiento estándar antiguo (NBE-CT-79)");
  } else if (data.year < 2020) {
    score -= 5;
    strengths.push("Año de construcción reciente (CTE 2006)");
  } else {
    score -= 15;
    strengths.push("Construcción muy reciente (CTE 2019)");
  }

  // Superficie e Inmueble
  if (!data.area) {
    missingData.push("Superficie");
    if (confidence === "Alta") confidence = "Media";
  } else if (data.area > 150) {
    if (data.heating === "electric" || data.heating === "gas") {
      score += 10;
      penalties.push("Superficie grande con sistemas ineficientes");
    }
  }

  if (data.propertyType === "unknown") {
    missingData.push("Tipo de inmueble");
  } else if (isHouse) {
    score += 5; // Mayor exposición
    penalties.push("Mayor área de exposición (unifamiliar/ático/bajo)");
  } else {
    score -= 5;
    strengths.push("Menor exposición térmica relativa (piso)");
  }

  if (data.orientation === "unknown") {
    missingData.push("Orientación principal");
  } else if (data.orientation === "north") {
    score += 4;
    penalties.push("Orientación norte con menor ganancia solar útil");
  } else if (data.orientation === "south") {
    score -= 4;
    strengths.push("Orientación sur favorable para captación solar");
  }

  // Ventanas
  if (data.windows === "unknown") {
    missingData.push("Tipo de ventanas");
    confidence = "Baja";
  } else if (data.windows === "single") {
    score += 15;
    penalties.push("Ventanas simples (alta pérdida de energía)");
  } else if (data.windows === "double") {
    score -= 5;
  } else if (data.windows === "triple") {
    score -= 15;
    strengths.push("Ventanas de alta eficiencia (triple vidrio)");
  }

  // Envolvente
  if (data.facadeInsulation === "unknown" || !data.facadeInsulation) {
    missingData.push("Aislamiento de fachada");
    confidence = "Baja";
  } else if (data.facadeInsulation === "good") {
    score -= 10;
    strengths.push("Buen aislamiento de fachada");
  }

  if (data.roofInsulation === "unknown" || !data.roofInsulation) {
    missingData.push("Aislamiento de cubierta");
  } else if (data.roofInsulation === "good") {
    score -= 5;
    strengths.push("Buen aislamiento de cubierta");
  } else if (data.roofInsulation === "none" && isHouse) {
    score += 7;
    penalties.push("Cubierta expuesta sin aislamiento declarado");
  }

  if (data.roofType === "unknown") {
    missingData.push("Tipo de cubierta");
  } else if (data.roofType === "flat" && isHouse) {
    score += 2;
    penalties.push("Cubierta plana expuesta a ganancias y pérdidas térmicas");
  } else if (data.roofType === "pitched" && data.renewables === "photovoltaic") {
    strengths.push("Cubierta inclinada compatible con fotovoltaica declarada");
  }

  // Calefacción
  if (data.heating === "unknown") {
    missingData.push("Sistema de calefacción");
    confidence = "Baja";
  } else if (data.heating === "electric") {
    if (data.renewables !== "photovoltaic" && data.renewables !== "both") {
      score += 20;
      penalties.push("Calefacción eléctrica directa sin apoyo renovable");
    }
  } else if (data.heating === "gas") {
    score += 5;
    penalties.push("Calefacción basada en combustibles fósiles");
  } else if (data.heating === "heat_pump") {
    score -= 20;
    strengths.push("Calefacción muy eficiente (Bomba de calor/Aerotermia)");
  } else if (data.heating === "biomass") {
    score -= 10;
    strengths.push("Calefacción por biomasa");
  }

  if (data.ventilation === "unknown") {
    missingData.push("Tipo de ventilación");
  } else if (data.ventilation === "natural") {
    score += 4;
    penalties.push("Ventilación natural sin recuperación de calor");
  } else if (data.ventilation === "heat_recovery") {
    score -= 8;
    strengths.push("Ventilación con recuperación de calor");
  }

  if (data.cooling === "central" && data.heating !== "heat_pump") {
    score += 3;
    penalties.push("Refrigeración central no vinculada a bomba de calor eficiente");
  } else if (data.cooling === "heat_pump") {
    score -= 4;
    strengths.push("Refrigeración mediante bomba de calor eficiente");
  }

  // ACS
  if (data.waterHeating === "unknown") {
    missingData.push("Sistema de ACS");
  } else if (data.waterHeating === "electric") {
    if (data.renewables !== "photovoltaic" && data.renewables !== "both" && data.renewables !== "solar_thermal") {
      score += 10;
      penalties.push("ACS eléctrico directo");
    }
  } else if (data.waterHeating === "heat_pump") {
    score -= 10;
    strengths.push("ACS por bomba de calor/aerotermia");
  } else if (data.waterHeating === "solar") {
    score -= 15;
    strengths.push("ACS apoyado por solar térmica");
  }

  // Renovables
  if (data.renewables === "unknown") {
    missingData.push("Sistemas renovables");
  } else if (data.renewables === "photovoltaic") {
    score -= 15;
    strengths.push("Generación fotovoltaica");
  } else if (data.renewables === "solar_thermal") {
    score -= 10;
    strengths.push("Energía solar térmica");
  } else if (data.renewables === "both") {
    score -= 25;
    strengths.push("Mix renovable completo (FV + Térmica)");
  }

  // Clamp score 0 - 100
  score = Math.max(0, Math.min(100, score));

  let letter: EnergyLetter = "G";
  if (score <= 15) letter = "A";
  else if (score <= 30) letter = "B";
  else if (score <= 45) letter = "C";
  else if (score <= 60) letter = "D";
  else if (score <= 75) letter = "E";
  else if (score <= 90) letter = "F";

  if (missingData.length > 3) {
    confidence = "Baja";
  }

  return {
    score,
    estimatedLetter: letter,
    confidence,
    climateZone,
    penalties,
    strengths,
    missingData,
    explanation: "Estimación basada en el año de construcción, orientación, envolvente, ventilación y eficiencia de sistemas instalados."
  };
}

// Wrapper legacy
export function calculateScore(data: PropertyData): ScoringResult {
  const result = calculateScoreV2({
    year: data.year,
    area: 100,
    zipcode: "00000",
    propertyType: data.propertyType as PropertyType || "unknown",
    heating: data.heating as HeatingSystem || "unknown",
    cooling: "unknown",
    waterHeating: "unknown",
    orientation: "unknown",
    roofType: "unknown",
    ventilation: "unknown",
    windows: data.windows as WindowType || "unknown",
    renewables: data.renewables as RenewableSystem || "unknown",
  });

  return {
    estimatedLetter: result.estimatedLetter,
    confidence: result.confidence,
    penalties: result.penalties
  };
}
