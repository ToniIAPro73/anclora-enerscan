import type { CatastroStreetSuggestion } from '@/lib/catastro/client';
import type { MapViewportTarget } from './geocoding';

type CuratedStreet = CatastroStreetSuggestion & {
  aliases: string[];
  center?: MapViewportTarget;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'AncloraEnergyScan/1.0';

const CURATED_STREETS: CuratedStreet[] = [
  {
    id: '1091',
    name: 'MIQUEL ROSSELLO I ALEMANY',
    type: 'CL',
    province: 'ILLES BALEARS',
    municipality: 'PALMA',
    provinceCode: '7',
    municipalityCode: '40',
    streetCode: '1091',
    aliases: [
      'MIQUEL ROSSELLO',
      'MIQUEL ROSSELLO ALEMANY',
      'CARRER D EN MIQUEL ROSSELLO I ALEMANY',
      'CARRER DEN MIQUEL ROSSELLO I ALEMANY',
      'CARRER D EN MIQUEL ROSSELLO ALEMANY',
    ],
    center: { lat: 39.5543655, lng: 2.6072105, zoom: 18 },
  },
];

export function getFallbackStreets(params: {
  province: string;
  municipality: string;
  query: string;
}): CatastroStreetSuggestion[] {
  const normalizedProvince = normalizeLookup(params.province);
  const normalizedMunicipality = normalizeLookup(params.municipality);
  const normalizedQuery = normalizeLookup(params.query);
  if (normalizedQuery.length < 3) return [];

  return CURATED_STREETS
    .filter((street) => normalizeLookup(street.province) === normalizedProvince)
    .filter((street) => normalizeLookup(street.municipality) === normalizedMunicipality)
    .filter((street) => {
      const searchable = [street.name, street.type, ...street.aliases].map(normalizeLookup);
      return searchable.some((value) => value.includes(normalizedQuery)) ||
        normalizedQuery.split(' ').filter(Boolean).every((part) => searchable.some((value) => value.includes(part)));
    })
    .map((street) => ({
      id: street.id,
      name: street.name,
      type: street.type,
      province: street.province,
      municipality: street.municipality,
      provinceCode: street.provinceCode,
      municipalityCode: street.municipalityCode,
      streetCode: street.streetCode,
    }));
}

export function getFallbackAddressTarget(params: {
  province: string;
  municipality: string;
  street: string;
  number?: string;
}): MapViewportTarget | null {
  const normalizedProvince = normalizeLookup(params.province);
  const normalizedMunicipality = normalizeLookup(params.municipality);
  const normalizedStreet = normalizeLookup(params.street);
  const normalizedNumber = normalizeLookup(params.number || '');

  const street = CURATED_STREETS.find((item) => {
    if (normalizeLookup(item.province) !== normalizedProvince) return false;
    if (normalizeLookup(item.municipality) !== normalizedMunicipality) return false;
    const searchable = [item.name, ...item.aliases].map(normalizeLookup);
    return searchable.some((value) => value.includes(normalizedStreet) || normalizedStreet.includes(value));
  });

  if (!street?.center) return null;

  if (street.name === 'MIQUEL ROSSELLO I ALEMANY' && normalizedNumber === '48') {
    return { lat: 39.5543655, lng: 2.6072105, zoom: 19 };
  }

  return street.center;
}

export async function geocodeWithOpenStreetMap(params: {
  province: string;
  municipality: string;
  street: string;
  number?: string;
}): Promise<MapViewportTarget | null> {
  const query = [
    params.number,
    params.street,
    params.municipality,
    params.province,
    'Spain',
  ].filter(Boolean).join(' ');
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      'Accept-Language': 'es',
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const data = await response.json() as Array<{ lat?: string; lon?: string; boundingbox?: string[] }>;
  const match = data[0];
  const lat = match?.lat ? Number(match.lat) : NaN;
  const lng = match?.lon ? Number(match.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, zoom: match.boundingbox ? 18 : 17 };
}

function normalizeLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
