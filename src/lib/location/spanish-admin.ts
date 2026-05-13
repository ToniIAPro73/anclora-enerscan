import type { Municipality, Province } from '@/lib/catastro/types';

type ProvinceFallback = Province & {
  ineCode: string;
};

type OpenMunicipality = {
  municipio_id: string;
  provincia_id: string;
  nombre: string;
};

const OPEN_MUNICIPALITIES_URL = 'https://raw.githubusercontent.com/codeforspain/ds-organizacion-administrativa/master/data/municipios.json';

export const FALLBACK_PROVINCES: ProvinceFallback[] = [
  { id: 'ALBACETE', name: 'ALBACETE', ineCode: '02' },
  { id: 'ALICANTE', name: 'ALICANTE', ineCode: '03' },
  { id: 'ALMERIA', name: 'ALMERIA', ineCode: '04' },
  { id: 'ARABA/ALAVA', name: 'ARABA/ALAVA', ineCode: '01' },
  { id: 'ASTURIAS', name: 'ASTURIAS', ineCode: '33' },
  { id: 'AVILA', name: 'AVILA', ineCode: '05' },
  { id: 'BADAJOZ', name: 'BADAJOZ', ineCode: '06' },
  { id: 'ILLES BALEARS', name: 'ILLES BALEARS', ineCode: '07' },
  { id: 'BARCELONA', name: 'BARCELONA', ineCode: '08' },
  { id: 'BIZKAIA', name: 'BIZKAIA', ineCode: '48' },
  { id: 'BURGOS', name: 'BURGOS', ineCode: '09' },
  { id: 'CACERES', name: 'CACERES', ineCode: '10' },
  { id: 'CADIZ', name: 'CADIZ', ineCode: '11' },
  { id: 'CANTABRIA', name: 'CANTABRIA', ineCode: '39' },
  { id: 'CASTELLON', name: 'CASTELLON', ineCode: '12' },
  { id: 'CIUDAD REAL', name: 'CIUDAD REAL', ineCode: '13' },
  { id: 'CORDOBA', name: 'CORDOBA', ineCode: '14' },
  { id: 'A CORUNA', name: 'A CORUNA', ineCode: '15' },
  { id: 'CUENCA', name: 'CUENCA', ineCode: '16' },
  { id: 'GIPUZKOA', name: 'GIPUZKOA', ineCode: '20' },
  { id: 'GIRONA', name: 'GIRONA', ineCode: '17' },
  { id: 'GRANADA', name: 'GRANADA', ineCode: '18' },
  { id: 'GUADALAJARA', name: 'GUADALAJARA', ineCode: '19' },
  { id: 'HUELVA', name: 'HUELVA', ineCode: '21' },
  { id: 'HUESCA', name: 'HUESCA', ineCode: '22' },
  { id: 'JAEN', name: 'JAEN', ineCode: '23' },
  { id: 'LEON', name: 'LEON', ineCode: '24' },
  { id: 'LLEIDA', name: 'LLEIDA', ineCode: '25' },
  { id: 'LUGO', name: 'LUGO', ineCode: '27' },
  { id: 'MADRID', name: 'MADRID', ineCode: '28' },
  { id: 'MALAGA', name: 'MALAGA', ineCode: '29' },
  { id: 'MURCIA', name: 'MURCIA', ineCode: '30' },
  { id: 'NAVARRA', name: 'NAVARRA', ineCode: '31' },
  { id: 'OURENSE', name: 'OURENSE', ineCode: '32' },
  { id: 'PALENCIA', name: 'PALENCIA', ineCode: '34' },
  { id: 'LAS PALMAS', name: 'LAS PALMAS', ineCode: '35' },
  { id: 'PONTEVEDRA', name: 'PONTEVEDRA', ineCode: '36' },
  { id: 'LA RIOJA', name: 'LA RIOJA', ineCode: '26' },
  { id: 'SALAMANCA', name: 'SALAMANCA', ineCode: '37' },
  { id: 'SANTA CRUZ DE TENERIFE', name: 'SANTA CRUZ DE TENERIFE', ineCode: '38' },
  { id: 'SEGOVIA', name: 'SEGOVIA', ineCode: '40' },
  { id: 'SEVILLA', name: 'SEVILLA', ineCode: '41' },
  { id: 'SORIA', name: 'SORIA', ineCode: '42' },
  { id: 'TARRAGONA', name: 'TARRAGONA', ineCode: '43' },
  { id: 'TERUEL', name: 'TERUEL', ineCode: '44' },
  { id: 'TOLEDO', name: 'TOLEDO', ineCode: '45' },
  { id: 'VALENCIA', name: 'VALENCIA', ineCode: '46' },
  { id: 'VALLADOLID', name: 'VALLADOLID', ineCode: '47' },
  { id: 'ZAMORA', name: 'ZAMORA', ineCode: '49' },
  { id: 'ZARAGOZA', name: 'ZARAGOZA', ineCode: '50' },
  { id: 'CEUTA', name: 'CEUTA', ineCode: '51' },
  { id: 'MELILLA', name: 'MELILLA', ineCode: '52' },
];

const CURATED_FALLBACK_MUNICIPALITIES: Record<string, Municipality[]> = {
  'ILLES BALEARS': [
    { id: 'PALMA', name: 'PALMA', provinceId: 'ILLES BALEARS' },
    { id: 'CALVIA', name: 'CALVIA', provinceId: 'ILLES BALEARS' },
    { id: 'MANACOR', name: 'MANACOR', provinceId: 'ILLES BALEARS' },
    { id: 'INCA', name: 'INCA', provinceId: 'ILLES BALEARS' },
    { id: 'MARRATXI', name: 'MARRATXI', provinceId: 'ILLES BALEARS' },
  ],
  MADRID: [
    { id: 'MADRID', name: 'MADRID', provinceId: 'MADRID' },
  ],
  BARCELONA: [
    { id: 'BARCELONA', name: 'BARCELONA', provinceId: 'BARCELONA' },
  ],
  VALENCIA: [
    { id: 'VALENCIA', name: 'VALENCIA', provinceId: 'VALENCIA' },
  ],
};

export function getFallbackProvinces(): Province[] {
  return FALLBACK_PROVINCES.map(({ id, name }) => ({ id, name }));
}

export async function getFallbackMunicipalities(province: string): Promise<Municipality[]> {
  const provinceFallback = findProvinceFallback(province);
  if (!provinceFallback) return CURATED_FALLBACK_MUNICIPALITIES[province] || [];

  try {
    const response = await fetch(OPEN_MUNICIPALITIES_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Fallback municipalities fetch failed: ${response.status}`);
    const municipalities = await response.json() as OpenMunicipality[];

    return municipalities
      .filter((municipality) => municipality.provincia_id === provinceFallback.ineCode)
      .map((municipality) => {
        const name = toCatastroName(municipality.nombre);
        return {
          id: name,
          name,
          provinceId: provinceFallback.id,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  } catch (error) {
    console.warn('Fallback municipalities unavailable:', error instanceof Error ? error.message : String(error));
    return CURATED_FALLBACK_MUNICIPALITIES[provinceFallback.id] || [];
  }
}

function findProvinceFallback(province: string) {
  const normalized = toCatastroName(province);
  return FALLBACK_PROVINCES.find((item) => item.id === normalized || item.name === normalized);
}

function toCatastroName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
