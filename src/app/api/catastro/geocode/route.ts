import { NextRequest, NextResponse } from 'next/server';
import { resolveByAddress, resolveByCadastralReference, getStreets } from '@/lib/catastro/client';
import { getCoordinatesForLocation } from '@/lib/location/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const municipality = searchParams.get('municipality');
  const street = searchParams.get('street');
  const number = searchParams.get('number');
  const sigla = searchParams.get('sigla') || '';

  if (!province || !municipality) {
    return NextResponse.json({ error: 'Province and municipality are required' }, { status: 400 });
  }

  try {
    let lat: number | undefined;
    let lng: number | undefined;
    let accuracy = 'none';
    let rc: string | undefined;

    // 1. Try resolving with exact address (street + number)
    if (street) {
      let matches = await resolveByAddress({
        province,
        municipality,
        street,
        number: number || '',
        sigla,
      });

      // Fallback: if sigla was provided but no matches found, try without it
      if (matches.length === 0 && sigla) {
        matches = await resolveByAddress({
          province,
          municipality,
          street,
          number: number || '',
          sigla: '',
        });
      }

      // If no matches with number, try street only as fallback
      if (matches.length === 0 && number) {
        matches = await resolveByAddress({
          province,
          municipality,
          street,
          number: '',
          sigla: '',
        });
      }
      
      // Fuzzy Street Fallback: if still no matches, search for the street first
      if (matches.length === 0) {
        const suggestions = await getStreets({ province, municipality, query: street });
        if (suggestions.length > 0) {
          // Try exact address with the canonical street name from Catastro
          const canonicalStreet = suggestions[0];
          matches = await resolveByAddress({
            province,
            municipality,
            street: canonicalStreet.name,
            number: number || '',
            sigla: canonicalStreet.type,
          });
          
          if (matches.length === 0 && number) {
            // Try canonical street without number
            matches = await resolveByAddress({
              province,
              municipality,
              street: canonicalStreet.name,
              number: '',
              sigla: canonicalStreet.type,
            });
          }
        }
      }

      if (matches.length > 0) {
        // Try to find one with coords or enrich first one
        let bestMatch = matches.find(m => m.lat && m.lng);
        
        if (!bestMatch && matches[0].cadastralReference) {
          // Attempt to enrich the first result
          const enriched = await resolveByCadastralReference(matches[0].cadastralReference);
          if (enriched.length > 0 && enriched[0].lat && enriched[0].lng) {
            bestMatch = enriched[0];
          } else if (matches[0].cadastralReference.length >= 14) {
            // If full RC didn't have coordinates, try the parcel reference (14 chars)
            const parcelRC = matches[0].cadastralReference.slice(0, 14);
            const parcelEnriched = await resolveByCadastralReference(parcelRC);
            if (parcelEnriched.length > 0 && parcelEnriched[0].lat && parcelEnriched[0].lng) {
              bestMatch = parcelEnriched[0];
            }
          }
        }

        if (bestMatch?.lat && bestMatch?.lng) {
          lat = bestMatch.lat;
          lng = bestMatch.lng;
          rc = bestMatch.cadastralReference;
          accuracy = (number && matches.length === 1) ? 'exact' : 'street';
        }
      }
    }

    // 2. Fallback to hardcoded coordinates for Municipality/Province
    if (!lat || !lng) {
      const geo = getCoordinatesForLocation(province, municipality);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        accuracy = municipality ? 'municipality' : 'province';
      }
    }

    if (lat && lng) {
      return NextResponse.json({ lat, lng, accuracy, rc });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
