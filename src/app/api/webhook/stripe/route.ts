import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';
import { sendPremiumPurchaseEmail } from '@/lib/email';
import { PROVIDER_LEAD_PACK_CREDITS } from '@/lib/monetization/products';

export const dynamic = 'force-dynamic';

function getStripeId(value: string | { id: string } | null) {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

async function markCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const productType = session.metadata?.productType;
  if (productType === 'budget_review') {
    const budgetReviewId = session.metadata?.budgetReviewId;
    if (!budgetReviewId) return;
    await prisma.budgetReview.updateMany({
      where: { id: budgetReviewId },
      data: {
        paidAt: new Date(),
        status: 'PAID',
        stripeSessionId: session.id,
        stripePaymentIntent: getStripeId(session.payment_intent),
        paidAmountCents: session.amount_total || undefined,
        paidCurrency: session.currency || undefined,
      },
    });
    trackEvent('budget_review_paid', { productType: 'budget_review', budgetReviewId, stripeSessionId: session.id });
    return;
  }

  if (productType === 'provider_lead_pack') {
    const providerId = session.metadata?.providerId;
    if (!providerId) return;
    await prisma.provider.update({
      where: { id: providerId },
      data: { leadCreditsBalance: { increment: PROVIDER_LEAD_PACK_CREDITS } },
    });
    await prisma.providerLeadCreditLedger.create({
      data: {
        providerId,
        type: 'PURCHASE',
        credits: PROVIDER_LEAD_PACK_CREDITS,
        stripeSessionId: session.id,
        notes: 'Stripe provider lead pack checkout completed',
      },
    });
    return;
  }

  const assessmentId = session.metadata?.assessmentId;
  if (!assessmentId) return;

  const existing = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { paidAt: true, user: { select: { email: true } } },
  });
  if (!existing) return;

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      paidAt: existing.paidAt || new Date(),
      isPremium: true,
      paymentStatus: 'paid',
      stripeSessionId: session.id,
      stripePaymentIntent: getStripeId(session.payment_intent),
      stripeCustomerId: getStripeId(session.customer),
      paidAmountCents: session.amount_total || undefined,
      paidCurrency: session.currency || undefined,
    },
  });
  const checkoutRecovery = (prisma as unknown as {
    checkoutRecovery?: { updateMany: (args: unknown) => Promise<unknown> };
  }).checkoutRecovery;
  if (checkoutRecovery) {
    await checkoutRecovery.updateMany({
      where: { assessmentId },
      data: { status: 'SKIPPED_PAID' },
    });
  }

  trackEvent('payment_completed', { assessmentId, stripeSessionId: session.id, productType: 'premium_report' });
  await sendPremiumPurchaseEmail({
    to: session.customer_details?.email || existing.user?.email,
    assessmentId,
  });
}

async function markCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const assessmentId = session.metadata?.assessmentId;
  if (!assessmentId) return;

  await prisma.assessment.updateMany({
    where: {
      id: assessmentId,
      paidAt: null,
    },
    data: { paymentStatus: 'expired' },
  });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe signature';
    return NextResponse.json({ error: 'invalid_signature', message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await markCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'checkout.session.expired':
      await markCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await prisma.assessment.updateMany({
        where: {
          stripePaymentIntent: paymentIntent.id,
          paidAt: null,
        },
        data: { paymentStatus: 'failed' },
      });
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = getStripeId(charge.payment_intent);
      if (paymentIntent) {
        await prisma.assessment.updateMany({
          where: { stripePaymentIntent: paymentIntent },
          data: { paymentStatus: 'refunded' },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
