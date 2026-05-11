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
  const url = `${BASE_URL}/Consulta_DNPRC?RC=${encodeURIComponent(rc)}&Provincia=&Municipio=`;
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
  
  const url = `${BASE_URL}/Consulta_DNPLOC?Provincia=${encodeURIComponent(province)}&Municipio=${encodeURIComponent(municipality)}&Sigla=${encodeURIComponent(sigla || '')}&Calle=${encodeURIComponent(street)}&Numero=${encodeURIComponent(number || '')}&Bloque=${encodeURIComponent(block || '')}&Escalera=${encodeURIComponent(staircase || '')}&Planta=${encodeURIComponent(floor || '')}&Puerta=${encodeURIComponent(door || '')}`;
  
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Catastro service error: ${response.status}`);
  }
  
  const xml = await response.text();
  return parseCadastralList(xml);
}
