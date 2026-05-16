import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { PROVIDER_LEAD_PACK_CREDITS, PROVIDER_LEAD_PACK_PRICE_CENTS } from '@/lib/monetization/products';

export const dynamic = 'force-dynamic';

function appUrl(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
}

export async function POST(req: Request) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const account = await prisma.providerAccount.findUnique({ where: { userId: session.user.id } });
  if (!account) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });

  const configuredPrice = process.env.STRIPE_PRICE_PROVIDER_LEAD_PACK;
  const lineItem = configuredPrice ? { price: configuredPrice, quantity: 1 } : {
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: PROVIDER_LEAD_PACK_PRICE_CENTS,
      product_data: {
        name: `Pack ${PROVIDER_LEAD_PACK_CREDITS} leads EnergyScan`,
        description: 'Creditos para gestionar solicitudes de contacto cualificadas.',
      },
    },
  };
  const checkout = await getStripeClient().checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl(req)}/provider/billing?paid=1`,
    cancel_url: `${appUrl(req)}/provider/billing`,
    line_items: [lineItem],
    metadata: { productType: 'provider_lead_pack', providerId: account.providerId },
  });
  return NextResponse.json({ url: checkout.url });
}
