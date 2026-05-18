import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const account = await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } });
  if (!account) return NextResponse.json({ leads: [], credits: 0 });
  const leads = await prisma.lead.findMany({
    where: { providerId: account.providerId },
    include: { assessment: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({
    credits: account.provider.leadCreditsBalance,
    leads: leads.map((lead) => ({
      id: lead.id,
      createdAt: lead.createdAt,
      requestedService: lead.requestedService,
      zone: lead.zone,
      urgency: lead.urgency,
      status: lead.status,
      unlocked: Boolean(lead.contactUnlockedAt),
      userName: lead.contactUnlockedAt ? lead.userName : undefined,
      userEmail: lead.contactUnlockedAt ? lead.userEmail : undefined,
      userPhone: lead.contactUnlockedAt ? lead.userPhone : undefined,
      assessment: lead.assessment ? {
        id: lead.assessment.id,
        propertyType: lead.assessment.propertyType,
        zipcode: lead.assessment.zipcode,
        estimatedLetter: lead.assessment.estimatedLetter,
        confidence: lead.assessment.confidence,
        budgetRange: lead.assessment.budgetRange,
      } : null,
    })),
  });
}
