import type { PrismaClient } from '@prisma/client';

export const PROVIDER_LEAD_STATUSES = ['PENDING', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'CANCELLED'] as const;

export type ProviderLeadStatus = (typeof PROVIDER_LEAD_STATUSES)[number];

type PrismaLike = Pick<PrismaClient, '$transaction' | 'lead' | 'provider' | 'providerLeadCreditLedger'>;

export class ProviderLeadError extends Error {
  constructor(
    public code: 'lead_not_found' | 'no_credits' | 'invalid_status',
    public status: number,
  ) {
    super(code);
  }
}

export function isProviderLeadStatus(value: string): value is ProviderLeadStatus {
  return PROVIDER_LEAD_STATUSES.includes(value as ProviderLeadStatus);
}

export async function unlockProviderLeadContact(
  db: PrismaLike,
  input: { leadId: string; providerId: string; creditsBalance: number },
) {
  const lead = await db.lead.findFirst({ where: { id: input.leadId, providerId: input.providerId } });
  if (!lead) throw new ProviderLeadError('lead_not_found', 404);

  if (lead.contactUnlockedAt) {
    return { lead, consumed: false };
  }

  if (input.creditsBalance <= 0) throw new ProviderLeadError('no_credits', 402);

  const unlockedAt = new Date();
  const updatedLead = await db.$transaction(async (tx) => {
    await tx.provider.update({
      where: { id: input.providerId },
      data: { leadCreditsBalance: { decrement: 1 } },
    });
    await tx.providerLeadCreditLedger.create({
      data: {
        providerId: input.providerId,
        type: 'CONSUME',
        credits: -1,
        leadId: lead.id,
        notes: 'Provider lead contact unlocked',
      },
    });
    return tx.lead.update({
      where: { id: lead.id },
      data: { contactUnlockedAt: unlockedAt },
    });
  });

  return { lead: updatedLead, consumed: true };
}

export async function updateProviderLeadStatus(
  db: PrismaLike,
  input: { leadId: string; providerId: string; status: string },
) {
  if (!isProviderLeadStatus(input.status)) throw new ProviderLeadError('invalid_status', 400);
  const lead = await db.lead.findFirst({ where: { id: input.leadId, providerId: input.providerId } });
  if (!lead) throw new ProviderLeadError('lead_not_found', 404);
  return db.lead.update({ where: { id: lead.id }, data: { status: input.status } });
}

export function serializeProviderLeadContact(lead: {
  id: string;
  status: string;
  contactUnlockedAt: Date | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
}) {
  return {
    id: lead.id,
    status: lead.status,
    unlocked: Boolean(lead.contactUnlockedAt),
    userName: lead.contactUnlockedAt ? lead.userName : undefined,
    userEmail: lead.contactUnlockedAt ? lead.userEmail : undefined,
    userPhone: lead.contactUnlockedAt ? lead.userPhone : undefined,
  };
}
