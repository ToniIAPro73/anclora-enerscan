import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowUpRight, BriefcaseBusiness, FileText, LockKeyhole } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { CheckoutButton } from '@/components/CheckoutButton';
import { PdfDownloadLink } from '@/components/PdfDownloadLink';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { canAccessPremiumContent } from '@/lib/premium-access';

export const dynamic = 'force-dynamic';

function localizeConfidence(value: string, language: 'es' | 'en' | 'de') {
  const normalized = value.toLowerCase();
  if (normalized.includes('alta')) return language === 'en' ? 'High' : language === 'de' ? 'Hoch' : 'Alta';
  if (normalized.includes('media')) return language === 'en' ? 'Medium' : language === 'de' ? 'Mittel' : 'Media';
  if (normalized.includes('baja')) return language === 'en' ? 'Low' : language === 'de' ? 'Niedrig' : 'Baja';
  return value;
}

export default async function ProfessionalDashboardPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).professional;
  const session = await auth().catch(() => null);
  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';

  if (!session?.user?.id || !session.user.email) {
    return (
      <div className="min-h-screen app-shell">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h1 className="font-heading text-3xl font-bold text-premium">{copy.dashboardTitle}</h1>
            <p className="mt-3 text-muted">{copy.loginRequired}</p>
            <Link href="/auth" className="mt-6 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.loginCta}</Link>
          </div>
        </main>
      </div>
    );
  }

  const request = await prisma.professionalAccessRequest.findFirst({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  });

  const accessStatus = request?.status || 'NONE';
  const cases = accessStatus === 'APPROVED'
    ? await prisma.assessment.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    : [];

  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-[#00DC82]">{copy.accessStatus}</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-premium">{copy.dashboardTitle}</h1>
          </div>
          <span className="inline-flex w-fit rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-premium">
            {copy.statusLabel[accessStatus as keyof typeof copy.statusLabel] || accessStatus}
          </span>
        </div>

        {accessStatus !== 'APPROVED' ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <LockKeyhole className="h-7 w-7 text-[#00DC82]" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-premium">{copy.gatedTitle}</h2>
            <p className="mt-2 text-muted">
              {accessStatus === 'NONE' ? copy.noRequestCopy : accessStatus === 'REJECTED' ? copy.rejectedCopy : copy.pendingCopy}
            </p>
            <Link href="/profesional/solicitar" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.cta}</Link>
          </section>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link href="/wizard" className="inline-flex min-h-14 items-center justify-between rounded-2xl bg-[#00DC82] px-5 py-3 font-heading font-bold text-[#07140f]">{copy.newClientAssessment}<ArrowUpRight className="h-4 w-4" /></Link>
              <Link href="/dashboard" className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/10 px-5 py-3 font-heading font-bold text-premium">{copy.residentialDashboard}<ArrowUpRight className="h-4 w-4" /></Link>
              <Link href="/profesional/solicitar" className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/10 px-5 py-3 font-heading font-bold text-premium">{copy.requestPlan}<ArrowUpRight className="h-4 w-4" /></Link>
            </div>

            <section className="mt-10">
              <h2 className="font-heading text-2xl font-bold text-premium">{copy.casesTitle}</h2>
              <div className="mt-4 grid gap-3">
                {cases.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <BriefcaseBusiness className="h-8 w-8 text-[#00DC82]" />
                    <p className="mt-4 font-heading text-xl font-bold text-premium">{copy.emptyCasesTitle}</p>
                    <p className="mt-2 text-sm text-muted">{copy.emptyCases}</p>
                  </div>
                ) : cases.map((item) => {
                  const premiumAccess = canAccessPremiumContent({ paidAt: item.paidAt, isDemo: item.isDemo });
                  return (
                    <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase text-muted">{item.createdAt.toLocaleDateString(locale)}</p>
                          <h3 className="mt-2 font-heading text-xl font-bold text-premium">{copy.caseFallback} · {item.zipcode}</h3>
                          <p className="mt-1 text-sm text-muted">{copy.estimatedLetter}: {item.estimatedLetter} · {copy.confidence}: {localizeConfidence(item.confidence, language)}</p>
                          <p className="mt-1 text-sm text-muted">{premiumAccess.isPaid ? copy.premiumAvailable : copy.premiumPending}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                          <Link href={`/assessment/${item.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2 font-heading text-sm font-bold text-premium">{copy.openCase}</Link>
                          {premiumAccess.isPaid ? (
                            <PdfDownloadLink assessmentId={item.id} label={copy.downloadPdf} />
                          ) : (
                            <CheckoutButton assessmentId={item.id} label={copy.unlockPremium} loadingLabel={copy.checkoutLoading} errorLabel={copy.checkoutError} />
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-2xl font-bold text-premium">{copy.plansTitle}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {copy.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 ${plan.highlight ? 'border-2 border-[#00DC82]/60 bg-[#00DC82]/5' : 'border border-white/10 bg-black/10'}`}
              >
                {plan.highlight && (
                  <span className="mb-3 inline-block rounded-full bg-[#00DC82]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00DC82]">Pro</span>
                )}
                <p className="font-heading text-lg font-bold text-premium">{plan.name}</p>
                <p className="mt-1 font-heading text-xl font-bold text-[#00DC82]">{plan.price}</p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted">
                      <span className="mt-0.5 text-[#00DC82]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">{copy.plansSoon} · <a href="/profesional/solicitar" className="text-[#00DC82] underline">{copy.planRequestLabel}</a></p>
          <p className="mt-2 text-xs text-muted">{copy.planLegal}</p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-xl font-bold text-premium">{copy.betaNextTitle}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {copy.betaNext.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-muted">
                <FileText className="mb-3 h-4 w-4 text-[#00DC82]" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
