import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { PROVIDER_LEAD_PACK_CREDITS } from '@/lib/monetization/products';
import { ProviderCreditsCheckoutButton } from '@/components/monetization/ProviderCreditsCheckoutButton';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default function ProviderBillingPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.billingTitle}</h1>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-2xl font-bold">{copy.packTitle(PROVIDER_LEAD_PACK_CREDITS)}</h2>
          <p className="mt-2 text-muted">{copy.packCopy}</p>
          <ProviderCreditsCheckoutButton />
        </div>
      </main>
    </div>
  );
}
