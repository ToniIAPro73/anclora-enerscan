import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttributionExpiry, parseJsonArray, scoreProviderMatch } from '@/lib/domain/partners';
import { leadRequestSchema } from '@/lib/lead-validation';
import { isStatelessAssessmentId } from '@/lib/stateless-assessment';
import { auth } from '@/auth';
import { sendTransactionalEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

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
  let assignedProviderEmail: string | null | undefined;

  try {
    if (data.providerId && !data.providerId.startsWith('fallback-')) {
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId },
        select: { id: true, partnerId: true, attributionMonths: true, email: true },
      });
      if (provider) {
        attributionMonths = provider.attributionMonths;
        partnerId = partnerId || provider.partnerId || undefined;
        assignedProviderEmail = provider.email;
      } else {
        providerId = undefined;
      }
    } else if (data.providerId?.startsWith('fallback-')) {
      providerId = undefined;
    }

    if (!providerId && data.requestedService) {
      const candidates = await prisma.provider.findMany({
        where: { status: { in: ['VERIFIED', 'PREFERRED', 'EXCLUSIVE'] } },
        take: 50,
      });
      const ranked = candidates
        .map((provider) => ({
          provider,
          score: scoreProviderMatch({
            categories: parseJsonArray(provider.categories),
            zones: parseJsonArray(provider.zones),
            status: provider.status,
            verified: provider.verified,
            rating: provider.rating,
          }, { category: data.requestedService, zone: data.zone }),
        }))
        .sort((a, b) => b.score - a.score);
      if (ranked[0]?.score > 0) {
        providerId = ranked[0].provider.id;
        partnerId = partnerId || ranked[0].provider.partnerId || undefined;
        attributionMonths = ranked[0].provider.attributionMonths;
        assignedProviderEmail = ranked[0].provider.email;
      }
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
    trackEvent('lead_submitted', {
      leadId: lead.id,
      assessmentId,
      providerId,
      requestedService: data.requestedService,
      source: data.source || 'provider_marketplace',
    });

    if (assignedProviderEmail) {
      await sendTransactionalEmail({
        type: 'provider_lead_notification',
        to: assignedProviderEmail,
        subject: 'Nuevo lead EnergyScan asignado',
        html: '<p>Hay una nueva solicitud de contacto en tu panel de proveedor EnergyScan.</p><p>EnergyScan es un prediagnostico orientativo y no sustituye el CEE oficial.</p>',
        metadata: { leadId: lead.id, providerId },
      });
      trackEvent('provider_lead_notified', { leadId: lead.id, providerId });
    }

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
