export type EnergyLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type ConfidenceLevel = "Alta" | "Media" | "Baja";

export type PropertyType =
  | "flat"
  | "house"
  | "terraced"
  | "penthouse"
  | "ground_floor"
  | "unknown";

export type HeatingSystem =
  | "electric"
  | "gas"
  | "heat_pump"
  | "biomass"
  | "none"
  | "unknown";

export type CoolingSystem =
  | "none"
  | "split"
  | "central"
  | "heat_pump"
  | "unknown";

export type WaterHeatingSystem =
  | "electric"
  | "gas"
  | "heat_pump"
  | "solar"
  | "unknown";

export type WindowType =
  | "single"
  | "double"
  | "triple"
  | "unknown";

export type RenewableSystem =
  | "none"
  | "solar_thermal"
  | "photovoltaic"
  | "both"
  | "unknown";

export type InsulationLevel =
  | "none"
  | "partial"
  | "good"
  | "unknown";

export type PropertyOrientation =
  | "north"
  | "south"
  | "east"
  | "west"
  | "mixed"
  | "unknown";

export type RoofType =
  | "flat"
  | "pitched"
  | "shared"
  | "unknown";

export type VentilationType =
  | "natural"
  | "mechanical"
  | "heat_recovery"
  | "unknown";

export type TimelineHorizon =
  | "immediate"
  | "six_months"
  | "one_year"
  | "three_years"
  | "unknown";

export type BudgetRange =
  | "low"
  | "medium"
  | "high"
  | "unknown";

export type AssessmentObjective =
  | "current_state"
  | "target_letter"
  | "sale_rent"
  | "comfort"
  | "regulatory_readiness"
  | "unknown";

export interface PropertyDataV2 {
  year: number;
  area: number;
  zipcode: string;
  propertyType: PropertyType;
  orientation?: PropertyOrientation;
  roofType?: RoofType;
  heating: HeatingSystem;
  cooling: CoolingSystem;
  waterHeating: WaterHeatingSystem;
  ventilation?: VentilationType;
  windows: WindowType;
  renewables: RenewableSystem;
  facadeInsulation?: InsulationLevel;
  roofInsulation?: InsulationLevel;
  budgetRange?: BudgetRange;
  timelineHorizon?: TimelineHorizon;
  targetLetter?: EnergyLetter;
  objective?: AssessmentObjective;
}

export interface AssessmentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  path?: string;
  createdAt?: string;
  previewDataUri?: string;
  previewText?: string;
  annexNote?: string;
}

export interface ScoreResultV2 {
  score: number;
  estimatedLetter: EnergyLetter;
  confidence: ConfidenceLevel;
  climateZone: string;
  penalties: string[];
  strengths: string[];
  missingData: string[];
  explanation: string;
}

export interface ImprovementScenario {
  id: "basic" | "intermediate" | "deep";
  title: string;
  objective: string;
  estimatedCostRange: string;
  estimatedSavingsRange: string;
  expectedLetterImpact: string;
  measures: string[];
  dependencies: string[];
  warnings: string[];
  providerCategories: string[];
}

export interface RegulatoryTimelineItem {
  year: "Hoy" | "2030" | "2033" | "2050";
  status: "vigente" | "objetivo_ue" | "en_desarrollo" | "orientativo";
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
}

export interface PremiumReportData {
  id: string;
  date: string;
  propertyData: PropertyDataV2;
  scoreResult: ScoreResultV2;
  scenarios: ImprovementScenario[];
  regulatoryContext: RegulatoryTimelineItem[];
  providerCategories: string[];
  attachments?: AssessmentAttachment[];
  logoDataUri?: string;
  language?: "es" | "en" | "de";
  isDemo?: boolean;
}
