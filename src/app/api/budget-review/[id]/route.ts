import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const review = await prisma.budgetReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const paid = Boolean(review.paidAt);
  return NextResponse.json({
    id: review.id,
    status: review.status,
    paid,
    summary: review.summaryJson,
    lineItems: paid ? review.lineItemsJson : undefined,
    findings: paid ? review.findingsJson : undefined,
  });
}
