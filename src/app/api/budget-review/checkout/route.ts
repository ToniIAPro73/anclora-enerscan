import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { BUDGET_REVIEW_PRICE_CENTS } from '@/lib/monetization/products';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const schema = z.object({ budgetReviewId: z.string().min(1) });

function getAppUrl(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'budget_review_required' }, { status: 400 });

  const review = await prisma.budgetReview.findUnique({ where: { id: parsed.data.budgetReviewId } });
  if (!review) return NextResponse.json({ error: 'budget_review_not_found' }, { status: 404 });
  if (review.paidAt) return NextResponse.json({ url: `${getAppUrl(req)}/budget-review?review=${review.id}` });

  const price = process.env.STRIPE_PRICE_BUDGET_REVIEW;
  const lineItem = price ? { price, quantity: 1 } : {
    quantity: 1,
    price_data: {
      currency: 'eur',
      unit_amount: BUDGET_REVIEW_PRICE_CENTS,
      product_data: {
        name: 'Segunda opinión de presupuesto EnergyScan',
        description: 'Análisis automático orientativo de presupuesto de reforma. No sustituye revisión técnica profesional.',
      },
    },
  };

  const session = await getStripeClient().checkout.sessions.create({
    mode: 'payment',
    success_url: `${getAppUrl(req)}/budget-review?review=${review.id}&paid=1`,
    cancel_url: `${getAppUrl(req)}/budget-review?review=${review.id}`,
    line_items: [lineItem],
    metadata: {
      amountCents: String(BUDGET_REVIEW_PRICE_CENTS),
      currency: 'eur',
      productType: 'budget_review',
      budgetReviewId: review.id,
      userId: review.userId || '',
    },
  });

  await prisma.budgetReview.update({
    where: { id: review.id },
    data: { stripeSessionId: session.id, status: 'CHECKOUT_STARTED' },
  });
  trackEvent('budget_review_checkout_initiated', {
    amountCents: BUDGET_REVIEW_PRICE_CENTS,
    currency: 'eur',
    productType: 'budget_review',
    budgetReviewId: review.id,
    stripeSessionId: session.id,
    userId: review.userId,
  });
  return NextResponse.json({ url: session.url });
}
