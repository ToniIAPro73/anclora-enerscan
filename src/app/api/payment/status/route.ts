import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const assessmentId = url.searchParams.get('assessment_id');

  if (!sessionId && !assessmentId) {
    return NextResponse.json({ error: 'payment_reference_required' }, { status: 400 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: sessionId ? { stripeSessionId: sessionId } : { id: assessmentId || '' },
    select: {
      id: true,
      paidAt: true,
      paymentStatus: true,
    },
  });

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
