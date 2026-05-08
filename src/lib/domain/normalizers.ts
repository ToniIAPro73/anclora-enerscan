import {
  PropertyType,
  HeatingSystem,
  CoolingSystem,
  WaterHeatingSystem,
  WindowType,
  RenewableSystem,
  InsulationLevel,
  BudgetRange,
  AssessmentObjective,
  EnergyLetter
} from "./energy-assessment";

export function normalizePropertyType(value: unknown): PropertyType {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (["flat", "piso", "apartamento"].includes(v)) return "flat";
  if (["house", "casa", "unifamiliar", "chalet"].includes(v)) return "house";
  if (["terraced", "adosado"].includes(v)) return "terraced";
  if (["penthouse", "atico", "ático"].includes(v)) return "penthouse";
  if (["ground_floor", "bajo", "planta baja"].includes(v)) return "ground_floor";
  return "unknown";
}

export function normalizeHeatingSystem(value: unknown): HeatingSystem {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v.includes("electric") || v.includes("eléctric") || v === "radiadores eléctricos") return "electric";
  if (v.includes("gas") || v.includes("caldera") || v.includes("gasoil")) return "gas";
  if (v.includes("heat_pump") || v.includes("aerotermia") || v.includes("bomba de calor")) return "heat_pump";
  if (v.includes("biomass") || v.includes("biomasa") || v.includes("pellets")) return "biomass";
  if (v === "none" || v === "ninguno") return "none";
  return "unknown";
}

export function normalizeCoolingSystem(value: unknown): CoolingSystem {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v === "none" || v === "ninguno") return "none";
  if (v.includes("split") || v.includes("aire acondicionado")) return "split";
  if (v.includes("central") || v.includes("conductos")) return "central";
  if (v.includes("heat_pump") || v.includes("aerotermia")) return "heat_pump";
  return "unknown";
}

export function normalizeWaterHeatingSystem(value: unknown): WaterHeatingSystem {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v.includes("electric") || v.includes("termo eléctrico") || v.includes("termo electrico")) return "electric";
  if (v.includes("gas") || v.includes("calentador") || v.includes("caldera")) return "gas";
  if (v.includes("heat_pump") || v.includes("aerotermia")) return "heat_pump";
  if (v.includes("solar")) return "solar";
  return "unknown";
}

export function normalizeWindowType(value: unknown): WindowType {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v.includes("single") || v.includes("simple")) return "single";
  if (v.includes("double") || v.includes("doble")) return "double";
  if (v.includes("triple")) return "triple";
  return "unknown";
}

export function normalizeRenewableSystem(value: unknown): RenewableSystem {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v === "none" || v === "ninguno") return "none";
  if (v.includes("both") || v.includes("ambas")) return "both";
  if (v.includes("thermal") || v.includes("térmica") || v.includes("termica")) return "solar_thermal";
  if (v.includes("photovoltaic") || v.includes("fotovoltaica") || v.includes("fv") || v.includes("solar_panels") || v.includes("paneles solares")) return "photovoltaic";
  return "unknown";
}

export function normalizeInsulationLevel(value: unknown): InsulationLevel {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v === "none" || v === "ninguno") return "none";
  if (v.includes("partial") || v.includes("parcial")) return "partial";
  if (v.includes("good") || v.includes("bueno") || v.includes("alto")) return "good";
  return "unknown";
}

export function normalizeBudgetRange(value: unknown): BudgetRange {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v === "low" || v === "bajo") return "low";
  if (v === "medium" || v === "medio") return "medium";
  if (v === "high" || v === "alto") return "high";
  return "unknown";
}

export function normalizeAssessmentObjective(value: unknown): AssessmentObjective {
  if (typeof value !== "string") return "unknown";
  const v = value.toLowerCase().trim();
  if (v.includes("current")) return "current_state";
  if (v.includes("target")) return "target_letter";
  if (v.includes("sale") || v.includes("rent") || v.includes("vender") || v.includes("alquilar")) return "sale_rent";
  if (v.includes("comfort") || v.includes("confort")) return "comfort";
  if (v.includes("regulatory") || v.includes("normativa")) return "regulatory_readiness";
  return "unknown";
}

export function normalizeEnergyLetter(value: unknown): EnergyLetter | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toUpperCase().trim();
  if (["A", "B", "C", "D", "E", "F", "G"].includes(v)) {
    return v as EnergyLetter;
  }
  return undefined;
}
