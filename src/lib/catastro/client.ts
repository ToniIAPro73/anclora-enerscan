import type { CadastralMatch, Province, Municipality } from './types';
import { extractTagsValues, parseCadastralList, extractTagValue, parseCoordinateList } from './normalize';

const CALLEJERO_REST_URL = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest';
const COORDENADAS_REST_URL = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/rest';

function buildUrl(baseUrl: string, endpoint: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value === undefined ? '' : String(value));
  }
  return `${baseUrl}/${endpoint}?${searchParams.toString()}`;
}

async function fetchCatastroXml(url: string, errorMessage: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const responseText = typeof response.text === 'function'
      ? await response.text().catch(() => undefined)
      : undefined;
    throw new CatastroStreetServiceError(errorMessage, response.status, responseText);
  }
  return response.text();
}

export async function getProvinces(): Promise<Province[]> {
  const xml = await fetchCatastroXml(`${CALLEJERO_REST_URL}/ConsultaProvincia`, 'Failed to fetch provinces');
  const names = extractTagsValues(xml, 'np');
  
  return names.map((name) => ({
    id: name, // Catastro often uses the name as ID in these queries
    name: name,
  }));
}

export async function getMunicipalities(province: string): Promise<Municipality[]> {
  const xml = await fetchCatastroXml(buildUrl(CALLEJERO_REST_URL, 'ConsultaMunicipio', {
    Provincia: province,
    Municipio: '',
  }), 'Failed to fetch municipalities');
  const names = extractTagsValues(xml, 'nm');
  
  return names.map((name) => ({
    id: name,
    name: name,
    provinceId: province,
  }));
}

export type CatastroStreetSuggestion = {
  id: string;
  name: string;
  type: string;
  province: string;
  municipality: string;
};

export class CatastroStreetServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseText?: string,
  ) {
    super(message);
    this.name = 'CatastroStreetServiceError';
  }
}

const streetCache = new Map<string, CatastroStreetSuggestion[]>();

function normalizeStreetQuery(query: string) {
  return query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function buildStreetCacheKey(province: string, municipality: string, query: string) {
  return [province, municipality, normalizeStreetQuery(query)].join('|');
}

export async function getStreets(params: {
  province: string;
  municipality: string;
  query: string;
}): Promise<CatastroStreetSuggestion[]> {
  const { province, municipality, query } = params;
  const normalizedQuery = normalizeStreetQuery(query);
  const cacheKey = buildStreetCacheKey(province, municipality, normalizedQuery);
  const cached = streetCache.get(cacheKey);
  if (cached) return cached;

  const url = buildUrl(CALLEJERO_REST_URL, 'ConsultaVia', {
    Provincia: province,
    Municipio: municipality,
    TipoVia: '',
    NombreVia: normalizedQuery,
  });
  const xml = await fetchCatastroXml(url, 'Failed to fetch streets');
  
  // Extract street data using a more specific regex since they are inside <calle>
  const streetBlocks = xml.match(/<calle>[\s\S]*?<\/calle>/gi) || [];
  
  const streets = streetBlocks.map(block => ({
    id: extractTagValue(block, 'cv'),
    name: extractTagValue(block, 'nv'),
    type: extractTagValue(block, 'tv'),
    province,
    municipality
  }));

  streetCache.set(cacheKey, streets);
  return streets;
}

export async function resolveByCadastralReference(rc: string): Promise<CadastralMatch[]> {
  const url = buildUrl(CALLEJERO_REST_URL, 'Consulta_DNPRC', {
    RefCat: rc,
    Provincia: '',
    Municipio: '',
  });
  const xml = await fetchCatastroXml(url, 'Failed to resolve cadastral reference');
  
  // Check for errors in XML
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    // If it's not found or multiple, it might not be a "hard" error but business logic
    if (errCode === '1') return []; // Not found
  }

  const matches = parseCadastralList(xml);
  const coordinate = await getCoordinatesByCadastralReference(rc).catch(() => null);
  if (!coordinate) return matches;

  return matches.map((match) => ({
    ...match,
    lat: match.lat ?? coordinate.lat,
    lng: match.lng ?? coordinate.lng,
  }));
}

export async function resolveByAddress(params: {
  province: string;
  municipality: string;
  street: string;
  number?: string;
  sigla?: string;
  block?: string;
  staircase?: string;
  floor?: string;
  door?: string;
}): Promise<CadastralMatch[]> {
  const { province, municipality, street, number, sigla, block, staircase, floor, door } = params;
  const normalizedStreet = normalizeStreetQuery(street);
  const url = buildUrl(CALLEJERO_REST_URL, 'Consulta_DNPLOC', {
    Provincia: province,
    Municipio: municipality,
    TipoVia: sigla || 'CL',
    NomVia: normalizedStreet,
    Numero: number || '',
    Bloque: block || '',
    Escalera: staircase || '',
    Planta: floor || '',
    Puerta: door || '',
  });
  const xml = await fetchCatastroXml(url, 'Failed to resolve address');
  
  // Check for errors in XML
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    if (errCode === '1') return []; // Not found
  }

  const matches = parseCadastralList(xml);
  return Promise.all(matches.map(async (match) => {
    const coordinate = await getCoordinatesByCadastralReference(match.parcelReference || match.cadastralReference).catch(() => null);
    return {
      ...match,
      lat: match.lat ?? coordinate?.lat,
      lng: match.lng ?? coordinate?.lng,
    };
  }));
}

export async function resolveByCoordinates(lat: number, lng: number): Promise<CadastralMatch[]> {
  const url = buildUrl(COORDENADAS_REST_URL, 'Consulta_RCCOOR', {
    SRS: 'EPSG:4326',
    Coordenada_X: lng,
    Coordenada_Y: lat,
  });
  const xml = await fetchCatastroXml(url, 'Failed to resolve coordinates');
  
  // Check for errors
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    return [];
  }

  const coordinateMatches = parseCoordinateList(xml);
  if (coordinateMatches.length === 0) return [];

  const enriched = await Promise.all(coordinateMatches.map(async (match) => {
    const rc = match.parcelReference || match.cadastralReference;
    const details = rc ? await resolveByCadastralReference(rc).catch(() => []) : [];
    return details.length > 0 ? details.map((detail) => ({
      ...detail,
      lat: detail.lat ?? match.lat ?? lat,
      lng: detail.lng ?? match.lng ?? lng,
    })) : [{
      ...match,
      lat: match.lat ?? lat,
      lng: match.lng ?? lng,
    }];
  }));

  return enriched.flat();
}

async function getCoordinatesByCadastralReference(rc: string): Promise<{ lat: number; lng: number } | null> {
  const parcelRef = rc.slice(0, 14);
  if (parcelRef.length !== 14) return null;

  const url = buildUrl(COORDENADAS_REST_URL, 'Consulta_CPMRC', {
    Provincia: '',
    Municipio: '',
    SRS: 'EPSG:4326',
    RefCat: parcelRef,
  });
  const xml = await fetchCatastroXml(url, 'Failed to resolve cadastral coordinates');
  const matches = parseCoordinateList(xml);
  const match = matches.find((item) => item.lat && item.lng);
  return match?.lat && match.lng ? { lat: match.lat, lng: match.lng } : null;
}

/**
 * Gets the bounding box for a cadastral parcel.
 */
export async function getParcelBBox(rc: string): Promise<[[number, number], [number, number]] | null> {
  // We can use the CPPC (Consulta de Coordenadas y Perímetro de una Parcela Catastral)
  // But for now, we'll try to get it from the standard resolve if it has coordinates.
  // Real geometry would require WFS or another service.
  // For the MVP, we'll provide a small box around the point if we only have the point.
  const matches = await resolveByCadastralReference(rc);
  const match = matches[0];
  if (match?.lat && match?.lng) {
    const offset = 0.0005; // ~50m
    return [
      [match.lat - offset, match.lng - offset],
      [match.lat + offset, match.lng + offset]
    ];
  }
  return null;
}
