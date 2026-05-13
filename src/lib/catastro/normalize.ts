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
 * Parses a numeric value from a string, handling Spanish comma decimal separators.
 */
function parseNumericValue(value: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
  if (!normalized) return undefined;
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : parsed;
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
  if (pc1 && pc2) {
    fullRC = `${pc1}${pc2}${car || ''}${cc1 || ''}${cc2 || ''}`;
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
  const structuredAddress = `${streetType ? streetType + ' ' : ''}${streetName}${number ? ', ' + number : ''}`.trim();
  const address = structuredAddress || extractTagValue(xmlFragment, 'ldt');

  // 4. Extract Internal Address
  const block = extractTagValue(xmlFragment, 'bq');
  const staircase = extractTagValue(xmlFragment, 'es');
  const floor = extractTagValue(xmlFragment, 'pt'); // 'pt' in <loint> is Floor (Planta)
  const door = extractTagValue(xmlFragment, 'pu');  // 'pu' in <loint> is Door (Puerta)

  // 5. Extract Physical Data
  const surfaceBuiltM2 = parseNumericValue(extractTagValue(xmlFragment, 'scons') || extractTagValue(xmlFragment, 'sfc'));
  const surfacePlotM2 = parseNumericValue(extractTagValue(xmlFragment, 'ssuelo') || extractTagValue(xmlFragment, 'ss') || extractTagValue(xmlFragment, 'stl'));
  const yearBuilt = parseInt(extractTagValue(xmlFragment, 'ant'), 10) || undefined;
  
  // Property use usually in <ldbi>
  const propertyUse = extractTagValue(xmlFragment, 'luso') || extractTagValue(xmlFragment, 'ldbi');
  
  // Participation coefficient in horizontal division
  const coefficient = parseNumericValue(extractTagValue(xmlFragment, 'cpt'));

  // 6. Extract detailed construction areas if available (<lcons>)
  let surfaceDwellingM2: number | undefined;
  let surfaceCommonM2: number | undefined;

  const consBlocks = xmlFragment.match(/<cons>[\s\S]*?<\/cons>/gi);
  if (consBlocks) {
    for (const consBlock of consBlocks) {
      const use = extractTagValue(consBlock, 'lcd').toUpperCase();
      const area = parseNumericValue(extractTagValue(consBlock, 'sqyt'));
      
      if (use === 'VIVIENDA') {
        surfaceDwellingM2 = (surfaceDwellingM2 || 0) + (area || 0);
      } else if (use === 'ELEMENTOS COMUNES') {
        surfaceCommonM2 = (surfaceCommonM2 || 0) + (area || 0);
      }
    }
  }

  // 7. Extract Postal Code
  let postalCode = extractTagValue(xmlFragment, 'dp') || extractTagValue(xmlFragment, 'cp');
  if (!postalCode || postalCode.length < 5) {
    const ldbi = extractTagValue(xmlFragment, 'ldbi');
    const cpMatch = ldbi.match(/\b\d{5}\b/);
    if (cpMatch) {
      postalCode = cpMatch[0];
    }
  }

  // 8. Extract Coordinates
  const lat = parseNumericValue(extractTagValue(xmlFragment, 'lat') || extractTagValue(xmlFragment, 'ycen'));
  const lng = parseNumericValue(extractTagValue(xmlFragment, 'lon') || extractTagValue(xmlFragment, 'xcen'));

  return {
    cadastralReference: fullRC,
    parcelReference: parcelRC,
    province,
    municipality,
    address,
    postalCode: postalCode || undefined,
    
    block: block || undefined,
    staircase: staircase || undefined,
    floor: floor || undefined,
    door: door || undefined,

    propertyUse: propertyUse || undefined,
    surfaceBuiltM2,
    surfaceDwellingM2,
    surfaceCommonM2,
    surfacePlotM2,
    participationCoefficient: coefficient,
    yearBuilt,
    
    lat,
    lng,
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

export function parseCoordinateList(xml: string): CadastralMatch[] {
  const coordBlocks = xml.match(/<coord[>\s][\s\S]*?<\/coord>/gi) || [];
  const distanceBlocks = xml.match(/<pcd>[\s\S]*?<\/pcd>/gi) || [];
  const blocks = coordBlocks.length > 0 ? coordBlocks : distanceBlocks;

  return blocks.map((block) => normalizeCadastralMatch(block)).filter((match) => match.cadastralReference);
}
