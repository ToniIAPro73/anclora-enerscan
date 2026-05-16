'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { CheckoutButton } from './CheckoutButton';
import { PdfPreview } from './PdfPreview';
import { usePreferences } from './AppPreferencesProvider';
import { trackEvent } from '@/lib/analytics';

export function PaywallSection({ assessmentId }: { assessmentId: string }) {
  const { dictionary: t } = usePreferences();
  const isLocalAssessment = assessmentId.startsWith('local_');
  const features = [
    t.paywallFeatureScenarios,
    t.paywallFeatureCosts,
    t.paywallFeatureRegulation,
    t.paywallFeatureSubsidies,
    t.paywallFeaturePdf,
    t.paywallFeatureAnnex,
  ];

  useEffect(() => {
    trackEvent('paywall_viewed', { assessmentId });
  }, [assessmentId]);

  return (
    <section className="surface border rounded-3xl p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00DC82]">{t.paywallEyebrow}</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-premium sm:text-3xl">{t.paywallTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{t.paywallSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <span className="font-heading text-4xl font-bold text-[#00DC82]">{t.pricingPremiumLaunchPrice}</span>
            <span className="pb-1 text-sm text-muted line-through">{t.pricingPremiumStandardPrice}</span>
            <span className="mb-1 rounded-full bg-[#FFB020]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#FFB020]">{t.launchOffer}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00DC82]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {isLocalAssessment ? (
            <div className="rounded-2xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-4 text-sm font-semibold text-[#FFB020]">
              {t.checkoutRequiresSavedAssessment}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <CheckoutButton assessmentId={assessmentId} />
              <Link href="/api/assessment/demo" className="text-sm font-heading font-semibold text-[#00DC82] transition hover:brightness-125">
                {t.paywallDemoLink}
              </Link>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00DC82]" />
            <div>
              <p className="font-bold text-premium">{t.paywallSecurePayment}</p>
              <p className="mt-1">{t.paywallLegalNotice}</p>
            </div>
          </div>
        </div>

        <PdfPreview />
      </div>
    </section>
  );
}
