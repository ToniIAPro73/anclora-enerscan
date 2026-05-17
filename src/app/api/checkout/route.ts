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

  if (assessmentId.startsWith('local_')) {
    return NextResponse.json(
      {
        error: 'persisted_assessment_required',
        message: 'El pago Premium requiere un análisis guardado en base de datos. Este resultado local no puede abrir Checkout.',
      },
      { status: 400 }
    );
  }

  let assessment;
  try {
    assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, userId: true, isDemo: true, paidAt: true, paymentStatus: true, user: { select: { email: true } } },
    });
  } catch (error) {
    console.error('Checkout assessment lookup failed:', error);
    return NextResponse.json(
      {
        error: 'checkout_storage_unavailable',
        message: 'No se pudo consultar el análisis guardado para iniciar el pago.',
      },
      { status: 500 }
    );
  }

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

  let session;
  try {
    const stripe = getStripeClient();
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/assessment/${assessment.id}`,
      line_items: [buildPremiumLineItem()],
      customer_email: assessment.user?.email || undefined,
      metadata: {
        assessmentId: assessment.id,
        amountCents: String(PREMIUM_PRICE_CENTS),
        currency: PREMIUM_CURRENCY,
        product: 'energyscan_premium_report',
        productType: 'premium_report',
        userId: assessment.userId || '',
      },
    });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return NextResponse.json(
      {
        error: 'checkout_session_failed',
        message: 'Stripe no pudo crear la sesión de pago. Revisa la configuración test.',
      },
      { status: 500 }
    );
  }

  try {
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        stripeSessionId: session.id,
        paymentStatus: 'checkout_started',
      },
    });
    const checkoutRecovery = (prisma as unknown as {
      checkoutRecovery?: {
        upsert: (args: unknown) => Promise<unknown>;
      };
    }).checkoutRecovery;
    if (checkoutRecovery) {
      const { hashEmail } = await import('@/lib/email');
      await checkoutRecovery.upsert({
        where: { assessmentId: assessment.id },
        create: {
          assessmentId: assessment.id,
          stripeSessionId: session.id,
          userEmailHash: assessment.user?.email ? hashEmail(assessment.user.email) : undefined,
          status: assessment.user?.email ? 'PENDING' : 'SKIPPED_NO_EMAIL',
        },
        update: {
          stripeSessionId: session.id,
          userEmailHash: assessment.user?.email ? hashEmail(assessment.user.email) : undefined,
          status: assessment.user?.email ? 'PENDING' : 'SKIPPED_NO_EMAIL',
        },
      });
    }
  } catch (error) {
    console.error('Checkout session persistence failed:', error);
    return NextResponse.json(
      {
        error: 'checkout_persistence_failed',
        message: 'Se creó la sesión de Stripe, pero no se pudo guardar en el análisis.',
      },
      { status: 500 }
    );
  }
  trackEvent('checkout_initiated', {
    assessmentId: assessment.id,
    amountCents: PREMIUM_PRICE_CENTS,
    currency: PREMIUM_CURRENCY,
    productType: 'premium_report',
    stripeSessionId: session.id,
    userId: assessment.userId,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'checkout_url_missing' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
