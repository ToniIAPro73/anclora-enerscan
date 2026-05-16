import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  categories: z.array(z.string()).min(1).max(8),
  zones: z.array(z.string()).min(1).max(12),
  website: z.string().trim().url().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'provider_invalid' }, { status: 400 });
  const session = await auth().catch(() => null);
  const provider = await prisma.provider.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      website: parsed.data.website || undefined,
      categories: JSON.stringify(parsed.data.categories),
      zones: JSON.stringify(parsed.data.zones),
      status: 'PENDING',
      verified: false,
      source: 'provider_signup',
    },
  });
  if (session?.user?.id) {
    await prisma.providerAccount.create({
      data: { userId: session.user.id, providerId: provider.id },
    }).catch(() => undefined);
  }
  trackEvent('provider_signup_completed', { providerId: provider.id, source: 'provider_register' });
  return NextResponse.json({ ok: true, provider: { id: provider.id, status: provider.status } });
}
