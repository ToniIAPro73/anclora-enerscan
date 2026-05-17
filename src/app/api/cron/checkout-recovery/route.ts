import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCheckoutRecoveryEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

function getDelayHours() {
  const parsed = Number(process.env.ABANDONED_CHECKOUT_DELAY_HOURS || '24');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - getDelayHours() * 60 * 60 * 1000);
  const recoveries = await prisma.checkoutRecovery.findMany({
    where: {
      status: 'PENDING',
      recoverySentAt: null,
      createdAt: { lte: cutoff },
      assessment: { paidAt: null },
    },
    include: {
      assessment: { include: { user: { select: { email: true } } } },
    },
    take: 50,
  });

  let sent = 0;
  let skipped = 0;
  for (const recovery of recoveries) {
    const email = recovery.assessment.user?.email;
    if (!email) {
      skipped += 1;
      await prisma.checkoutRecovery.update({
        where: { id: recovery.id },
        data: { status: 'SKIPPED_NO_EMAIL' },
      });
      continue;
    }

    const result = await sendCheckoutRecoveryEmail({ to: email, assessmentId: recovery.assessmentId });
    await prisma.checkoutRecovery.update({
      where: { id: recovery.id },
      data: {
        status: result.ok ? 'SENT' : 'FAILED',
        recoverySentAt: result.ok ? new Date() : undefined,
      },
    });
    if (result.ok) sent += 1;
    else skipped += 1;
    trackEvent('checkout_abandoned_detected', { assessmentId: recovery.assessmentId, source: 'cron' });
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
