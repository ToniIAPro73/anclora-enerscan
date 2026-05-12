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
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = normalizeCatastroString(searchParams.get('province'));
  const municipality = normalizeCatastroString(searchParams.get('municipality'));
  const rawStreet = normalizeCatastroString(searchParams.get('street'));
  const number = searchParams.get('number')?.trim() || '';
  const sigla = normalizeCatastroString(searchParams.get('sigla'));

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
    
    // Add I/Y variation for Catalan/Spanish names
    if (rawStreet.includes(' I ')) streetVariations.push(rawStreet.replace(/ I /g, ' Y '));
    if (rawStreet.includes(' Y ')) streetVariations.push(rawStreet.replace(/ Y /g, ' I '));
    
    // Try removing common "DE", "DEL", "LA" etc. if fails
    if (rawStreet.includes(' DE ')) streetVariations.push(rawStreet.replace(/ DE /g, ' '));

    // Remove first word if it's a type (sometimes included in the name field)
    const words = rawStreet.split(' ');
    if (words.length > 1 && ['CALLE', 'AVENIDA', 'PLAZA', 'VIA', 'PASEO', 'CARRER'].includes(words[0])) {
      streetVariations.push(words.slice(1).join(' '));
    }

    // Deduplicate variations
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
      });

      // 2b. Fallback: try without sigla
      if (matches.length === 0 && sigla) {
        matches = await resolveByAddress({
          province,
          municipality,
          street: streetVar,
          number,
          sigla: '',
        });
      }

      // 2c. Fallback: try with sigla in the street name
      if (matches.length === 0 && sigla) {
        matches = await resolveByAddress({
          province,
          municipality,
          street: `${sigla} ${streetVar}`,
          number,
          sigla: '',
        });
      }

      if (matches.length > 0) {
        finalMatches = matches;
        accuracy = 'exact';
        break;
      }
    }

    // 3. Street-level Fallback: if still no matches, search for the street first
    if (finalMatches.length === 0 && rawStreet) {
      // Try fuzzy street lookup to get canonical name
      const suggestions = await getStreets({ province, municipality, query: rawStreet });
      if (suggestions.length > 0) {
        const canonical = suggestions[0];
        let matches = await resolveByAddress({
          province,
          municipality,
          street: canonical.name,
          number,
          sigla: canonical.type,
        });

        if (matches.length === 0) {
          // Try canonical street without number
          matches = await resolveByAddress({
            province,
            municipality,
            street: canonical.name,
            number: '',
            sigla: canonical.type,
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
      // Try to find one with coords
      let bestMatch = finalMatches.find(m => m.lat && m.lng);
      
      if (!bestMatch) {
        // Enrichment: Attempt to get coordinates from the first result's RC
        const targetRC = finalMatches[0].cadastralReference;
        if (targetRC) {
          const enriched = await resolveByCadastralReference(targetRC);
          if (enriched.length > 0 && enriched[0].lat && enriched[0].lng) {
            bestMatch = enriched[0];
          } else if (targetRC.length >= 14) {
            // Try the parcel reference (14 chars) if full RC failed
            const parcelEnriched = await resolveByCadastralReference(targetRC.slice(0, 14));
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
          original: rawStreet,
          processed: uniqueVariations[0],
          found: finalMatches.length > 0,
          matchCount: finalMatches.length
        }
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
