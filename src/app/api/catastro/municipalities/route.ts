import { NextRequest, NextResponse } from 'next/server';
import { getMunicipalities } from '@/lib/catastro/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');

  if (!province) {
    return NextResponse.json({ error: 'Province is required' }, { status: 400 });
  }

  try {
    const municipalities = await getMunicipalities(province);
    return NextResponse.json(municipalities);
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    return NextResponse.json({ error: 'Failed to fetch municipalities' }, { status: 500 });
  }
}
