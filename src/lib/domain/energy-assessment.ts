import type { ScenarioCostEstimate } from '../costs/types';
import type { AppCurrency, AppLanguage, MeasurementSystem } from '../preferences';
import type { CadastralMatch } from '../catastro/types';

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
  // Location
  latitude?: number;
  longitude?: number;
  locationSource?: "catastro" | "manual" | "none";
}

export interface AssessmentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  path?: string;
  createdAt?: string;
  previewDataUri?: string;
  ceePagePreviews?: string[];
  previewText?: string;
  annexNote?: string;
  category?: "EXTERIOR" | "INTERIOR" | "CEE";
  caption?: string;
  ceeLetter?: EnergyLetter;
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
  ruleBreakdown?: ScoreRuleBreakdownItem[];
}

export interface ImprovementScenario {
  id: string;
  title: string;
  objective: string;
  description?: string;
  estimatedCostRange: string;
  estimatedSavingsRange: string;
  expectedLetterImpact: string;
  estimatedScoreDelta?: number;
  estimatedLetterImprovement?: string;
  complexity?: "low" | "medium" | "high";
  investmentRange?: "low" | "medium" | "high";
  priority?: "recommended" | "optional" | "long_term";
  rationale?: string;
  measures: string[];
  dependencies: string[];
  warnings: string[];
  disclaimers?: string[];
  providerCategories: string[];
  costEstimate?: ScenarioCostEstimate;
}

export type ScoreRuleCategory = "envelope" | "systems" | "renewables" | "climate" | "typology" | "data_quality";

export interface ScoreRuleBreakdownItem {
  id: string;
  category: ScoreRuleCategory;
  label: string;
  delta: number;
  reason: string;
  type: "penalty" | "bonus" | "neutral";
}

export type RegulatoryJurisdiction = "EU" | "ES" | "AUTONOMIC" | "LOCAL";
export type RegulatoryStatus = "vigente" | "objetivo_ue" | "en_desarrollo" | "orientativo" | "current" | "upcoming" | "future" | "informative";

export interface RegulatoryTimelineItem {
  id: string;
  year: string;
  dateLabel: string;
  status: RegulatoryStatus;
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  jurisdiction: RegulatoryJurisdiction;
  legalReference: string;
  url?: string;
  impactOnUser: string;
  disclaimer?: string;
}

export interface SubsidyInfoItem {
  id: string;
  title: string;
  scope: "state" | "regional" | "local" | "eu";
  appliesTo: string[];
  description: string;
  eligibilityDisclaimer: string;
  referenceUrl?: string;
}

export interface PremiumReportData {
  id: string;
  publicRef?: string;
  date: string;
  propertyData: PropertyDataV2;
  scoreResult: ScoreResultV2;
  scenarios: ImprovementScenario[];
  regulatoryContext: RegulatoryTimelineItem[];
  subsidies?: SubsidyInfoItem[];
  providerCategories: string[];
  attachments?: AssessmentAttachment[];
  cadastralRecord?: CadastralMatch;
  logoDataUri?: string;
  language?: AppLanguage;
  currency?: AppCurrency;
  measurementSystem?: MeasurementSystem;
  isDemo?: boolean;
}
