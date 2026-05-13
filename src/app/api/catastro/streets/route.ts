import { NextRequest, NextResponse } from 'next/server';
import { CatastroStreetServiceError, getStreets } from '@/lib/catastro/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const municipality = searchParams.get('municipality');
  const query = searchParams.get('query');

  if (!province || !municipality || !query) {
    return NextResponse.json({ error: 'Province, municipality and query are required' }, { status: 400 });
  }

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const streets = await getStreets({ province, municipality, query });
    return NextResponse.json(streets);
  } catch (error) {
    const status = error instanceof CatastroStreetServiceError ? error.status : 500;
    const isRateLimited = error instanceof CatastroStreetServiceError && error.status === 403;
    console.error('Error fetching streets:', {
      status,
      province,
      municipality,
      query,
      response: error instanceof CatastroStreetServiceError ? error.responseText?.slice(0, 240) : undefined,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: isRateLimited
          ? 'El servicio de Catastro ha limitado temporalmente las consultas. Inténtalo más tarde.'
          : 'Failed to fetch streets',
      },
      { status: isRateLimited ? 503 : status }
    );
  }
}
