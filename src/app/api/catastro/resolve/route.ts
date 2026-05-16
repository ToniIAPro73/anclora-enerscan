import { NextRequest, NextResponse } from 'next/server';
import { CatastroStreetServiceError, resolveByCadastralReference, resolveByAddress, resolveByCoordinates } from '@/lib/catastro/client';
import { CatastroResolveRequestSchema, type CatastroResolveResponse } from '@/lib/catastro/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CatastroResolveRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Datos de consulta catastral no válidos',
        },
      }, { status: 400 });
    }

    const input = parsed.data;

    let matches = [];

    if (input.mode === 'rc') {
      matches = await resolveByCadastralReference(input.rc);
    } else if (input.mode === 'address') {
      matches = await resolveByAddress(input);
    } else {
      matches = await resolveByCoordinates(input.lat, input.lng);
    }

    const response: CatastroResolveResponse = {
      ok: true,
      data: {
        matches,
        source: {
          system: 'catastro',
          mode: input.mode,
          retrievedAt: new Date().toISOString(),
          confidence: matches.length === 1 ? 1 : 0.8,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof CatastroStreetServiceError ? error.status : 500;
    const isRateLimited = error instanceof CatastroStreetServiceError && (error.status === 403 || error.status === 429);
    const isExternalFailure = error instanceof CatastroStreetServiceError;
    console.error('Error resolving catastro:', {
      status,
      response: error instanceof CatastroStreetServiceError ? error.responseText?.slice(0, 240) : undefined,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ 
      ok: false, 
      error: { 
        code: isRateLimited ? 'CATASTRO_RATE_LIMITED' : isExternalFailure ? 'CATASTRO_SERVICE_ERROR' : 'SERVER_ERROR', 
        message: isRateLimited
          ? 'El servicio de Catastro ha limitado temporalmente las consultas. Inténtalo más tarde.'
          : isExternalFailure
            ? 'El servicio de Catastro no está disponible temporalmente.'
            : 'No se pudo resolver la consulta catastral.'
      } 
    }, { status: isRateLimited || status >= 500 ? 503 : status });
  }
}
