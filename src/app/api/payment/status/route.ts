import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripeId(value: string | { id: string } | null) {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

async function reconcilePaidCheckoutSession(sessionId: string) {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripeClient().checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.warn('Payment status Stripe session lookup failed:', error);
    return null;
  }

  const metadataAssessmentId = session.metadata?.assessmentId;
  if (!metadataAssessmentId) return null;

  const existing = await prisma.assessment.findUnique({
    where: { id: metadataAssessmentId },
    select: { id: true, paidAt: true, paymentStatus: true },
  });
  if (!existing) return null;

  if (session.payment_status === 'paid') {
    const paidAt = existing.paidAt || new Date();
    const updated = await prisma.assessment.update({
      where: { id: existing.id },
      data: {
        paidAt,
        isPremium: true,
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntent: getStripeId(session.payment_intent),
        stripeCustomerId: getStripeId(session.customer),
        paidAmountCents: session.amount_total || undefined,
        paidCurrency: session.currency || undefined,
      },
      select: { id: true, paidAt: true, paymentStatus: true },
    });
    trackEvent('payment_completed', { assessmentId: updated.id, stripeSessionId: session.id, source: 'status_reconciliation' });
    return updated;
  }

  if (session.status === 'expired' && !existing.paidAt) {
    return prisma.assessment.update({
      where: { id: existing.id },
      data: { paymentStatus: 'expired', stripeSessionId: session.id },
      select: { id: true, paidAt: true, paymentStatus: true },
    });
  }

  if (session.id !== sessionId) return existing;
  return prisma.assessment.update({
    where: { id: existing.id },
    data: { stripeSessionId: session.id },
    select: { id: true, paidAt: true, paymentStatus: true },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const assessmentId = url.searchParams.get('assessment_id');

  if (!sessionId && !assessmentId) {
    return NextResponse.json({ error: 'payment_reference_required' }, { status: 400 });
  }

  let assessment = await prisma.assessment.findFirst({
    where: sessionId ? { stripeSessionId: sessionId } : { id: assessmentId || '' },
    select: {
      id: true,
      paidAt: true,
      paymentStatus: true,
    },
  });

  if (sessionId && (!assessment || !assessment.paidAt)) {
    assessment = await reconcilePaidCheckoutSession(sessionId) || assessment;
  }

  if (!assessment) {
    return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  }

  const isPaid = Boolean(assessment.paidAt);

  return NextResponse.json({
    assessmentId: assessment.id,
    paymentStatus: assessment.paymentStatus,
    isPaid,
    pdfUrl: isPaid ? `/api/assessment/${assessment.id}/pdf` : undefined,
  });
}
