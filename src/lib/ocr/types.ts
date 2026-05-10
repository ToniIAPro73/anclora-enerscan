export type OcrStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

export type OcrSourceKind = 'cee_pdf' | 'budget_pdf' | 'image' | 'unknown';

export type OcrResult = {
  sourceKind: OcrSourceKind;
  status: OcrStatus;
  text?: string;
  pages?: Array<{ pageNumber: number; text: string }>;
  confidence?: number;
  extracted?: CeeData | BudgetData | ImageOcrData;
  warnings?: string[];
  error?: string;
  processedAt: string;
};

export type CeeData = {
  certificateReference?: string;
  address?: string;
  municipality?: string;
  province?: string;
  cadastralReference?: string;
  buildingUse?: string;
  year?: number;
  areaM2?: number;
  energyLetter?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  emissionsLetter?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  primaryEnergyKwhM2Year?: number;
  emissionsKgCo2M2Year?: number;
  finalEnergyKwhM2Year?: number;
  heatingDemandKwhM2Year?: number;
  coolingDemandKwhM2Year?: number;
  issueDate?: string;
  expiryDate?: string;
  technicianName?: string;
  rawMatches?: Record<string, string>;
};

export type BudgetData = {
  providerName?: string;
  issueDate?: string;
  totalAmount?: number;
  currency?: 'EUR';
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    amount?: number;
  }>;
  detectedMeasures?: string[];
};

export type ImageOcrData = {
  detectedText?: string;
  detectedSignals?: string[];
  probableCategory?: 'heating' | 'cooling' | 'water_heating' | 'windows' | 'envelope' | 'renewables' | 'unknown';
};
