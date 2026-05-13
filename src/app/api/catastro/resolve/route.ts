import { NextRequest, NextResponse } from 'next/server';
import { CatastroStreetServiceError, resolveByCadastralReference, resolveByAddress, resolveByCoordinates } from '@/lib/catastro/client';
import type { CatastroResolveResponse } from '@/lib/catastro/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, rc, province, municipality, street, number, sigla, block, staircase, floor, door, lat, lng } = body;

    let matches = [];

    if (mode === 'rc') {
      if (!rc) return NextResponse.json({ ok: false, error: { code: 'MISSING_RC', message: 'RC is required' } }, { status: 400 });
      matches = await resolveByCadastralReference(rc);
    } else if (mode === 'address') {
      if (!province || !municipality || !street || !number) {
        return NextResponse.json({ ok: false, error: { code: 'MISSING_FIELDS', message: 'Province, municipality, street and number are required' } }, { status: 400 });
      }
      matches = await resolveByAddress({ province, municipality, street, number, sigla, block, staircase, floor, door });
    } else if (mode === 'coords') {
      if (lat === undefined || lng === undefined) {
        return NextResponse.json({ ok: false, error: { code: 'MISSING_COORDS', message: 'Latitude and longitude are required' } }, { status: 400 });
      }
      matches = await resolveByCoordinates(lat, lng);
    } else {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_MODE', message: 'Invalid resolution mode' } }, { status: 400 });
    }

    const response: CatastroResolveResponse = {
      ok: true,
      data: {
        matches,
        source: {
          system: 'catastro',
          mode: mode as 'rc' | 'address' | 'coords',
          retrievedAt: new Date().toISOString(),
          confidence: matches.length === 1 ? 1 : 0.8,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof CatastroStreetServiceError ? error.status : 500;
    const isRateLimited = error instanceof CatastroStreetServiceError && error.status === 403;
    console.error('Error resolving catastro:', {
      status,
      response: error instanceof CatastroStreetServiceError ? error.responseText?.slice(0, 240) : undefined,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ 
      ok: false, 
      error: { 
        code: isRateLimited ? 'CATASTRO_RATE_LIMITED' : 'SERVER_ERROR', 
        message: isRateLimited
          ? 'El servicio de Catastro ha limitado temporalmente las consultas. Inténtalo más tarde.'
          : error instanceof Error ? error.message : 'Unknown server error' 
      } 
    }, { status: isRateLimited ? 503 : status });
  }
}
