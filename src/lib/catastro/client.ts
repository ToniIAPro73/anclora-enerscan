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
}): Promise<CadastralMatch[]> {
  const { province, municipality, street, number } = params;
  
  const url = `${BASE_URL}/Consulta_DNPLOC?Provincia=${encodeURIComponent(province)}&Municipio=${encodeURIComponent(municipality)}&Sigla=&Calle=${encodeURIComponent(street)}&Numero=${encodeURIComponent(number || '')}&Bloque=&Escalera=&Planta=&Puerta=`;
  
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Catastro service error: ${response.status}`);
  }
  
  const xml = await response.text();
  return parseCadastralList(xml);
}
