import { NextRequest, NextResponse } from 'next/server';
import { resolveByAddress } from '@/lib/catastro/client';

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
      // Find the first one with coordinates
      const matchWithCoords = matches.find(m => m.lat && m.lng);
      if (matchWithCoords) {
        return NextResponse.json({
          lat: matchWithCoords.lat,
          lng: matchWithCoords.lng,
          accuracy: matches.length === 1 ? 'exact' : 'approximate'
        });
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
