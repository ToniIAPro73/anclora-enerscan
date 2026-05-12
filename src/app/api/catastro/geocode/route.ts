import { NextRequest, NextResponse } from 'next/server';
import { resolveByAddress, resolveByCadastralReference } from '@/lib/catastro/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const municipality = searchParams.get('municipality');
  const street = searchParams.get('street');
  const number = searchParams.get('number');
  const sigla = searchParams.get('sigla') || '';

  if (!province || !municipality || !street) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
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

    if (matches.length > 0) {
      // First, try to find one that already has coordinates in the list
      let bestMatch = matches.find(m => m.lat && m.lng);
      
      // If no coordinates found in the list (very common), take the first RC and resolve it directly
      if (!bestMatch && matches[0].cadastralReference) {
        const enrichedMatches = await resolveByCadastralReference(matches[0].cadastralReference);
        if (enrichedMatches.length > 0 && enrichedMatches[0].lat && enrichedMatches[0].lng) {
          bestMatch = enrichedMatches[0];
        }
      }

      if (bestMatch && bestMatch.lat && bestMatch.lng) {
        return NextResponse.json({
          lat: bestMatch.lat,
          lng: bestMatch.lng,
          accuracy: matches.length === 1 ? 'exact' : 'approximate',
          rc: bestMatch.cadastralReference
        });
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
