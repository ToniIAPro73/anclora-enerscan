import type { CadastralMatch } from './types';

/**
 * Basic XML parser for Catastro responses using Regex.
 */
export function extractTagValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

export function extractTagsValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
  const matches = Array.from(xml.matchAll(regex));
  return matches.map(match => match[1].trim());
}

/**
 * Normalizes a cadastral record from XML fragments.
 * Handles both Consulta_DNPRC and Consulta_DNPLOC structures.
 */
export function normalizeCadastralMatch(xmlFragment: string): CadastralMatch {
  // 1. Extract Full Cadastral Reference (20 chars)
  // Try finding concatenated parts first (most common in list views)
  const pc1 = extractTagValue(xmlFragment, 'pc1');
  const pc2 = extractTagValue(xmlFragment, 'pc2');
  const car = extractTagValue(xmlFragment, 'car');
  const cc1 = extractTagValue(xmlFragment, 'cc1');
  const cc2 = extractTagValue(xmlFragment, 'cc2');
  
  let fullRC = '';
  if (pc1 && pc2 && car && cc1 && cc2) {
    fullRC = `${pc1}${pc2}${car}${cc1}${cc2}`;
  } else {
    // Fallback to single RC tag if parts not found
    fullRC = extractTagValue(xmlFragment, 'rc');
  }

  // 2. Extract Parcel Reference (first 14 chars)
  const parcelRC = pc1 && pc2 ? `${pc1}${pc2}` : fullRC.slice(0, 14);

  // 3. Extract Location Info
  const province = extractTagValue(xmlFragment, 'pv') || extractTagValue(xmlFragment, 'np');
  const municipality = extractTagValue(xmlFragment, 'nm');
  const streetType = extractTagValue(xmlFragment, 'tv');
  const streetName = extractTagValue(xmlFragment, 'nv');
  const number = extractTagValue(xmlFragment, 'pnum') || extractTagValue(xmlFragment, 'pnp');
  
  // Format address string
  const address = `${streetType ? streetType + ' ' : ''}${streetName}${number ? ', ' + number : ''}`;

  // 4. Extract Internal Address
  const block = extractTagValue(xmlFragment, 'bq');
  const staircase = extractTagValue(xmlFragment, 'es');
  const floor = extractTagValue(xmlFragment, 'pt'); // 'pt' in <loint> is Floor (Planta)
  const door = extractTagValue(xmlFragment, 'pu');  // 'pu' in <loint> is Door (Puerta)

  // 5. Extract Physical Data
  const surfaceBuiltM2 = parseFloat(extractTagValue(xmlFragment, 'scons')) || undefined;
  const surfacePlotM2 = parseFloat(extractTagValue(xmlFragment, 'ssuelo')) || undefined;
  const yearBuilt = parseInt(extractTagValue(xmlFragment, 'ant'), 10) || undefined;
  
  // Property use usually in <ldbi>
  const propertyUse = extractTagValue(xmlFragment, 'ldbi');
  
  // Participation coefficient in horizontal division
  const coefficient = parseFloat(extractTagValue(xmlFragment, 'cpt')) || undefined;

  return {
    cadastralReference: fullRC,
    parcelReference: parcelRC,
    province,
    municipality,
    address,
    postalCode: extractTagValue(xmlFragment, 'cp') || extractTagValue(xmlFragment, 'dp'),
    
    block: block || undefined,
    staircase: staircase || undefined,
    floor: floor || undefined,
    door: door || undefined,

    propertyUse: propertyUse || undefined,
    surfaceBuiltM2,
    surfacePlotM2,
    participationCoefficient: coefficient,
    yearBuilt,
    
    lat: parseFloat(extractTagValue(xmlFragment, 'lat') || extractTagValue(xmlFragment, 'ycen')) || undefined,
    lng: parseFloat(extractTagValue(xmlFragment, 'lon') || extractTagValue(xmlFragment, 'xcen')) || undefined,
    source: 'catastro',
    confidence: 1,
  };
}

export function parseCadastralList(xml: string): CadastralMatch[] {
  const matches: CadastralMatch[] = [];
  
  // Try to find blocks of data for multiple results (Consulta_DNPLOC)
  const rcBlocks = xml.match(/<rcdnp>[\s\S]*?<\/rcdnp>/gi);
  if (rcBlocks) {
    for (const block of rcBlocks) {
      matches.push(normalizeCadastralMatch(block));
    }
  } else {
    // Maybe it's a single result (Consulta_DNPRC)
    const singleBlock = xml.match(/<bico>[\s\S]*?<\/bico>/i);
    if (singleBlock) {
      matches.push(normalizeCadastralMatch(singleBlock[0]));
    } else {
      // Last resort: try any tag that looks like a record
      const lparBlock = xml.match(/<lpar>[\s\S]*?<\/lpar>/i);
      if (lparBlock) {
        matches.push(normalizeCadastralMatch(lparBlock[0]));
      }
    }
  }
  
  return matches;
}
