import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttributionExpiry } from '@/lib/domain/partners';
import { leadRequestSchema } from '@/lib/lead-validation';
import { isStatelessAssessmentId } from '@/lib/stateless-assessment';
import { auth } from '@/auth';

const LEAD_RATE_LIMIT_WINDOW_MS = 60_000;
const LEAD_RATE_LIMIT_MAX = 5;
const leadRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'local-dev';
}

function checkLeadRateLimit(req: Request) {
  // MVP/dev only. This in-memory limiter is per runtime instance and must be replaced before production scale.
  const key = getClientKey(req);
  const now = Date.now();
  const current = leadRateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    leadRateLimitStore.set(key, { count: 1, resetAt: now + LEAD_RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (current.count >= LEAD_RATE_LIMIT_MAX) {
    return {
      key,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return null;
}

function logLeadEvent(event: string, details: Record<string, unknown>) {
  console.info(JSON.stringify({
    scope: 'lead-intake',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

export async function POST(req: Request) {
  const session = await auth().catch(() => null);
  const limited = checkLeadRateLimit(req);
  if (limited) {
    logLeadEvent('rate_limited', { client: limited.key, retryAfterSeconds: limited.retryAfterSeconds });
    return NextResponse.json(
      { ok: false, error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.', retryAfterSeconds: limited.retryAfterSeconds },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    logLeadEvent('invalid_json', { reason: 'parse_failed' });
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const parsed = leadRequestSchema.safeParse(payload);
  if (!parsed.success) {
    logLeadEvent('validation_failed', { issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) });
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
        userId: session?.user?.id,
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

    logLeadEvent('persisted', {
      leadId: lead.id,
      assessmentId: assessmentId || null,
      providerId: providerId || null,
      partnerId: partnerId || null,
      source: data.source || 'provider_marketplace',
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    console.error(JSON.stringify({
      scope: 'lead-intake',
      event: 'persistence_failed_using_fallback',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      assessmentId: assessmentId || null,
      providerId: providerId || null,
      partnerId: partnerId || null,
    }));
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
