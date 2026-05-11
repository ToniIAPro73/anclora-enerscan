import { NextResponse } from 'next/server';
import { getProvinces } from '@/lib/catastro/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const provinces = await getProvinces();
    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 });
  }
}
