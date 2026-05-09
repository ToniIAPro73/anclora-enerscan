import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttributionExpiry } from '@/lib/domain/partners';
import { leadRequestSchema } from '@/lib/lead-validation';
import { isStatelessAssessmentId } from '@/lib/stateless-assessment';

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const parsed = leadRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos de lead inválidos', details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  const attributionOwner = data.partnerId ? 'PARTNER' : 'ANCLORA';
  const assessmentId = data.assessmentId && !isStatelessAssessmentId(data.assessmentId) ? data.assessmentId : undefined;

  let attributionMonths = 12;
  let providerId = data.providerId;
  let partnerId = data.partnerId;

  try {
    if (data.providerId && !data.providerId.startsWith('fallback-')) {
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId },
        select: { id: true, partnerId: true, attributionMonths: true },
      });
      if (provider) {
        attributionMonths = provider.attributionMonths;
        partnerId = partnerId || provider.partnerId || undefined;
      } else {
        providerId = undefined;
      }
    } else if (data.providerId?.startsWith('fallback-')) {
      providerId = undefined;
    }

    if (partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { id: true, attributionMonths: true },
      });
      if (partner) {
        attributionMonths = partner.attributionMonths;
      } else if (partnerId === data.partnerId) {
        partnerId = undefined;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        assessmentId,
        providerId,
        partnerId,
        userName: data.userName || undefined,
        userEmail: data.userEmail || undefined,
        userPhone: data.userPhone || undefined,
        requestedService: data.requestedService || undefined,
        estimatedBudget: data.estimatedBudget || undefined,
        urgency: data.urgency || undefined,
        zone: data.zone || undefined,
        source: data.source || 'provider_marketplace',
        attributionOwner,
        attributionExpiresAt: calculateAttributionExpiry(attributionMonths),
        status: 'PENDING',
        commissionStatus: 'NOT_APPLICABLE',
        consentAccepted: data.consentAccepted,
        notes: data.notes || undefined,
      },
      select: {
        id: true,
        status: true,
        requestedService: true,
        attributionOwner: true,
        attributionExpiresAt: true,
      },
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    console.error('Lead persistence failed, returning non-persistent fallback:', error);
    const attributionExpiresAt = calculateAttributionExpiry(attributionMonths);
    return NextResponse.json({
      ok: true,
      fallback: true,
      lead: {
        id: `local-lead-${Date.now()}`,
        status: 'PENDING',
        requestedService: data.requestedService || null,
        attributionOwner,
        attributionExpiresAt,
      },
    }, { status: 202 });
  }
}
