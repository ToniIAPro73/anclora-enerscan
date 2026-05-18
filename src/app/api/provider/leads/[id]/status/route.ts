import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProviderLeadError, serializeProviderLeadContact, updateProviderLeadStatus } from '@/lib/provider-leads';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.string(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const account = await prisma.providerAccount.findUnique({ where: { userId: session.user.id } });
  if (!account) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  try {
    const lead = await updateProviderLeadStatus(prisma, {
      leadId: params.id,
      providerId: account.providerId,
      status: parsed.data.status,
    });
    return NextResponse.json({ ok: true, lead: serializeProviderLeadContact(lead) });
  } catch (error) {
    if (error instanceof ProviderLeadError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
