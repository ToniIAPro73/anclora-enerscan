import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const account = await prisma.providerAccount.findUnique({
    where: { userId: session.user.id },
    include: { provider: true },
  });
  if (!account) return NextResponse.json({ provider: null });
  return NextResponse.json({
    provider: {
      id: account.provider.id,
      name: account.provider.name,
      status: account.provider.status,
      credits: account.provider.leadCreditsBalance,
    },
  });
}
