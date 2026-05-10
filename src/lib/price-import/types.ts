export type RawImportedPriceItem = {
  sourceName: string;
  sourceVersion?: string;
  externalCode?: string;
  title: string;
  description?: string;
  unit: string;
  unitPrice?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  region?: string;
  capturedAt?: string;
};

export type NormalizedImportedPriceItem = RawImportedPriceItem & {
  minUnitPrice: number;
  midUnitPrice?: number;
  maxUnitPrice: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
};
