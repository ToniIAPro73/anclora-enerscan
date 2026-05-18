import { cookies } from 'next/headers';
import Link from 'next/link';
import { Coins, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { PROVIDER_LEAD_PACK_CREDITS } from '@/lib/monetization/products';
import { ProviderCreditsCheckoutButton } from '@/components/monetization/ProviderCreditsCheckoutButton';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function ProviderBillingPage({ searchParams }: { searchParams: { paid?: string } }) {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  const session = await auth().catch(() => null);
  const account = session?.user?.id ? await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }) : null;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.billingTitle}</h1>
        {searchParams.paid && <p className="mt-4 rounded-2xl border border-[#00DC82]/30 bg-[#00DC82]/10 p-4 text-sm font-semibold text-[#00DC82]">{copy.paymentVerifying}</p>}
        {!account ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-muted">{copy.signIn}</p>
            <Link href="/provider/register" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.registerCta}</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Coins className="h-7 w-7 text-[#00DC82]" />
              <p className="mt-4 text-xs font-bold uppercase text-muted">{copy.currentBalance}</p>
              <p className="mt-1 font-heading text-4xl font-bold text-premium">{account.provider.leadCreditsBalance}</p>
              <p className="mt-3 text-sm text-muted">{copy.creditsExplain}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <ShieldCheck className="h-7 w-7 text-[#00DC82]" />
              <h2 className="mt-4 font-heading text-2xl font-bold text-premium">{copy.packTitle(PROVIDER_LEAD_PACK_CREDITS)}</h2>
              <p className="mt-2 text-muted">{copy.packCopy}</p>
              <ProviderCreditsCheckoutButton />
            </div>
          </div>
        )}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-xl font-bold text-premium">{copy.billingLegalTitle}</h2>
          <p className="mt-2 text-muted">{copy.packCopy}</p>
          <p className="mt-3 text-sm text-muted">{copy.providerLegal}</p>
        </div>
      </main>
    </div>
  );
}
