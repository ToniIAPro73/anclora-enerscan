import { ImprovementScenario, PropertyDataV2, ScoreResultV2 } from "./domain/energy-assessment";
import { calculateScenarioCostEstimate } from "./costs/cost-engine";
import { mapPropertyType } from "./costs/quantity-resolver";
import { measuresForSimulatorScenario } from "./costs/scenario-matrix";

function estimateLetterImpact(result: ScoreResultV2, delta: number) {
  const projected = Math.max(0, Math.min(100, result.score - delta));
  if (projected <= 15) return "Podría aproximarse a A";
  if (projected <= 30) return "Podría aproximarse a B";
  if (projected <= 45) return "Podría aproximarse a C";
  if (projected <= 60) return "Podría aproximarse a D";
  if (projected <= 75) return "Podría aproximarse a E";
  if (projected <= 90) return "Podría aproximarse a F";
  return "Podría mantenerse en G si no se actúa sobre la envolvente";
}

function isExposedProperty(propertyData: PropertyDataV2) {
  return ["house", "terraced", "penthouse", "ground_floor"].includes(propertyData.propertyType);
}

export function generateScenarios(propertyData: PropertyDataV2, result: ScoreResultV2): ImprovementScenario[] {
  const scenarios: ImprovementScenario[] = [];
  const exposed = isExposedProperty(propertyData);
  const hasFossilHeating = propertyData.heating === "gas";
  const hasDirectElectric = propertyData.heating === "electric" || propertyData.waterHeating === "electric";
  const poorEnvelope = propertyData.windows === "single" || propertyData.facadeInsulation !== "good" || propertyData.roofInsulation !== "good";
  const canUseSolar = exposed || propertyData.roofType === "pitched";

  const quickMeasures: string[] = [];
  if (propertyData.windows === "single" || propertyData.windows === "unknown") {
    quickMeasures.push("Sustitución de ventanas por doble acristalamiento bajo emisivo y carpintería con rotura de puente térmico.");
  } else {
    quickMeasures.push("Ajuste de carpinterías, burletes y control de infiltraciones en huecos existentes.");
  }
  if (propertyData.ventilation === "natural" || propertyData.ventilation === "unknown") {
    quickMeasures.push("Revisión de infiltraciones y ventilación controlada, evitando pérdidas innecesarias.");
  }
  quickMeasures.push("Optimización de termostatos, horarios y equilibrado básico de sistemas térmicos.");

  scenarios.push({
    id: "basic",
    title: "Paquete básico de reducción de demanda",
    objective: "Mejorar confort y reducir pérdidas sin reforma profunda.",
    description: "Actuaciones de bajo impacto constructivo para atacar huecos, infiltraciones y control de sistemas.",
    estimatedCostRange: "Inversión baja-media",
    estimatedSavingsRange: "Ahorro cualitativo bajo-medio, condicionado al uso real",
    expectedLetterImpact: result.score <= 45 ? "Mejora limitada si la vivienda ya parte de una letra media" : "Puede ayudar a avanzar una letra si el problema principal está en huecos",
    estimatedScoreDelta: 8,
    estimatedLetterImprovement: estimateLetterImpact(result, 8),
    complexity: "low",
    investmentRange: "low",
    priority: "recommended",
    rationale: "Prioriza medidas reversibles y de baja complejidad antes de dimensionar equipos o acometer obras mayores.",
    measures: quickMeasures,
    dependencies: ["Comprobación de estado de carpinterías", "Presupuesto de instalador especializado"],
    warnings: ["No garantiza salto de letra oficial; la calificación depende de metodología reconocida y visita técnica."],
    disclaimers: ["Los ahorros son orientativos y dependen del uso, clima, ocupación y estado real de la vivienda."],
    providerCategories: ["ventanas", "aislamiento", "certificador"],
  });

  const envelopeMeasures = [
    "Mejora de aislamiento de fachada mediante SATE, insuflado o trasdosado según viabilidad técnica.",
    exposed ? "Aislamiento de cubierta por ser una superficie expuesta relevante." : "Revisión de cubierta o encuentros térmicos cuando formen parte de la vivienda.",
    "Sustitución o mejora de ventanas si no son de altas prestaciones.",
  ];

  scenarios.push({
    id: "envelope",
    title: "Mejora de envolvente",
    objective: "Reducir demanda energética antes de renovar equipos.",
    description: "Paquete centrado en aislamiento y huecos para bajar la energía necesaria para calefacción y refrigeración.",
    estimatedCostRange: "Inversión media-alta",
    estimatedSavingsRange: "Ahorro cualitativo medio-alto si la envolvente actual es deficiente",
    expectedLetterImpact: poorEnvelope ? "Puede mejorar 1-2 letras en viviendas con envolvente deficiente" : "Impacto menor si la envolvente ya es buena",
    estimatedScoreDelta: poorEnvelope ? 16 : 7,
    estimatedLetterImprovement: estimateLetterImpact(result, poorEnvelope ? 16 : 7),
    complexity: "medium",
    investmentRange: "medium",
    priority: poorEnvelope ? "recommended" : "optional",
    rationale: "Una menor demanda permite dimensionar mejor la climatización y mejora el confort pasivo.",
    measures: envelopeMeasures,
    dependencies: ["Visita técnica", "Comprobación de puentes térmicos", "Licencia o autorización si afecta a fachada"],
    warnings: ["Puede requerir permisos comunitarios o municipales.", "Debe verificarse humedad, cámara y compatibilidad constructiva."],
    disclaimers: ["No se presupone elegibilidad a ayudas ni resultado oficial de letra."],
    providerCategories: ["aislamiento", "ventanas", "reforma"],
  });

  const systemsMeasures = [];
  if (hasFossilHeating || hasDirectElectric) {
    systemsMeasures.push("Sustitución de caldera fósil o equipos eléctricos directos por bomba de calor/aerotermia eficiente.");
  } else {
    systemsMeasures.push("Optimización o renovación de equipos térmicos hacia sistemas de mayor rendimiento estacional.");
  }
  systemsMeasures.push("Revisión de ACS y posible aerotermo o bomba de calor para agua caliente sanitaria.");
  if (propertyData.cooling === "split") systemsMeasures.push("Evaluación de splits existentes y rendimiento estacional antes de sustituir.");

  scenarios.push({
    id: "systems",
    title: "Electrificación eficiente de sistemas",
    objective: "Reducir dependencia de combustibles fósiles y mejorar rendimiento térmico.",
    description: "Renovación de calefacción, refrigeración y ACS con equipos de alta eficiencia.",
    estimatedCostRange: "Inversión media",
    estimatedSavingsRange: "Ahorro cualitativo medio, mayor si sustituye gas o electricidad directa",
    expectedLetterImpact: hasFossilHeating || hasDirectElectric ? "Puede mejorar 1-2 letras si los equipos actuales penalizan" : "Impacto moderado si los equipos ya son eficientes",
    estimatedScoreDelta: hasFossilHeating || hasDirectElectric ? 18 : 8,
    estimatedLetterImprovement: estimateLetterImpact(result, hasFossilHeating || hasDirectElectric ? 18 : 8),
    complexity: "medium",
    investmentRange: "medium",
    priority: hasFossilHeating || hasDirectElectric ? "recommended" : "optional",
    rationale: "El scoring penaliza sistemas fósiles o eléctricos directos; la bomba de calor suele mejorar rendimiento y preparación regulatoria.",
    measures: systemsMeasures,
    dependencies: ["Estudio de cargas", "Espacio para unidad exterior", "Revisión eléctrica y acústica"],
    warnings: ["Conviene mejorar demanda antes de sobredimensionar equipos."],
    disclaimers: ["La viabilidad depende del inmueble, normativa local, instalación eléctrica y proyecto técnico."],
    providerCategories: ["climatización", "acs", "aerotermia"],
  });

  if (canUseSolar) {
    scenarios.push({
      id: "renewables",
      title: "Fotovoltaica y solar térmica",
      objective: "Añadir generación renovable si la cubierta y el uso lo permiten.",
      description: "Evaluación de autoconsumo fotovoltaico y apoyo solar térmico para ACS cuando encaje técnicamente.",
      estimatedCostRange: "Inversión media",
      estimatedSavingsRange: "Ahorro cualitativo variable según consumo, orientación, cubierta y compensación",
      expectedLetterImpact: propertyData.renewables === "none" ? "Puede mejorar la estimación, especialmente combinada con bomba de calor" : "Impacto incremental si ya existen renovables",
      estimatedScoreDelta: propertyData.renewables === "none" ? 12 : 5,
      estimatedLetterImprovement: estimateLetterImpact(result, propertyData.renewables === "none" ? 12 : 5),
      complexity: "medium",
      investmentRange: "medium",
      priority: propertyData.renewables === "none" ? "optional" : "long_term",
      rationale: "Las renovables reducen consumo neto y refuerzan escenarios de electrificación, pero no compensan por sí solas una envolvente deficiente.",
      measures: ["Estudio de cubierta, sombras y orientación.", "Instalación fotovoltaica para autoconsumo.", "Solar térmica para ACS si la demanda y cubierta lo justifican."],
      dependencies: ["Estudio solar", "Tramitación de autoconsumo", "Comprobación estructural y eléctrica"],
      warnings: ["No debe instalarse sin analizar consumos reales y legalización."],
      disclaimers: ["No se garantizan ayudas, compensación de excedentes ni retorno económico concreto."],
      providerCategories: ["fotovoltaica", "solar térmica"],
    });
  }

  scenarios.push({
    id: "deep",
    title: "Reforma profunda combinada",
    objective: "Actuar de forma coordinada sobre envolvente, sistemas y renovables.",
    description: "Ruta integral para viviendas con mala envolvente, sistemas penalizados y horizonte de venta, alquiler o reforma relevante.",
    estimatedCostRange: "Inversión alta",
    estimatedSavingsRange: "Ahorro cualitativo alto, sujeto a proyecto técnico y uso real",
    expectedLetterImpact: "Potencial de mejora mayor, habitualmente 2 o más letras si el punto de partida es bajo",
    estimatedScoreDelta: 30,
    estimatedLetterImprovement: estimateLetterImpact(result, 30),
    complexity: "high",
    investmentRange: "high",
    priority: result.score >= 60 ? "recommended" : "long_term",
    rationale: "Combina reducción de demanda, electrificación eficiente y renovables para evitar actuaciones aisladas incompatibles.",
    measures: [
      "Aislamiento de fachada y cubierta según proyecto.",
      "Sustitución de ventanas por solución de altas prestaciones.",
      "Bomba de calor/aerotermia para climatización y ACS.",
      "Ventilación mecánica con recuperación de calor si la estanqueidad mejora.",
      "Fotovoltaica y, si procede, apoyo solar térmico o almacenamiento.",
    ],
    dependencies: ["Proyecto técnico", "Licencia de obra", "Coordinación de gremios", "Presupuesto detallado"],
    warnings: ["Puede requerir planificación de obra, permisos y comprobaciones estructurales."],
    disclaimers: ["La letra oficial final solo puede determinarla un CEE emitido por técnico competente con metodología reconocida."],
    providerCategories: ["aislamiento", "ventanas", "climatización", "fotovoltaica", "certificador", "reforma"],
  });

  return scenarios.map((scenario) => {
    try {
      const propertyType = mapPropertyType(propertyData.propertyType);
      const template = measuresForSimulatorScenario({
        simulatorScenarioId: scenario.id,
        propertyType,
        currentLetter: result.estimatedLetter,
        targetLetter: propertyData.targetLetter,
        budgetRange: propertyData.budgetRange,
      });
      if (!template) return scenario;
      const costEstimate = calculateScenarioCostEstimate({
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        propertyData,
        propertyType,
        measureCodes: template.measureCodes,
        quality: template.budgetLevel === 'PREMIUM' ? 'PREMIUM' : template.budgetLevel === 'LOW' ? 'BASIC' : 'MEDIUM',
        complexity: scenario.complexity === 'high' ? 'HIGH' : scenario.complexity === 'low' ? 'LOW' : 'MEDIUM',
        region: propertyData.zipcode,
        interventionLevel: template.interventionLevel,
        letterGainTarget: template.letterGainMax,
      });
      return costEstimate ? { ...scenario, costEstimate } : scenario;
    } catch (error) {
      console.error('Cost estimate generation failed:', error);
      return scenario;
    }
  });
}
