import type { PropertyDataV2 } from '../domain/energy-assessment';

export type CostConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type CostQuality = 'BASIC' | 'MEDIUM' | 'PREMIUM';
export type CostComplexity = 'LOW' | 'MEDIUM' | 'HIGH';
export type CostPropertyType = 'FLAT' | 'SINGLE_FAMILY' | 'VILLA' | 'LOCAL' | 'COMMUNITY' | 'UNKNOWN';
export type CostInterventionLevel = 'LIGHT' | 'MEDIUM' | 'INTEGRAL' | 'DEEP';

export type ResolvedQuantity = {
  formula: string;
  quantity: number;
  unit: string;
  confidence: CostConfidence;
  assumptions: string[];
};

export type CostEstimateLine = {
  measureCode: string;
  priceItemCode: string;
  title: string;
  unit: string;
  quantity: number;
  minUnitPrice: number;
  midUnitPrice?: number;
  maxUnitPrice: number;
  minSubtotal: number;
  midSubtotal?: number;
  maxSubtotal: number;
  sourceLabel?: string;
  confidence: CostConfidence;
  assumptions: string[];
};

export type ScenarioCostEstimate = {
  scenarioId: string;
  scenarioTitle: string;
  currency: 'EUR';
  minTotal: number;
  midTotal?: number;
  maxTotal: number;
  confidence: CostConfidence;
  lines: CostEstimateLine[];
  assumptions: string[];
  disclaimers: string[];
  sourceSummary: string;
  interventionLevel?: CostInterventionLevel;
  letterGainTarget?: number;
  heatPumpTechnicalNote?: string;
};

export type PriceSourceSeed = {
  name: string;
  providerType: string;
  sourceKind: string;
  versionLabel?: string;
  region?: string;
  url?: string;
  licenseNote?: string;
  reliability: CostConfidence;
  capturedAt?: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
};

export type PriceItemSeed = {
  guid: string;
  sourceName: string;
  code: string;
  externalCode?: string;
  title: string;
  description?: string;
  unit: string;
  minUnitPrice: number;
  midUnitPrice?: number;
  maxUnitPrice: number;
  currency?: 'EUR';
  region?: string;
  category: string;
  applicableTo: CostPropertyType[];
  tags: string[];
  confidence: CostConfidence;
};

export type EnergyMeasureSeed = {
  guid: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  impactArea: string;
  defaultPriority: string;
  complexity: CostComplexity;
  typicalLetterGainMin?: number;
  typicalLetterGainMax?: number;
};

export type MeasurePriceMapSeed = {
  measureCode: string;
  priceItemCode: string;
  quantityFormula: string;
  defaultFactor?: number;
  minFactor?: number;
  maxFactor?: number;
  notes?: string;
};

export type CostEngineInput = {
  scenarioId: string;
  scenarioTitle: string;
  propertyData: PropertyDataV2;
  propertyType?: CostPropertyType;
  measureCodes: string[];
  quality?: CostQuality;
  complexity?: CostComplexity;
  region?: string;
  interventionLevel?: CostInterventionLevel;
  letterGainTarget?: number;
};
