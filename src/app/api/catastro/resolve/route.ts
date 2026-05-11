import { NextRequest, NextResponse } from 'next/server';
import { resolveByCadastralReference, resolveByAddress } from '@/lib/catastro/client';
import type { CatastroResolveResponse } from '@/lib/catastro/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, rc, province, municipality, street, number } = body;

    let matches = [];

    if (mode === 'rc') {
      if (!rc) return NextResponse.json({ ok: false, error: { code: 'MISSING_RC', message: 'RC is required' } }, { status: 400 });
      matches = await resolveByCadastralReference(rc);
    } else if (mode === 'address') {
      if (!province || !municipality || !street) {
        return NextResponse.json({ ok: false, error: { code: 'MISSING_FIELDS', message: 'Province, municipality and street are required' } }, { status: 400 });
      }
      matches = await resolveByAddress({ province, municipality, street, number });
    } else {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_MODE', message: 'Invalid resolution mode' } }, { status: 400 });
    }

    const response: CatastroResolveResponse = {
      ok: true,
      data: {
        matches,
        source: {
          system: 'catastro',
          mode: mode as 'rc' | 'address',
          retrievedAt: new Date().toISOString(),
          confidence: matches.length === 1 ? 1 : 0.8,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resolving catastro:', error);
    return NextResponse.json({ 
      ok: false, 
      error: { 
        code: 'SERVER_ERROR', 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      } 
    }, { status: 500 });
  }
}
