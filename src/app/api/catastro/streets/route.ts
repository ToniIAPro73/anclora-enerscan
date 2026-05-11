import { NextRequest, NextResponse } from 'next/server';
import { getStreets } from '@/lib/catastro/client';

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
    console.error('Error fetching streets:', error);
    return NextResponse.json({ error: 'Failed to fetch streets' }, { status: 500 });
  }
}
