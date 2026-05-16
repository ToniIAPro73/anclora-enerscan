import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const review = await prisma.budgetReview.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, paidAt: true },
  });
  if (!review) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ id: review.id, status: review.status, paid: Boolean(review.paidAt) });
}
