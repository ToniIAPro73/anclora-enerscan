import { NextRequest, NextResponse } from 'next/server';
import { resolveByAddress, resolveByCadastralReference } from '@/lib/catastro/client';
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

      if (matches.length > 0) {
        // Try to find one with coords or enrich first one
        let bestMatch = matches.find(m => m.lat && m.lng);
        if (!bestMatch && matches[0].cadastralReference) {
          const enriched = await resolveByCadastralReference(matches[0].cadastralReference);
          if (enriched.length > 0 && enriched[0].lat && enriched[0].lng) {
            bestMatch = enriched[0];
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
