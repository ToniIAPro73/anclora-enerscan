import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth().catch(() => null);
  const email = session?.user?.email?.toLowerCase();
  if (!session?.user?.id || !email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const request = await prisma.professionalAccessRequest.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!request) return NextResponse.json({ status: 'NONE' });

  return NextResponse.json({
    status: request.status,
    request: {
      id: request.id,
      createdAt: request.createdAt,
      company: request.company,
      role: request.role,
    },
  });
}
