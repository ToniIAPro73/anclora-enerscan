import Link from 'next/link';
import { cookies } from 'next/headers';
import { CalendarDays, Home, MapPin, ShieldAlert, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { ProviderLeadActions } from '@/components/ProviderLeadActions';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { getPropertyTypeLabel } from '@/lib/enum-labels';

export default async function ProviderLeadsPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  const session = await auth().catch(() => null);
  const account = session?.user?.id ? await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }) : null;
  const leads = account ? await prisma.lead.findMany({ where: { providerId: account.providerId }, include: { assessment: true }, orderBy: { createdAt: 'desc' } }) : [];
  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.leadsTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">{copy.leadsNotice}</p>
        {!account && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-muted">{copy.signIn}</p>
            <Link href="/provider/register" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.registerCta}</Link>
          </div>
        )}
        <div className="mt-8 grid gap-3">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-xl font-bold text-premium">{lead.requestedService || copy.serviceFallback}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-premium">{copy.statusLabel[lead.status as keyof typeof copy.statusLabel] || lead.status}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#00DC82]" />{lead.zone || copy.zoneFallback}</span>
                    <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#00DC82]" />{lead.urgency || copy.urgencyFallback}</span>
                    <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#00DC82]" />{lead.createdAt.toLocaleDateString(locale)}</span>
                    <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[#00DC82]" />{lead.consentAccepted ? copy.consentYes : copy.consentUnknown}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-bold uppercase text-muted">{copy.propertyType}</p>
                  <p className="mt-1 font-bold text-premium">{getPropertyTypeLabel(lead.assessment?.propertyType, language) || copy.propertyFallback}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-bold uppercase text-muted">{copy.zone}</p>
                  <p className="mt-1 font-bold text-premium">{lead.assessment?.zipcode || lead.zone || copy.zoneFallback}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-bold uppercase text-muted">{copy.estimatedLetter}</p>
                  <p className="mt-1 font-heading text-2xl font-black text-premium">{lead.assessment?.estimatedLetter || '-'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-bold uppercase text-muted">{copy.budget}</p>
                  <p className="mt-1 font-bold text-premium">{lead.estimatedBudget || lead.assessment?.budgetRange || copy.noAmount}</p>
                </div>
              </div>
              {lead.assessmentId && (
                <Link href={`/assessment/${lead.assessmentId}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#00DC82]">
                  <Home className="h-4 w-4" /> {copy.openAssessmentContext}
                </Link>
              )}
              <ProviderLeadActions
                leadId={lead.id}
                initialStatus={lead.status}
                initiallyUnlocked={Boolean(lead.contactUnlockedAt)}
                initialContact={{
                  userName: lead.contactUnlockedAt ? lead.userName : undefined,
                  userEmail: lead.contactUnlockedAt ? lead.userEmail : undefined,
                  userPhone: lead.contactUnlockedAt ? lead.userPhone : undefined,
                }}
                credits={account?.provider.leadCreditsBalance || 0}
              />
            </article>
          ))}
          {account && leads.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="font-heading text-xl font-bold text-premium">{copy.emptyLeadsTitle}</p>
              <p className="mt-2 text-sm text-muted">{copy.emptyLeads}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
