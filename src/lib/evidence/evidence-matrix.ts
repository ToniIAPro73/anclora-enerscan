import type { AppLanguage } from '@/lib/preferences';

export type EvidenceSource =
  | 'user_declared'
  | 'catastro'
  | 'cee_document'
  | 'budget_document'
  | 'photo_attachment'
  | 'derived_rule'
  | 'not_available';

export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type EvidenceItem = {
  key: string;
  labelKey: string;
  value?: string | number | null;
  source: EvidenceSource;
  confidence: EvidenceConfidence;
  usedInScore: boolean;
  requiresReview?: boolean;
  noteKey?: string;
};

// ---- Labels ----

const sourceLabels: Record<AppLanguage, Record<EvidenceSource, string>> = {
  es: {
    user_declared: 'Declarado por usuario',
    catastro: 'Catastro oficial',
    cee_document: 'Certificado energético aportado',
    budget_document: 'Presupuesto aportado',
    photo_attachment: 'Foto aportada',
    derived_rule: 'Derivado por motor de reglas',
    not_available: 'No disponible',
  },
  en: {
    user_declared: 'User declared',
    catastro: 'Official Cadastre',
    cee_document: 'Submitted energy certificate',
    budget_document: 'Submitted budget',
    photo_attachment: 'Submitted photo',
    derived_rule: 'Derived by rule engine',
    not_available: 'Not available',
  },
  de: {
    user_declared: 'Vom Nutzer angegeben',
    catastro: 'Offizielles Kataster',
    cee_document: 'Eingereichter Energieausweis',
    budget_document: 'Eingereichtes Budget',
    photo_attachment: 'Eingereichtes Foto',
    derived_rule: 'Durch Regelwerk abgeleitet',
    not_available: 'Nicht verfügbar',
  },
};

const confidenceLabels: Record<AppLanguage, Record<EvidenceConfidence, string>> = {
  es: {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    unknown: 'Desconocida',
  },
  en: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    unknown: 'Unknown',
  },
  de: {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    unknown: 'Unbekannt',
  },
};

const fieldLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    cadastralReference: 'Referencia catastral',
    address: 'Dirección',
    postalCode: 'Código postal',
    yearBuilt: 'Año de construcción',
    usedAreaM2: 'Superficie aplicada (m²)',
    cadastralBuiltM2: 'Superficie construida catastral (m²)',
    propertyType: 'Tipología de vivienda',
    windows: 'Ventanas',
    facadeInsulation: 'Aislamiento de fachada',
    roofInsulation: 'Aislamiento de cubierta',
    heating: 'Calefacción',
    waterHeating: 'ACS',
    cooling: 'Refrigeración',
    renewables: 'Renovables',
    ceeSubmitted: 'CEE aportado',
    budgetSubmitted: 'Presupuesto aportado',
    photosSubmitted: 'Fotos aportadas',
  },
  en: {
    cadastralReference: 'Cadastral reference',
    address: 'Address',
    postalCode: 'Postal code',
    yearBuilt: 'Year built',
    usedAreaM2: 'Applied area (m²)',
    cadastralBuiltM2: 'Cadastral built area (m²)',
    propertyType: 'Property type',
    windows: 'Windows',
    facadeInsulation: 'Facade insulation',
    roofInsulation: 'Roof insulation',
    heating: 'Heating',
    waterHeating: 'Hot water (DHW)',
    cooling: 'Cooling',
    renewables: 'Renewables',
    ceeSubmitted: 'EPC submitted',
    budgetSubmitted: 'Budget submitted',
    photosSubmitted: 'Photos submitted',
  },
  de: {
    cadastralReference: 'Katasterreferenz',
    address: 'Adresse',
    postalCode: 'Postleitzahl',
    yearBuilt: 'Baujahr',
    usedAreaM2: 'Angewandte Fläche (m²)',
    cadastralBuiltM2: 'Katasterbaufläche (m²)',
    propertyType: 'Gebäudetyp',
    windows: 'Fenster',
    facadeInsulation: 'Fassadendämmung',
    roofInsulation: 'Dachdämmung',
    heating: 'Heizung',
    waterHeating: 'Warmwasser (TWW)',
    cooling: 'Kühlung',
    renewables: 'Erneuerbare',
    ceeSubmitted: 'Energieausweis eingereicht',
    budgetSubmitted: 'Budget eingereicht',
    photosSubmitted: 'Fotos eingereicht',
  },
};

const usedInScoreLabels: Record<AppLanguage, { yes: string; no: string }> = {
  es: { yes: 'Usado en el cálculo', no: 'No usado en el cálculo' },
  en: { yes: 'Used in calculation', no: 'Not used in calculation' },
  de: { yes: 'In Berechnung verwendet', no: 'Nicht in Berechnung verwendet' },
};

const requiresReviewLabels: Record<AppLanguage, string> = {
  es: 'Requiere revisión',
  en: 'Requires review',
  de: 'Überprüfung erforderlich',
};

export function getEvidenceSourceLabel(source: EvidenceSource, lang: AppLanguage = 'es'): string {
  return (sourceLabels[lang] ?? sourceLabels.es)[source] ?? source;
}

export function getEvidenceConfidenceLabel(confidence: EvidenceConfidence, lang: AppLanguage = 'es'): string {
  return (confidenceLabels[lang] ?? confidenceLabels.es)[confidence] ?? confidence;
}

export function getEvidenceFieldLabel(key: string, lang: AppLanguage = 'es'): string {
  return (fieldLabels[lang] ?? fieldLabels.es)[key] ?? key;
}

export function getUsedInScoreLabel(used: boolean, lang: AppLanguage = 'es'): string {
  return (usedInScoreLabels[lang] ?? usedInScoreLabels.es)[used ? 'yes' : 'no'];
}

export function getRequiresReviewLabel(lang: AppLanguage = 'es'): string {
  return requiresReviewLabels[lang] ?? requiresReviewLabels.es;
}

// ---- Matrix builder ----

export type EvidenceMatrixInput = {
  assessment: {
    year: number;
    area: number;
    zipcode: string;
    propertyType?: string | null;
    windows?: string | null;
    facadeInsulation?: string | null;
    roofInsulation?: string | null;
    heating?: string | null;
    waterHeating?: string | null;
    cooling?: string | null;
    renewables?: string | null;
  };
  cadastralRecord?: {
    cadastralReference?: string | null;
    address?: string | null;
    postalCode?: string | null;
    yearBuilt?: number | null;
    surfaceBuiltM2?: number | null;
    surfaceDwellingM2?: number | null;
  } | null;
  hasCeeDocument: boolean;
  hasBudgetDocument: boolean;
  photoCount: number;
};

export function buildEvidenceMatrix(input: EvidenceMatrixInput): EvidenceItem[] {
  const { assessment, cadastralRecord, hasCeeDocument, hasBudgetDocument, photoCount } = input;
  const hasCatastro = Boolean(cadastralRecord);

  const items: EvidenceItem[] = [];

  // Cadastral reference
  items.push({
    key: 'cadastralReference',
    labelKey: 'cadastralReference',
    value: cadastralRecord?.cadastralReference ?? null,
    source: hasCatastro && cadastralRecord?.cadastralReference ? 'catastro' : 'not_available',
    confidence: hasCatastro && cadastralRecord?.cadastralReference ? 'high' : 'unknown',
    usedInScore: false,
    requiresReview: false,
  });

  // Address
  items.push({
    key: 'address',
    labelKey: 'address',
    value: cadastralRecord?.address ?? assessment.zipcode,
    source: hasCatastro && cadastralRecord?.address ? 'catastro' : 'user_declared',
    confidence: hasCatastro && cadastralRecord?.address ? 'high' : 'medium',
    usedInScore: false,
    requiresReview: false,
  });

  // Postal code
  items.push({
    key: 'postalCode',
    labelKey: 'postalCode',
    value: cadastralRecord?.postalCode ?? assessment.zipcode,
    source: hasCatastro ? 'catastro' : 'user_declared',
    confidence: hasCatastro ? 'high' : 'medium',
    usedInScore: true,
  });

  // Year built
  const yearFromCatastro = hasCatastro && cadastralRecord?.yearBuilt;
  items.push({
    key: 'yearBuilt',
    labelKey: 'yearBuilt',
    value: yearFromCatastro ? cadastralRecord!.yearBuilt! : assessment.year,
    source: yearFromCatastro ? 'catastro' : 'user_declared',
    confidence: yearFromCatastro ? 'high' : 'medium',
    usedInScore: true,
    requiresReview: !yearFromCatastro && assessment.year < 1950,
  });

  // Used area (declared)
  items.push({
    key: 'usedAreaM2',
    labelKey: 'usedAreaM2',
    value: assessment.area,
    source: 'user_declared',
    confidence: 'medium',
    usedInScore: true,
    requiresReview: hasCatastro && Boolean(cadastralRecord?.surfaceBuiltM2) && Math.abs(assessment.area - (cadastralRecord!.surfaceBuiltM2 ?? assessment.area)) > 20,
  });

  // Cadastral built area
  if (hasCatastro && cadastralRecord?.surfaceBuiltM2) {
    items.push({
      key: 'cadastralBuiltM2',
      labelKey: 'cadastralBuiltM2',
      value: cadastralRecord.surfaceBuiltM2,
      source: 'catastro',
      confidence: 'high',
      usedInScore: false,
      requiresReview: Math.abs(assessment.area - cadastralRecord.surfaceBuiltM2) > 20,
    });
  }

  // Property type
  items.push({
    key: 'propertyType',
    labelKey: 'propertyType',
    value: assessment.propertyType ?? null,
    source: assessment.propertyType ? 'user_declared' : 'not_available',
    confidence: assessment.propertyType ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.propertyType,
  });

  // Windows
  items.push({
    key: 'windows',
    labelKey: 'windows',
    value: assessment.windows ?? null,
    source: assessment.windows ? 'user_declared' : 'not_available',
    confidence: assessment.windows ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.windows,
  });

  // Facade insulation
  items.push({
    key: 'facadeInsulation',
    labelKey: 'facadeInsulation',
    value: assessment.facadeInsulation ?? null,
    source: assessment.facadeInsulation ? 'user_declared' : 'not_available',
    confidence: assessment.facadeInsulation ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.facadeInsulation,
  });

  // Roof insulation
  items.push({
    key: 'roofInsulation',
    labelKey: 'roofInsulation',
    value: assessment.roofInsulation ?? null,
    source: assessment.roofInsulation ? 'user_declared' : 'not_available',
    confidence: assessment.roofInsulation ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.roofInsulation,
  });

  // Heating
  items.push({
    key: 'heating',
    labelKey: 'heating',
    value: assessment.heating ?? null,
    source: hasCeeDocument ? 'cee_document' : assessment.heating ? 'user_declared' : 'not_available',
    confidence: hasCeeDocument ? 'high' : assessment.heating ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.heating,
  });

  // Water heating
  items.push({
    key: 'waterHeating',
    labelKey: 'waterHeating',
    value: assessment.waterHeating ?? null,
    source: hasCeeDocument ? 'cee_document' : assessment.waterHeating ? 'user_declared' : 'not_available',
    confidence: hasCeeDocument ? 'high' : assessment.waterHeating ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: !assessment.waterHeating,
  });

  // Cooling
  items.push({
    key: 'cooling',
    labelKey: 'cooling',
    value: assessment.cooling ?? null,
    source: assessment.cooling ? 'user_declared' : 'not_available',
    confidence: assessment.cooling ? 'medium' : 'unknown',
    usedInScore: false,
    requiresReview: false,
  });

  // Renewables
  items.push({
    key: 'renewables',
    labelKey: 'renewables',
    value: assessment.renewables ?? null,
    source: assessment.renewables ? 'user_declared' : 'not_available',
    confidence: assessment.renewables ? 'medium' : 'unknown',
    usedInScore: true,
    requiresReview: false,
  });

  // CEE submitted
  items.push({
    key: 'ceeSubmitted',
    labelKey: 'ceeSubmitted',
    value: hasCeeDocument ? 'Sí' : null,
    source: hasCeeDocument ? 'cee_document' : 'not_available',
    confidence: hasCeeDocument ? 'high' : 'unknown',
    usedInScore: hasCeeDocument,
    requiresReview: false,
  });

  // Budget submitted
  items.push({
    key: 'budgetSubmitted',
    labelKey: 'budgetSubmitted',
    value: hasBudgetDocument ? 'Sí' : null,
    source: hasBudgetDocument ? 'budget_document' : 'not_available',
    confidence: hasBudgetDocument ? 'medium' : 'unknown',
    usedInScore: false,
    requiresReview: false,
  });

  // Photos submitted
  if (photoCount > 0) {
    items.push({
      key: 'photosSubmitted',
      labelKey: 'photosSubmitted',
      value: photoCount,
      source: 'photo_attachment',
      confidence: 'low',
      usedInScore: false,
      requiresReview: false,
    });
  }

  return items;
}

export function buildEvidenceSummary(items: EvidenceItem[]): {
  total: number;
  withData: number;
  catastroItems: number;
  ceeItems: number;
  requiresReviewCount: number;
  highConfidenceCount: number;
} {
  const withData = items.filter((i) => i.value != null && i.value !== '').length;
  const catastroItems = items.filter((i) => i.source === 'catastro').length;
  const ceeItems = items.filter((i) => i.source === 'cee_document').length;
  const requiresReviewCount = items.filter((i) => i.requiresReview).length;
  const highConfidenceCount = items.filter((i) => i.confidence === 'high').length;
  return {
    total: items.length,
    withData,
    catastroItems,
    ceeItems,
    requiresReviewCount,
    highConfidenceCount,
  };
}
