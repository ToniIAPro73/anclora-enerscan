import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createBudgetReviewFromText } from '@/lib/budget-review/service';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const schema = z.object({
  text: z.string().trim().min(40).max(80_000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'budget_text_invalid' }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const review = await createBudgetReviewFromText({
    text: parsed.data.text,
    userId: session?.user?.id,
    source: 'text',
  });

  trackEvent('budget_review_started', { productType: 'budget_review', budgetReviewId: review.id });
  return NextResponse.json({
    ok: true,
    review: {
      id: review.id,
      status: review.status,
      summary: review.summaryJson,
      paid: Boolean(review.paidAt),
    },
  });
}
