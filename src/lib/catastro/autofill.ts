import type { CadastralMatch } from './types';

export type WizardAutofillData = {
  year?: number;
  area?: number; // main calculation area (prefer dwelling)
  builtAreaM2?: number; // total built area
  participationPercent?: number;
  areaSource?: 'usable' | 'living' | 'built_fallback';
  areaRequiresReview: boolean;
  zipcode?: string;
  propertyType?: string;
  address?: string;
  cadastralReference?: string;
  parcelReference?: string;
  lat?: number;
  lng?: number;
  block?: string;
  staircase?: string;
  floor?: string;
  door?: string;
  municipality?: string;
  province?: string;
};

/**
 * Maps a CadastralMatch to wizard fields.
 */
export function mapCadastralMatchToWizardFields(match: CadastralMatch): WizardAutofillData {
  const areaData = getWizardAreaFromCadastralMatch(match);

  return {
    year: match.yearBuilt,
    area: areaData.areaM2,
    builtAreaM2: match.surfaceBuiltM2,
    participationPercent: match.participationCoefficient,
    areaSource: areaData.source,
    areaRequiresReview: areaData.requiresReview,
    zipcode: match.postalCode,
    address: match.address,
    cadastralReference: match.cadastralReference,
    parcelReference: match.parcelReference,
    lat: match.lat,
    lng: match.lng,
    block: match.block,
    staircase: match.staircase,
    floor: match.floor,
    door: match.door,
    municipality: match.municipality,
    province: match.province,
    // Property use mapping if reliable
    propertyType: mapPropertyUseToType(match.propertyUse),
  };
}

export function getWizardAreaFromCadastralMatch(match: CadastralMatch): {
  areaM2?: number;
  source?: 'usable' | 'living' | 'built_fallback';
  requiresReview: boolean;
} {
  // Priority 1: Dwelling area if specifically extracted from <lcons>
  if (match.surfaceDwellingM2) {
    return {
      areaM2: Math.round(match.surfaceDwellingM2),
      source: 'usable',
      requiresReview: false
    };
  }

  // Priority 2: Built area as fallback
  if (match.surfaceBuiltM2) {
    return {
      areaM2: Math.round(match.surfaceBuiltM2),
      source: 'built_fallback',
      requiresReview: true
    };
  }

  // Priority 3: Plot area as last resort
  if (match.surfacePlotM2) {
    return {
      areaM2: Math.round(match.surfacePlotM2),
      source: 'built_fallback',
      requiresReview: true
    };
  }

  return { requiresReview: false };
}

function mapPropertyUseToType(use?: string): string | undefined {
  if (!use) return undefined;
  const normalized = use.toLowerCase();
  if (normalized.includes('residencial') || normalized.includes('vivienda')) return 'flat'; // default to flat, user can change
  // Add more mappings if needed
  return undefined;
}
