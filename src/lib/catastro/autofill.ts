import type { CadastralMatch } from './types';

export type WizardAutofillData = {
  year?: number;
  area?: number;
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
};

/**
 * Maps a CadastralMatch to wizard fields.
 */
export function mapCadastralMatchToWizardFields(match: CadastralMatch): WizardAutofillData {
  const areaData = getWizardAreaFromCadastralMatch(match);

  return {
    year: match.yearBuilt,
    area: areaData.areaM2,
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
    // Property use mapping if reliable
    propertyType: mapPropertyUseToType(match.propertyUse),
  };
}

export function getWizardAreaFromCadastralMatch(match: CadastralMatch): {
  areaM2?: number;
  source?: 'usable' | 'living' | 'built_fallback';
  requiresReview: boolean;
} {
  // If we had usableAreaM2 or livingAreaM2 from API, we would use them here.
  // Currently normalize.ts only extracts scons (built) and ssuelo (plot).
  // In many cases Catastro scons for a flat IS the built area including common parts.
  
  if (match.surfaceBuiltM2) {
    return {
      areaM2: Math.round(match.surfaceBuiltM2),
      source: 'built_fallback',
      requiresReview: true
    };
  }

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
