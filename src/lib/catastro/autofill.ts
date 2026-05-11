import type { CadastralMatch } from './types';

export type WizardAutofillData = {
  year?: number;
  area?: number;
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
 * Rule for area: Uses builtAreaM2 if available, as it's the most common reliable data.
 */
export function mapCadastralMatchToWizardFields(match: CadastralMatch): WizardAutofillData {
  return {
    year: match.yearBuilt,
    // We round the area as wizard fields usually expect integers for m2/sqft
    area: match.surfaceBuiltM2 ? Math.round(match.surfaceBuiltM2) : (match.surfacePlotM2 ? Math.round(match.surfacePlotM2) : undefined),
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

function mapPropertyUseToType(use?: string): string | undefined {
  if (!use) return undefined;
  const normalized = use.toLowerCase();
  if (normalized.includes('residencial') || normalized.includes('vivienda')) return 'flat'; // default to flat, user can change
  // Add more mappings if needed
  return undefined;
}
