import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'CANCELLED']).optional(),
  unlock: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const account = await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } });
  if (!account) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const lead = await prisma.lead.findFirst({ where: { id: params.id, providerId: account.providerId } });
  if (!lead) return NextResponse.json({ error: 'lead_not_found' }, { status: 404 });

  if (parsed.data.unlock && !lead.contactUnlockedAt) {
    if (account.provider.leadCreditsBalance <= 0) return NextResponse.json({ error: 'no_credits' }, { status: 402 });
    await prisma.$transaction([
      prisma.provider.update({ where: { id: account.providerId }, data: { leadCreditsBalance: { decrement: 1 } } }),
      prisma.providerLeadCreditLedger.create({ data: { providerId: account.providerId, type: 'CONSUME', credits: -1, leadId: lead.id } }),
      prisma.lead.update({ where: { id: lead.id }, data: { contactUnlockedAt: new Date() } }),
    ]);
  }

  const updated = parsed.data.status
    ? await prisma.lead.update({ where: { id: lead.id }, data: { status: parsed.data.status } })
    : await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });

  return NextResponse.json({ ok: true, lead: { id: updated.id, status: updated.status } });
}
