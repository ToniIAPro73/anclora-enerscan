import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export type EmailLanguage = 'es' | 'en' | 'de';
export type EmailType = 'premium_purchase' | 'checkout_recovery' | 'provider_lead_notification';

export function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || 'soporte@anclora.com';
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

const premiumCopy = {
  es: {
    subject: 'Tu informe Premium de Anclora EnergyScan',
    title: 'Compra Premium confirmada',
    copy: 'Ya puedes consultar tu análisis y descargar el informe Premium cuando lo necesites.',
    download: 'Descargar PDF Premium',
    view: 'Ver análisis',
    legal: 'EnergyScan es un prediagnóstico orientativo. No sustituye al Certificado de Eficiencia Energética oficial ni tiene validez administrativa.',
  },
  en: {
    subject: 'Your Anclora EnergyScan Premium report',
    title: 'Premium purchase confirmed',
    copy: 'You can now view your assessment and download the Premium report whenever you need it.',
    download: 'Download Premium PDF',
    view: 'View assessment',
    legal: 'EnergyScan is an indicative pre-assessment. It does not replace the official Energy Performance Certificate and has no administrative validity.',
  },
  de: {
    subject: 'Ihr Premium-Bericht von Anclora EnergyScan',
    title: 'Premium-Kauf bestätigt',
    copy: 'Sie können Ihre Analyse jetzt ansehen und den Premium-Bericht jederzeit herunterladen.',
    download: 'Premium-PDF herunterladen',
    view: 'Analyse ansehen',
    legal: 'EnergyScan ist eine orientierende Voreinschätzung. Es ersetzt keinen offiziellen Energieausweis und hat keine administrative Gültigkeit.',
  },
} as const;

const recoveryCopy = {
  es: {
    subject: 'Tu informe EnergyScan sigue disponible',
    title: '¿Quieres terminar tu informe Premium?',
    copy: 'Has iniciado el pago, pero no consta como completado. Puedes retomarlo desde tu análisis.',
    cta: 'Retomar informe',
    discount: 'Si tienes un código de descuento, introdúcelo en Stripe antes de pagar.',
  },
  en: {
    subject: 'Your EnergyScan report is still available',
    title: 'Finish your Premium report?',
    copy: 'You started checkout, but payment is not marked as completed. You can resume from your assessment.',
    cta: 'Resume report',
    discount: 'If you have a discount code, enter it in Stripe before paying.',
  },
  de: {
    subject: 'Ihr EnergyScan-Bericht ist noch verfügbar',
    title: 'Premium-Bericht abschliessen?',
    copy: 'Sie haben den Checkout gestartet, aber die Zahlung ist nicht abgeschlossen. Sie können über Ihre Analyse fortfahren.',
    cta: 'Bericht fortsetzen',
    discount: 'Wenn Sie einen Rabattcode haben, geben Sie ihn vor der Zahlung in Stripe ein.',
  },
} as const;

function layout(title: string, body: string, ctaHref?: string, ctaLabel?: string, legal?: string) {
  return [
    `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:640px;margin:0 auto;padding:24px">`,
    `<h1 style="font-size:24px;margin:0 0 16px">${title}</h1>`,
    `<p>${body}</p>`,
    ctaHref && ctaLabel ? `<p><a href="${ctaHref}" style="display:inline-block;background:#00DC82;color:#07140f;padding:12px 18px;border-radius:999px;font-weight:bold;text-decoration:none">${ctaLabel}</a></p>` : '',
    legal ? `<p style="font-size:12px;color:#555;border-top:1px solid #eee;padding-top:16px">${legal}</p>` : '',
    `<p style="font-size:12px;color:#555">Soporte: ${getSupportEmail()}</p>`,
    `</div>`,
  ].join('');
}

async function createEmailLog(input: {
  type: EmailType;
  to?: string | null;
  assessmentId?: string;
  status: string;
  provider?: string;
  externalId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        type: input.type,
        toEmailHash: input.to ? hashEmail(input.to) : undefined,
        assessmentId: input.assessmentId,
        provider: input.provider,
        status: input.status,
        externalId: input.externalId,
        error: input.error,
        metadataJson: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.warn('Email log persistence skipped:', error);
  }
}

export async function sendTransactionalEmail(input: {
  type: EmailType;
  to?: string | null;
  subject: string;
  html: string;
  assessmentId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!input.to) {
    await createEmailLog({ ...input, status: 'SKIPPED_NO_EMAIL' });
    return { ok: false, skipped: 'no_email' as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await createEmailLog({ ...input, status: 'SKIPPED_NO_PROVIDER', provider: 'resend' });
    return { ok: false, skipped: 'no_provider' as const };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Anclora EnergyScan <no-reply@anclora.com>',
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || 'Resend send failed');
    await createEmailLog({ ...input, status: 'SENT', provider: 'resend', externalId: payload?.id });
    return { ok: true, id: payload?.id as string | undefined };
  } catch (error) {
    await createEmailLog({
      ...input,
      status: 'FAILED',
      provider: 'resend',
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error };
  }
}

export async function sendPremiumPurchaseEmail(input: {
  to?: string | null;
  assessmentId: string;
  language?: EmailLanguage;
}) {
  const language = input.language || 'es';
  const copy = premiumCopy[language];
  const appUrl = getAppUrl();
  return sendTransactionalEmail({
    type: 'premium_purchase',
    to: input.to,
    assessmentId: input.assessmentId,
    subject: copy.subject,
    html: layout(
      copy.title,
      copy.copy,
      `${appUrl}/assessment/${input.assessmentId}`,
      copy.view,
      `${copy.legal}<br><a href="${appUrl}/api/assessment/${input.assessmentId}/pdf">${copy.download}</a>`
    ),
  });
}

const providerLeadCopy = {
  es: {
    subject: 'Nueva solicitud de contacto asignada — EnergyScan',
    title: 'Tienes una nueva solicitud de contacto',
    copy: 'Un usuario ha solicitado contacto en tu área de servicio a través de Anclora EnergyScan. Revisa el detalle en tu panel de proveedor.',
    cta: 'Ver leads',
    legal: 'EnergyScan es un prediagnóstico orientativo. No emite CEE oficial ni garantiza obras, ahorros o cierres comerciales. Usa los datos recibidos solo para la solicitud consentida.',
  },
  en: {
    subject: 'New contact request assigned — EnergyScan',
    title: 'You have a new contact request',
    copy: 'A user has requested contact in your service area through Anclora EnergyScan. Review the details in your provider dashboard.',
    cta: 'View leads',
    legal: 'EnergyScan is an indicative pre-assessment. It does not issue official EPCs or guarantee works, savings or commercial closings. Use the received data only for the consented request.',
  },
  de: {
    subject: 'Neue Kontaktanfrage zugewiesen — EnergyScan',
    title: 'Sie haben eine neue Kontaktanfrage',
    copy: 'Ein Nutzer hat über Anclora EnergyScan eine Kontaktanfrage in Ihrem Servicebereich gestellt. Details finden Sie in Ihrem Anbieter-Dashboard.',
    cta: 'Leads ansehen',
    legal: 'EnergyScan ist eine orientierende Voreinschätzung. Es stellt keinen offiziellen Energieausweis aus und garantiert keine Arbeiten, Einsparungen oder Geschäftsabschlüsse. Verwenden Sie die erhaltenen Daten nur für die zugestimmte Anfrage.',
  },
} as const;

export async function sendProviderLeadNotificationEmail(input: {
  to?: string | null;
  providerId?: string;
  leadId: string;
  language?: EmailLanguage;
}) {
  const language = input.language || 'es';
  const copy = providerLeadCopy[language];
  const appUrl = getAppUrl();
  return sendTransactionalEmail({
    type: 'provider_lead_notification',
    to: input.to,
    subject: copy.subject,
    html: layout(copy.title, copy.copy, `${appUrl}/provider/leads`, copy.cta, copy.legal),
    metadata: { leadId: input.leadId, providerId: input.providerId },
  });
}

export async function sendCheckoutRecoveryEmail(input: {
  to?: string | null;
  assessmentId: string;
  language?: EmailLanguage;
}) {
  const language = input.language || 'es';
  const copy = recoveryCopy[language];
  const discount = process.env.ABANDONED_CHECKOUT_DISCOUNT_CODE;
  return sendTransactionalEmail({
    type: 'checkout_recovery',
    to: input.to,
    assessmentId: input.assessmentId,
    subject: copy.subject,
    html: layout(
      copy.title,
      `${copy.copy}${discount ? `<br><strong>${copy.discount} Codigo: ${discount}</strong>` : ''}`,
      `${getAppUrl()}/assessment/${input.assessmentId}`,
      copy.cta,
      premiumCopy[language].legal
    ),
  });
}
