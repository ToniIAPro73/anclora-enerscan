import type { CadastralMatch } from './types';

/**
 * Basic XML parser for Catastro responses using Regex.
 * This avoids adding external dependencies like fast-xml-parser.
 */
export function extractTagValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

export function extractTagsValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
  const matches = Array.from(xml.matchAll(regex));
  const values: string[] = [];
  for (const match of matches) {
    values.push(match[1].trim());
  }
  return values;
}

export function normalizeCadastralMatch(xmlFragment: string): CadastralMatch {
  // This is a simplified version. The actual structure depends on the endpoint.
  const cadastralReference = extractTagValue(xmlFragment, 'pc1') + extractTagValue(xmlFragment, 'pc2');
  const province = extractTagValue(xmlFragment, 'pv');
  const municipality = extractTagValue(xmlFragment, 'nm');
  const street = extractTagValue(xmlFragment, 'nv');
  const number = extractTagValue(xmlFragment, 'pnum');
  
  // Format address
  const address = `${street}${number ? `, ${number}` : ''}`;
  
  return {
    cadastralReference: cadastralReference || extractTagValue(xmlFragment, 'rc'),
    province,
    municipality,
    address,
    postalCode: extractTagValue(xmlFragment, 'cp'),
    surfaceBuiltM2: parseFloat(extractTagValue(xmlFragment, 'scons')) || undefined,
    surfacePlotM2: parseFloat(extractTagValue(xmlFragment, 'ssuelo')) || undefined,
    yearBuilt: parseInt(extractTagValue(xmlFragment, 'ant'), 10) || undefined,
    lat: parseFloat(extractTagValue(xmlFragment, 'lat')) || undefined,
    lng: parseFloat(extractTagValue(xmlFragment, 'lon')) || undefined,
    source: 'catastro',
    confidence: 1,
  };
}

export function parseCadastralList(xml: string): CadastralMatch[] {
  // RC resolve usually returns one 'bico' or 'lpar'
  // Address resolve returns 'rcdnp' list
  const matches: CadastralMatch[] = [];
  
  // Try to find blocks of data
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
    }
  }
  
  return matches;
}
