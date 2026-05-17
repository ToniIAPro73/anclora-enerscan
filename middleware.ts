import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function isAdmin(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith('/admin/metrics') && !isAdmin(req.auth?.user?.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/metrics/:path*'],
};
