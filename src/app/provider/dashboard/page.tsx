import Link from 'next/link';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default async function ProviderDashboardPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  const session = await auth().catch(() => null);
  const account = session?.user?.id ? await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }) : null;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.dashboardTitle}</h1>
        {!account ? <p className="mt-4 text-muted">{copy.signIn}</p> : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-muted">{copy.provider}</p><p className="font-bold">{account.provider.name}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-muted">{copy.credits}</p><p className="font-bold">{account.provider.leadCreditsBalance}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-muted">{copy.status}</p><p className="font-bold">{account.provider.status}</p></div>
          </div>
        )}
        <div className="mt-8 flex gap-3"><Link href="/provider/leads" className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.viewLeads}</Link><Link href="/provider/billing" className="rounded-full border border-white/10 px-6 py-3 font-bold">{copy.credits}</Link></div>
      </main>
    </div>
  );
}
