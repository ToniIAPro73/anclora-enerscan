import { NextRequest, NextResponse } from 'next/server';
import { resolveByAddress, resolveByCadastralReference, getStreets } from '@/lib/catastro/client';
import { getCoordinatesForLocation } from '@/lib/location/geocoding';
import type { CadastralMatch } from '@/lib/catastro/types';

export const dynamic = 'force-dynamic';

/**
 * Normalizes a string for Catastro comparison: uppercase and removes accents.
 */
function normalizeCatastroString(str: string | null): string {
  if (!str) return '';
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, ' ') // Remove dots and commas
    .replace(/\s+/g, ' ') // Consolidate spaces
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = normalizeCatastroString(searchParams.get('province'));
  const municipality = normalizeCatastroString(searchParams.get('municipality'));
  const rawStreet = normalizeCatastroString(searchParams.get('street'));
  const number = searchParams.get('number')?.trim() || '';
  const sigla = normalizeCatastroString(searchParams.get('sigla'));
  const provinceCode = searchParams.get('provinceCode')?.trim() || undefined;
  const municipalityCode = searchParams.get('municipalityCode')?.trim() || undefined;
  const streetCode = searchParams.get('streetCode')?.trim() || undefined;

  if (!province || !municipality) {
    return NextResponse.json({ error: 'Province and municipality are required' }, { status: 400 });
  }

  try {
    let lat: number | undefined;
    let lng: number | undefined;
    let accuracy = 'none';
    let rc: string | undefined;

    // 1. Prepare variations of the street name
    const streetVariations = [rawStreet];
    
    // Variation: Replace I/Y
    if (rawStreet.includes(' I ')) streetVariations.push(rawStreet.replace(/ I /g, ' Y '));
    if (rawStreet.includes(' Y ')) streetVariations.push(rawStreet.replace(/ Y /g, ' I '));
    
    // Variation: Handle common Catalan/Spanish names
    if (rawStreet.startsWith('MIQUEL ')) streetVariations.push(rawStreet.replace('MIQUEL ', 'M '));
    if (rawStreet.startsWith('JUAN ')) streetVariations.push(rawStreet.replace('JUAN ', 'J '));
    if (rawStreet.startsWith('ANTONIO ')) streetVariations.push(rawStreet.replace('ANTONIO ', 'A '));
    if (rawStreet.startsWith('JOSE ')) streetVariations.push(rawStreet.replace('JOSE ', 'J '));

    // Variation: Remove common connectors
    if (rawStreet.includes(' DE ')) streetVariations.push(rawStreet.replace(/ DE /g, ' '));
    if (rawStreet.includes(' DEL ')) streetVariations.push(rawStreet.replace(/ DEL /g, ' '));

    const words = rawStreet.split(' ');
    if (words.length > 1) {
      // Variation: Surname first (common in Catastro)
      // e.g. "MIQUEL ROSSELLO" -> "ROSSELLO MIQUEL"
      streetVariations.push([...words.slice(1), words[0]].join(' '));
      
      // Variation: Significant part only (skip first name)
      // e.g. "MIQUEL ROSSELLO I ALEMANY" -> "ROSSELLO I ALEMANY"
      streetVariations.push(words.slice(1).join(' '));
      
      // Variation: If ends with a name, try moving it to front
      // Some records have "CALLE ROSSELLO, MIQUEL"
      if (words.length > 2) {
        streetVariations.push(words.slice(-2).join(' '));
      }
    }

    // Deduplicate and filter variations
    const uniqueVariations = Array.from(new Set(streetVariations)).filter(s => s.length > 2);

    // 2. Main Search Loop
    let finalMatches: CadastralMatch[] = [];

    for (const streetVar of uniqueVariations) {
      // 2a. Try exact address (street + number + sigla)
      let matches = await resolveByAddress({
        province,
        municipality,
        street: streetVar,
        number,
        sigla,
        provinceCode,
        municipalityCode,
        streetCode,
      });

      // 2b. Fallback: try without sigla
      if (matches.length === 0 && sigla) {
        matches = await resolveByAddress({
          province,
          municipality,
          street: streetVar,
          number,
          sigla: '',
          provinceCode,
          municipalityCode,
          streetCode,
        });
      }

      // 2c. Fallback: try without number (street level)
      if (matches.length === 0 && number) {
        matches = await resolveByAddress({
          province,
          municipality,
          street: streetVar,
          number: '',
          sigla: '',
          provinceCode,
          municipalityCode,
          streetCode,
        });
        if (matches.length > 0) accuracy = 'street';
      }

      if (matches.length > 0) {
        finalMatches = matches;
        if (accuracy === 'none') accuracy = 'exact';
        break;
      }
    }

    // 3. Fuzzy Street Fallback: if still no matches, try partial lookup
    if (finalMatches.length === 0 && rawStreet) {
      // Try fuzzy search with only the first few words to be more inclusive
      const fuzzyQuery = words.slice(0, 2).join(' ');
      const suggestions = await getStreets({ province, municipality, query: fuzzyQuery });
      
      // Try to find the best match in suggestions that contains our surnames
      const surnames = words.slice(1).filter(w => w.length > 2 && w !== 'I' && w !== 'Y');
      const bestSuggestion = suggestions.find(s => 
        surnames.every(surname => s.name.includes(surname))
      ) || suggestions[0];

      if (bestSuggestion) {
        let matches = await resolveByAddress({
          province,
          municipality,
          street: bestSuggestion.name,
          number,
          sigla: bestSuggestion.type,
          provinceCode: bestSuggestion.provinceCode,
          municipalityCode: bestSuggestion.municipalityCode,
          streetCode: bestSuggestion.streetCode,
        });

        if (matches.length === 0) {
          matches = await resolveByAddress({
            province,
            municipality,
            street: bestSuggestion.name,
            number: '',
            sigla: bestSuggestion.type,
            provinceCode: bestSuggestion.provinceCode,
            municipalityCode: bestSuggestion.municipalityCode,
            streetCode: bestSuggestion.streetCode,
          });
          accuracy = 'street';
        } else {
          accuracy = 'exact';
        }
        
        if (matches.length > 0) {
          finalMatches = matches;
        }
      }
    }

    // 4. Extract and Enrich Coordinates
    if (finalMatches.length > 0) {
      let bestMatch = finalMatches.find(m => m.lat && m.lng);
      
      if (!bestMatch) {
        const targetRC = finalMatches[0].cadastralReference;
        if (targetRC) {
          const enriched = await resolveByCadastralReference(targetRC);
          if (enriched.length > 0 && enriched[0].lat && enriched[0].lng) {
            bestMatch = enriched[0];
          } else if (targetRC.length >= 14) {
            const parcelRC = targetRC.slice(0, 14);
            const parcelEnriched = await resolveByCadastralReference(parcelRC);
            if (parcelEnriched.length > 0 && parcelEnriched[0].lat && parcelEnriched[0].lng) {
              bestMatch = parcelEnriched[0];
            }
          }
        }
      }

      if (bestMatch?.lat && bestMatch?.lng) {
        lat = bestMatch.lat;
        lng = bestMatch.lng;
        rc = bestMatch.cadastralReference;
      }
    }

    // 5. Hard Fallback to Municipality/Province
    if (!lat || !lng) {
      const geo = getCoordinatesForLocation(province, municipality);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        accuracy = municipality ? 'municipality' : 'province';
      }
    }

    if (lat && lng) {
      return NextResponse.json({ 
        lat, 
        lng, 
        accuracy, 
        rc,
        debug: {
          variations: uniqueVariations.slice(0, 5),
          finalAccuracy: accuracy,
          found: finalMatches.length > 0
        }
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
