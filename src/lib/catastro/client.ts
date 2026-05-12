import type { CadastralMatch, Province, Municipality } from './types';
import { extractTagsValues, parseCadastralList, extractTagValue } from './normalize';

const BASE_URL = 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx';

export async function getProvinces(): Promise<Province[]> {
  const response = await fetch(`${BASE_URL}/ConsultaProvincia`, {
    cache: 'no-store',
  });
  
  if (!response.ok) throw new Error('Failed to fetch provinces');
  
  const xml = await response.text();
  const names = extractTagsValues(xml, 'np');
  
  return names.map((name) => ({
    id: name, // Catastro often uses the name as ID in these queries
    name: name,
  }));
}

export async function getMunicipalities(province: string): Promise<Municipality[]> {
  const response = await fetch(`${BASE_URL}/ConsultaMunicipio?Provincia=${encodeURIComponent(province)}&Municipio=`, {
    cache: 'no-store',
  });
  
  if (!response.ok) throw new Error('Failed to fetch municipalities');
  
  const xml = await response.text();
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

export async function getStreets(params: {
  province: string;
  municipality: string;
  query: string;
}): Promise<CatastroStreetSuggestion[]> {
  const { province, municipality, query } = params;
  const url = `${BASE_URL}/ConsultaVia?Provincia=${encodeURIComponent(province)}&Municipio=${encodeURIComponent(municipality)}&TipoVia=&NombreVia=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch streets');
  
  const xml = await response.text();
  
  // Extract street data using a more specific regex since they are inside <calle>
  const streetBlocks = xml.match(/<calle>[\s\S]*?<\/calle>/gi) || [];
  
  return streetBlocks.map(block => ({
    id: extractTagValue(block, 'cv'),
    name: extractTagValue(block, 'nv'),
    type: extractTagValue(block, 'tv'),
    province,
    municipality
  }));
}

export async function resolveByCadastralReference(rc: string): Promise<CadastralMatch[]> {
  // Catastro Resolve RC
  // Use SRS=EPSG:4326 to get coordinates in WGS84 (Lat/Lon)
  const url = `${BASE_URL}/Consulta_DNPRC?RC=${encodeURIComponent(rc)}&Provincia=&Municipio=&SRS=EPSG:4326`;
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Catastro service error: ${response.status}`);
  }
  
  const xml = await response.text();
  
  // Check for errors in XML
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    // If it's not found or multiple, it might not be a "hard" error but business logic
    if (errCode === '1') return []; // Not found
  }

  return parseCadastralList(xml);
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
  
  // Use SRS=EPSG:4326 to get coordinates in WGS84 (Lat/Lon)
  const url = `${BASE_URL}/Consulta_DNPLOC?Provincia=${encodeURIComponent(province)}&Municipio=${encodeURIComponent(municipality)}&Sigla=${encodeURIComponent(sigla || '')}&Calle=${encodeURIComponent(street)}&Numero=${encodeURIComponent(number || '')}&Bloque=${encodeURIComponent(block || '')}&Escalera=${encodeURIComponent(staircase || '')}&Planta=${encodeURIComponent(floor || '')}&Puerta=${encodeURIComponent(door || '')}&SRS=EPSG:4326`;
  
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Catastro service error: ${response.status}`);
  }
  
  const xml = await response.text();
  
  // Check for errors in XML
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    if (errCode === '1') return []; // Not found
  }

  return parseCadastralList(xml);
}

export async function resolveByCoordinates(lat: number, lng: number): Promise<CadastralMatch[]> {
  // Catastro Resolve by Coordinates (Consulta_RCCOOR)
  // Note: Catastro expects coordinates in ETRS89 (standard for GPS/Leaflet)
  const url = `${BASE_URL}/Consulta_RCCOOR?CoorX=${lng}&CoorY=${lat}&SRS=EPSG:4326`;
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Catastro service error: ${response.status}`);
  }
  
  const xml = await response.text();
  
  // Check for errors
  const errCode = extractTagValue(xml, 'cod');
  if (errCode && parseInt(errCode) > 0) {
    return [];
  }

  return parseCadastralList(xml);
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
