import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient, PREMIUM_CURRENCY, PREMIUM_PRICE_CENTS } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

function getAppUrl(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(req.url).origin;
}

function buildPremiumLineItem() {
  const price = process.env.STRIPE_PRICE_PREMIUM;
  if (price) return { price, quantity: 1 };

  return {
    quantity: 1,
    price_data: {
      currency: PREMIUM_CURRENCY,
      unit_amount: PREMIUM_PRICE_CENTS,
      product_data: {
        name: 'Informe Premium Anclora EnergyScan',
        description: 'Prediagnóstico energético orientativo con escenarios, costes y PDF descargable.',
      },
    },
  };
}

export async function POST(req: Request) {
  let body: { assessmentId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId.trim() : '';
  if (!assessmentId) {
    return NextResponse.json({ error: 'assessment_required' }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, isDemo: true, paidAt: true, paymentStatus: true },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'assessment_not_found' }, { status: 404 });
  }

  const appUrl = getAppUrl(req);
  if (assessment.paidAt) {
    return NextResponse.json({ url: `${appUrl}/checkout/success?assessment_id=${assessment.id}` });
  }

  if (assessment.isDemo) {
    return NextResponse.json({ error: 'demo_checkout_not_allowed' }, { status: 400 });
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/assessment/${assessment.id}`,
    line_items: [buildPremiumLineItem()],
    metadata: {
      assessmentId: assessment.id,
      product: 'energyscan_premium_report',
    },
  });

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      stripeSessionId: session.id,
      paymentStatus: 'checkout_started',
    },
  });
  trackEvent('checkout_initiated', { assessmentId: assessment.id, stripeSessionId: session.id });

  if (!session.url) {
    return NextResponse.json({ error: 'checkout_url_missing' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
