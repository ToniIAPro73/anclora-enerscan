import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function isAdmin(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin/metrics')) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (!process.env.VERCEL ? 'local-development-only-auth-secret' : undefined),
    });
    if (!isAdmin(typeof token?.email === 'string' ? token.email : undefined)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/metrics', '/admin/metrics/:path*'],
};
