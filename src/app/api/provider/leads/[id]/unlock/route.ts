import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProviderLeadError, serializeProviderLeadContact, unlockProviderLeadContact } from '@/lib/provider-leads';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const account = await prisma.providerAccount.findUnique({
    where: { userId: session.user.id },
    include: { provider: true },
  });
  if (!account) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });

  try {
    const result = await unlockProviderLeadContact(prisma, {
      leadId: params.id,
      providerId: account.providerId,
      creditsBalance: account.provider.leadCreditsBalance,
    });
    return NextResponse.json({
      ok: true,
      consumed: result.consumed,
      lead: serializeProviderLeadContact(result.lead),
    });
  } catch (error) {
    if (error instanceof ProviderLeadError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
