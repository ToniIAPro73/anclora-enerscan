import { NextResponse } from 'next/server';
import { getOAuthEnv } from '@/lib/auth-env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const oauth = getOAuthEnv();
  return NextResponse.json({
    google: { enabled: oauth.google.enabled },
    github: { enabled: oauth.github.enabled },
  });
}
