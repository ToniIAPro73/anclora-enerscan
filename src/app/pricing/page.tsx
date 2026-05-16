'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PricingCard } from '@/components/PricingCard';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

export default function PricingPage() {
  const { dictionary: t, language } = usePreferences();

  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="px-4 pb-16 pt-28">
        <section className="mx-auto max-w-6xl space-y-10">
          <div className="text-center">
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00DC82]">{t.navPricing}</p>
            <h1 className="mt-3 font-heading text-4xl font-bold text-premium">{t.pricingTitle}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted">{t.pricingSubtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <PricingCard
              title={t.pricingFreeTitle}
              price={t.pricingFreePrice}
              subtitle={t.freePlanBadge}
              features={[...t.pricingFreeFeatures]}
              cta={t.startFree}
              href="/wizard"
            />
            <PricingCard
              title={t.pricingPremiumTitle}
              price={t.pricingPremiumLaunchPrice}
              subtitle={`${t.launchOffer} · ${t.pricingPremiumStandardPrice}`}
              features={[...t.pricingPremiumFeatures]}
              cta={t.pricingPremiumCta}
              href="/wizard"
              highlighted
            />
            <PricingCard
              title={t.pricingProTitle}
              price={t.pricingProPrice}
              subtitle={t.pricingProCta}
              features={[...t.pricingProFeatures]}
              cta={t.pricingProCta}
            />
          </div>

          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">
            {getLegalDisclaimer(language)}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
