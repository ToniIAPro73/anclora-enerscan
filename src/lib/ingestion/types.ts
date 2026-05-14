export type DataSourceType = 'USER' | 'CATASTRO' | 'CEE' | 'BUDGET' | 'OCR' | 'ENGINE' | 'MANUAL_OVERRIDE';

export type ExtractionStatus = 'PENDING' | 'PARSED' | 'NEEDS_REVIEW' | 'FAILED';

export type EnergyLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type ExtractedField<T = unknown> = {
  fieldName: string;
  value: T;
  sourceType: DataSourceType;
  sourceLabel?: string;
  confidence?: number;
  requiresReview?: boolean;
  appliedToWizard?: boolean;
};

export type EnergyCertificateCEE = {
  sourceProgram?: 'CE3X' | 'HULC' | 'CERMA' | 'UNKNOWN';
  sourceFormat: 'PDF_TEXT' | 'PDF_OCR' | 'XML';
  extractionStatus: ExtractionStatus;
  extractionConfidence?: number;
  issueDate?: string;
  validUntil?: string;
  addressLine?: string;
  cadastralReference?: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  useType?: string;
  climateZone?: string;
  yearBuilt?: number;
  usefulAreaM2?: number;
  builtAreaM2?: number;
  globalLetter?: EnergyLetter;
  nonRenewableEPKwhM2Year?: number;
  emissionsKgCO2M2Year?: number;
  heatingDemandKwhM2Year?: number;
  coolingDemandKwhM2Year?: number;
  acsDemandKwhM2Year?: number;
  recommendations?: Array<{ title?: string; rawText: string; category?: string }>;
  rawTextHash?: string;
  rawXmlStored?: boolean;
  extractedFields?: ExtractedField[];
};

export type BudgetMeasureCategory =
  | 'ENVELOPE_FACADE'
  | 'ENVELOPE_ROOF'
  | 'WINDOWS'
  | 'HEATING_SYSTEM'
  | 'COOLING_SYSTEM'
  | 'DHW_SYSTEM'
  | 'VENTILATION'
  | 'PV'
  | 'SOLAR_THERMAL'
  | 'LIGHTING'
  | 'OTHER_NON_ENERGY'
  | 'UNKNOWN';

export type BudgetLineItem = {
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  total?: number;
  confidence?: number;
};

export type BudgetMeasure = {
  category: BudgetMeasureCategory;
  description: string;
  cost?: number;
  inferredImpact?: {
    deltaKwhM2Year?: number;
    deltaLetter?: number;
    confidence: ConfidenceBand;
  };
};

export type BudgetImpactResult = {
  estimatedCurrentLetter?: EnergyLetter;
  estimatedPostBudgetLetter?: EnergyLetter;
  targetReached?: boolean;
  impactConfidence: ConfidenceBand;
  missingMeasures: BudgetMeasureCategory[];
  summary: string;
  assumptions: string[];
  warnings: string[];
};

export type RehabBudgetAnalysis = BudgetImpactResult & {
  extractionStatus: ExtractionStatus;
  extractionConfidence?: number;
  providerName?: string;
  budgetDate?: string;
  totalAmount?: number;
  currency: 'EUR' | 'GBP';
  vatIncluded?: boolean;
  lineItems: BudgetLineItem[];
  detectedMeasures: BudgetMeasure[];
  targetLetter?: EnergyLetter;
  analysisSummary: string;
};
