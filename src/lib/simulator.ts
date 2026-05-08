import { ImprovementScenario, PropertyDataV2, ScoreResultV2 } from "./domain/energy-assessment";

export function generateScenarios(propertyData: PropertyDataV2, result: ScoreResultV2): ImprovementScenario[] {
  const scenarios: ImprovementScenario[] = [];

  // Basic scenario
  const basicMeasures: string[] = [];
  if (propertyData.windows === "single" || propertyData.windows === "unknown") {
    basicMeasures.push("Sustitución de ventanas por doble vidrio con RPT.");
  } else {
    basicMeasures.push("Mejora en la hermeticidad y burletes.");
  }
  if (propertyData.waterHeating === "electric" && propertyData.renewables !== "solar_thermal" && propertyData.renewables !== "both") {
    basicMeasures.push("Instalación de aerotermo para ACS.");
  } else {
    basicMeasures.push("Instalación de termostatos inteligentes.");
  }

  scenarios.push({
    id: "basic",
    title: "Paquete Básico",
    objective: "Reducir la demanda con una inversión mínima.",
    estimatedCostRange: "1.500€ - 4.500€",
    estimatedSavingsRange: "10% - 20%",
    expectedLetterImpact: result.score <= 30 ? "Mantiene o mejora ligeramente" : "Sube 1 letra (ej: de E a D)",
    measures: basicMeasures,
    dependencies: ["Licencia de obra menor (si aplica)"],
    warnings: ["Mejora el confort pero no transforma el inmueble"],
    providerCategories: ["ventanas", "acs"]
  });

  // Intermediate scenario
  const intermediateMeasures: string[] = [...basicMeasures];
  if (propertyData.heating === "electric" || propertyData.heating === "gas") {
    intermediateMeasures.push("Sustitución de calefacción por bomba de calor/aerotermia.");
  }
  if (propertyData.renewables === "none" && (propertyData.propertyType === "house" || propertyData.propertyType === "terraced" || propertyData.propertyType === "penthouse")) {
    intermediateMeasures.push("Instalación de paneles solares fotovoltaicos.");
  }

  scenarios.push({
    id: "intermediate",
    title: "Mejora Intermedia",
    objective: "Actuar sobre los sistemas de mayor consumo.",
    estimatedCostRange: "6.000€ - 15.000€",
    estimatedSavingsRange: "30% - 50%",
    expectedLetterImpact: "Sube 1-2 letras (ej: de F a D/C)",
    measures: intermediateMeasures,
    dependencies: ["Espacio para unidad exterior de aerotermia", "Viabilidad en cubierta (FV)"],
    warnings: ["Requiere permiso de la comunidad si es un piso", "Conviene aislar antes para dimensionar bien los equipos"],
    providerCategories: ["climatización", "fotovoltaica", "ventanas"]
  });

  // Deep scenario
  const deepMeasures: string[] = [
    "SATE en fachada o inyección en cámara (según viabilidad).",
    "Aislamiento en cubierta (si aplicable).",
    "Bomba de calor (Aerotermia) de alta eficiencia.",
    "Ventilación mecánica con recuperador de calor.",
    "Paneles solares fotovoltaicos y batería térmica/eléctrica."
  ];

  scenarios.push({
    id: "deep",
    title: "Rehabilitación Profunda",
    objective: "Llevar la vivienda a estándares casi nulos (NZEB).",
    estimatedCostRange: "25.000€ - 50.000€+",
    estimatedSavingsRange: "60% - 80%",
    expectedLetterImpact: "Alcanzar Letra A o B",
    measures: deepMeasures,
    dependencies: ["Proyecto técnico", "Licencia de obra mayor", "Acuerdo de comunidad (SATE)"],
    warnings: ["Las obras pueden requerir desalojar temporalmente la vivienda"],
    providerCategories: ["aislamiento", "climatización", "fotovoltaica", "certificador"]
  });

  return scenarios;
}
