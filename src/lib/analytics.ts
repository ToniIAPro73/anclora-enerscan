export type AnalyticsEvent =
  | 'wizard_completed'
  | 'assessment_viewed'
  | 'paywall_viewed'
  | 'checkout_initiated'
  | 'payment_completed'
  | 'pdf_downloaded';

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, payload || {});
  }
}
