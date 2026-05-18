import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowUpRight, BadgeCheck, CircleAlert, Coins, Trophy, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { getProviderStatusLabel } from '@/lib/enum-labels';

export default async function ProviderDashboardPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  const providerLang = language;
  const session = await auth().catch(() => null);
  const account = session?.user?.id ? await prisma.providerAccount.findUnique({
    where: { userId: session.user.id },
    include: { provider: { include: { leads: true } } },
  }) : null;
  const leads = account?.provider.leads || [];
  const unlocked = leads.filter((lead) => lead.contactUnlockedAt).length;
  const pending = leads.filter((lead) => lead.status === 'PENDING').length;
  const won = leads.filter((lead) => lead.status === 'WON').length;
  const lost = leads.filter((lead) => lead.status === 'LOST' || lead.status === 'CANCELLED').length;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.dashboardTitle}</h1>
        {!account ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-muted">{copy.signIn}</p>
            <Link href="/provider/register" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.registerCta}</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-[#00DC82]">{copy.provider}</p>
                  <h2 className="mt-2 font-heading text-2xl font-bold text-premium">{account.provider.name}</h2>
                  <p className="mt-2 text-sm text-muted">{copy.providerLegal}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-premium">
                  {account.provider.status === 'PENDING' ? <CircleAlert className="h-4 w-4 text-[#FFB020]" /> : <BadgeCheck className="h-4 w-4 text-[#00DC82]" />}
                  {getProviderStatusLabel(account.provider.status, providerLang)}
                </span>
              </div>
              {account.provider.status === 'PENDING' && <p className="mt-4 rounded-2xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-4 text-sm text-[#FFB020]">{copy.pendingNotice}</p>}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: copy.credits, value: account.provider.leadCreditsBalance, Icon: Coins },
                { label: copy.totalLeads, value: leads.length, Icon: Users },
                { label: copy.unlockedLeads, value: unlocked, Icon: BadgeCheck },
                { label: copy.pendingLeads, value: pending, Icon: CircleAlert },
                { label: copy.wonLostLeads, value: `${won}/${lost}`, Icon: Trophy },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Icon className="h-5 w-5 text-[#00DC82]" />
                  <p className="mt-4 font-heading text-3xl font-bold text-premium">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-muted">{label}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/provider/leads" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.viewLeads}<ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/provider/billing" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3 font-heading font-bold text-premium">{copy.buyCreditsCta}<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </main>
    </div>
  );
}
