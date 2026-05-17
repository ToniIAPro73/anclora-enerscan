import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const account = await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } });
  return NextResponse.json({ credits: account?.provider.leadCreditsBalance || 0 });
}
