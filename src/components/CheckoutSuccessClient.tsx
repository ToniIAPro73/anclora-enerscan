'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, FileText, RefreshCw } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { PdfDownloadLink } from './PdfDownloadLink';
import { usePreferences } from './AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

type PaymentStatus = {
  assessmentId: string;
  paymentStatus: string;
  isPaid: boolean;
  pdfUrl?: string;
};

export function CheckoutSuccessClient({
  sessionId,
  assessmentId,
}: {
  sessionId?: string;
  assessmentId?: string;
}) {
  const { dictionary: t, language } = usePreferences();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    const query = sessionId
      ? `session_id=${encodeURIComponent(sessionId)}`
      : assessmentId
        ? `assessment_id=${encodeURIComponent(assessmentId)}`
        : '';

    if (!query) {
      setError('missing_payment_reference');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payment/status?${query}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'payment_status_failed');
      setStatus(payload);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'payment_status_failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, assessmentId]);

  const isPaid = status?.isPaid === true;

  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="px-4 pb-16 pt-28">
        <section className="mx-auto max-w-3xl surface border rounded-3xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00DC82]/10 text-[#00DC82]">
            {isPaid ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
          </div>

          <h1 className="font-heading text-3xl font-bold text-premium">
            {isPaid ? t.checkoutSuccessTitle : t.checkoutPendingTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {isPaid ? t.checkoutSuccessCopy : t.checkoutPendingCopy}
          </p>

          {error && <p className="mt-4 text-sm font-semibold text-[#EF4444]">{error}</p>}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isPaid && status?.assessmentId && <PdfDownloadLink assessmentId={status.assessmentId} />}
            {status?.assessmentId && (
              <Link href={`/assessment/${status.assessmentId}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-6 py-3 font-heading font-bold text-premium transition hover:border-[#00DC82]/40">
                <FileText className="h-5 w-5" />
                {t.checkoutSuccessBackToAssessment}
              </Link>
            )}
            <Link href="/dashboard" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-6 py-3 font-heading font-bold text-premium transition hover:border-[#00DC82]/40">
              {t.checkoutSuccessDashboard}
            </Link>
            {!isPaid && (
              <button type="button" onClick={loadStatus} disabled={loading} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#0A0A0A] transition hover:brightness-110 disabled:opacity-70">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? t.processing : t.checkoutPendingTitle}
              </button>
            )}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-xs leading-relaxed text-muted">
            {getLegalDisclaimer(language)}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
