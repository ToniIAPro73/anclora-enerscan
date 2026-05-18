export type AnalyticsEvent =
  | 'wizard_started'
  | 'wizard_step_completed'
  | 'wizard_completed'
  | 'assessment_created'
  | 'assessment_viewed'
  | 'paywall_viewed'
  | 'premium_preview_viewed'
  | 'checkout_initiated'
  | 'checkout_completed'
  | 'checkout_abandoned_detected'
  | 'payment_completed'
  | 'pdf_downloaded'
  | 'lead_form_viewed'
  | 'lead_submitted'
  | 'provider_signup_started'
  | 'provider_signup_completed'
  | 'provider_lead_notified'
  | 'budget_review_started'
  | 'budget_review_checkout_initiated'
  | 'budget_review_paid'
  | 'budget_review_completed'
  | 'seo_cta_clicked'
  | 'calculator_used'
  | 'evidence_matrix_viewed'
  | 'condition_risk_viewed';

const SENSITIVE_KEYS = [
  'email',
  'userEmail',
  'phone',
  'userPhone',
  'name',
  'userName',
  'address',
  'streetAddress',
  'cadastralReference',
  'notes',
  'rawText',
  'text',
  'document',
];

function isBrowser() {
  return typeof window !== 'undefined';
}

export function sanitizeAnalyticsPayload(payload: Record<string, unknown> = {}) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      continue;
    }
    if (key === 'zipcode' && typeof value === 'string') {
      sanitized.zipcodePrefix = value.slice(0, 2);
      continue;
    }
    if (value === undefined || typeof value === 'function') continue;
    sanitized[key] = value;
  }
  return sanitized;
}

async function persistEvent(event: AnalyticsEvent, payload: Record<string, unknown>) {
  if (isBrowser() || process.env.ENABLE_ANALYTICS_EVENT_LOG !== 'true') return;
  try {
    const importServerModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<typeof import('@/lib/prisma')>;
    const { prisma } = await importServerModule('@/lib/prisma');
    await prisma.analyticsEventLog.create({
      data: {
        event,
        userId: typeof payload.userId === 'string' ? payload.userId : undefined,
        assessmentId: typeof payload.assessmentId === 'string' ? payload.assessmentId : undefined,
        productType: typeof payload.productType === 'string' ? payload.productType : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        metadataJson: JSON.parse(JSON.stringify(payload)),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics:event-log-failed]', event, error instanceof Error ? error.message : String(error));
    }
  }
}

async function sendPostHog(event: AnalyticsEvent, payload: Record<string, unknown>) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
  const distinctId = typeof payload.userId === 'string'
    ? payload.userId
    : typeof payload.assessmentId === 'string'
      ? payload.assessmentId
      : 'anonymous';

  await fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      event,
      distinct_id: distinctId,
      properties: payload,
    }),
    cache: 'no-store',
  }).catch((error) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics:posthog-failed]', event, error instanceof Error ? error.message : String(error));
    }
  });
}

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  const sanitized = sanitizeAnalyticsPayload(payload || {});
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, sanitized);
  }
  if (isBrowser()) return;
  void persistEvent(event, sanitized);
  void sendPostHog(event, sanitized);
}
