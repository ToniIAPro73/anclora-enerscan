import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowUpRight, BarChart3, BriefcaseBusiness, FileText, LockKeyhole, ReceiptText, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { CheckoutButton } from '@/components/CheckoutButton';
import { PdfDownloadLink } from '@/components/PdfDownloadLink';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { signOut } from '@/app/auth/actions';
import { canAccessPremiumContent } from '@/lib/premium-access';

function formatMoney(cents: number | null, currency: string | null, locale: string) {
  if (!cents) return null;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: (currency || 'EUR').toUpperCase() }).format(cents / 100);
}

function localizeConfidence(value: string, language: 'es' | 'en' | 'de') {
  const normalized = value.toLowerCase();
  if (normalized.includes('alta')) return language === 'en' ? 'High' : language === 'de' ? 'Hoch' : 'Alta';
  if (normalized.includes('media')) return language === 'en' ? 'Medium' : language === 'de' ? 'Mittel' : 'Media';
  if (normalized.includes('baja')) return language === 'en' ? 'Low' : language === 'de' ? 'Niedrig' : 'Baja';
  return value;
}

export default async function DashboardPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).dashboard;
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen app-shell">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-28">
          <div className="surface border rounded-3xl p-6">
            <h1 className="font-heading text-3xl font-bold text-premium">{copy.title}</h1>
            <p className="mt-3 text-muted">{copy.signIn}</p>
            <Link href="/auth" className="mt-6 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{copy.loginCta}</Link>
          </div>
        </main>
      </div>
    );
  }
  const [assessments, budgetReviews, providerAccount] = await Promise.all([
    prisma.assessment.findMany({ where: { userId: session.user.id }, include: { leads: true, cadastralRecord: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.budgetReview.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }),
  ]);
  const professionalRequest = session.user.email ? await prisma.professionalAccessRequest.findFirst({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  }) : null;

  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';
  const premiumCount = assessments.filter((assessment) => canAccessPremiumContent({ paidAt: assessment.paidAt, isDemo: assessment.isDemo }).isPaid).length;
  const generatedLeadsCount = assessments.reduce((total, assessment) => total + assessment.leads.length, 0);

  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00DC82]">{session.user.email}</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-premium">{copy.title}</h1>
          </div>
          <form action={signOut}>
            <button className="rounded-full border border-white/10 px-4 py-2 text-sm font-heading font-semibold text-premium transition hover:border-[#00DC82]/40">{copy.signOut}</button>
          </form>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: copy.totalAssessments, value: assessments.length, Icon: BarChart3 },
            { label: copy.premiumUnlocked, value: premiumCount, Icon: ShieldCheck },
            { label: copy.budgetsAnalyzed, value: budgetReviews.length, Icon: ReceiptText },
            { label: copy.generatedLeads, value: generatedLeadsCount, Icon: BriefcaseBusiness },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Icon className="h-5 w-5 text-[#00DC82]" />
              <p className="mt-4 text-3xl font-heading font-bold text-premium">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/wizard" className="inline-flex min-h-14 items-center justify-between rounded-2xl bg-[#00DC82] px-5 py-3 font-heading font-bold text-[#07140f]">
            {copy.newAssessment}<ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/budget-review" className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-[#00DC82]/30 px-5 py-3 font-heading font-bold text-[#00DC82] hover:bg-[#00DC82]/10">
            {copy.reviewBudget}<ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/10 px-5 py-3 font-heading font-bold text-premium hover:border-[#00DC82]/40">
            {copy.viewPricing}<ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href={providerAccount ? '/provider/dashboard' : '/provider/register'} className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/10 px-5 py-3 font-heading font-bold text-premium hover:border-[#00DC82]/40">
            {providerAccount ? copy.providerArea : copy.providerRegister}<ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[#00DC82]">{copy.history}</p>
              <h2 className="font-heading text-2xl font-bold text-premium">{copy.assessmentsTitle}</h2>
            </div>
            <Link href="/wizard" className="hidden text-sm font-bold text-[#00DC82] sm:inline-flex">{copy.newAssessment}</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {assessments.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <FileText className="h-8 w-8 text-[#00DC82]" />
                <p className="mt-4 font-heading text-xl font-bold text-premium">{copy.emptyAssessmentsTitle}</p>
                <p className="mt-2 text-sm text-muted">{copy.emptyAssessments}</p>
                <Link href="/wizard" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-5 py-3 font-heading font-bold text-[#07140f]">{copy.newAssessment}</Link>
              </div>
            ) : assessments.map((assessment) => (
              <article key={assessment.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-2xl bg-[#00DC82] px-3 py-1 font-heading text-lg font-black text-[#07140f]">{assessment.estimatedLetter}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-premium">
                        {canAccessPremiumContent({ paidAt: assessment.paidAt, isDemo: assessment.isDemo }).isPaid ? (assessment.isDemo ? copy.demo : copy.premium) : assessment.paymentStatus === 'checkout_started' ? copy.pendingPayment : copy.free}
                      </span>
                    </div>
                    <h3 className="mt-4 font-heading text-xl font-bold text-premium">
                      {assessment.propertyType || copy.propertyFallback} · {assessment.zipcode}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {assessment.createdAt.toLocaleDateString(locale)} · {assessment.area} m2 · {assessment.year} · {copy.confidence}: {localizeConfidence(assessment.confidence, language)}
                    </p>
                    {assessment.cadastralRecord?.address && <p className="mt-2 text-sm text-muted">{assessment.cadastralRecord.address}</p>}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link href={`/assessment/${assessment.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2 font-heading text-sm font-bold text-premium hover:border-[#00DC82]/40">{copy.openResult}</Link>
                    {canAccessPremiumContent({ paidAt: assessment.paidAt, isDemo: assessment.isDemo }).isPaid ? (
                      <PdfDownloadLink assessmentId={assessment.id} label={copy.downloadPdf} />
                    ) : (
                      <CheckoutButton assessmentId={assessment.id} label={copy.unlockPremium} loadingLabel={copy.checkoutLoading} errorLabel={copy.checkoutError} />
                    )}
                    <Link href="/budget-review" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#00DC82]/30 px-5 py-2 font-heading text-sm font-bold text-[#00DC82]">{copy.reviewBudget}</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold text-premium">{copy.budgetReviewsTitle}</h2>
          <div className="mt-4 grid gap-3">
            {budgetReviews.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <ReceiptText className="h-8 w-8 text-[#00DC82]" />
                <p className="mt-4 font-heading text-xl font-bold text-premium">{copy.emptyBudgetReviewsTitle}</p>
                <p className="mt-2 text-sm text-muted">{copy.emptyBudgetReviews}</p>
                <Link href="/budget-review" className="mt-5 inline-flex rounded-full bg-[#00DC82] px-5 py-3 font-heading font-bold text-[#07140f]">{copy.reviewBudget}</Link>
              </div>
            ) : budgetReviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-heading text-lg font-bold text-premium">{review.fileName || copy.budgetReviewFallback}</p>
                    <p className="mt-1 text-sm text-muted">
                      {review.createdAt.toLocaleDateString(locale)} · {review.paidAt ? copy.paid : review.status} · {formatMoney(review.totalAmountCents, review.currency, locale) || copy.noAmount}
                    </p>
                    <p className="mt-2 text-xs text-muted">{copy.confidence}: {review.extractionConfidence ? `${Math.round(review.extractionConfidence * 100)}%` : copy.confidenceUnknown}</p>
                  </div>
                  <Link href={`/budget-review?review=${review.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2 font-heading text-sm font-bold text-premium hover:border-[#00DC82]/40">
                    {review.paidAt ? copy.openReview : copy.unlockReview}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-heading text-2xl font-bold text-premium">{copy.providerTitle}</h2>
            <p className="mt-2 text-sm text-muted">{providerAccount ? copy.providerConnected : copy.providerNotConnected}</p>
            <Link href={providerAccount ? '/provider/dashboard' : '/provider/register'} className="mt-5 inline-flex rounded-full border border-[#00DC82]/30 px-5 py-3 font-heading font-bold text-[#00DC82]">
              {providerAccount ? copy.providerArea : copy.providerRegister}
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-heading text-2xl font-bold text-premium">{copy.professionalTitle}</h2>
            <p className="mt-2 text-sm text-muted">{professionalRequest ? copy.professionalStatus(professionalRequest.status) : copy.professionalNotRequested}</p>
            <Link href={professionalRequest?.status === 'APPROVED' ? '/profesional/dashboard' : '/profesional/solicitar'} className="mt-5 inline-flex rounded-full border border-[#00DC82]/30 px-5 py-3 font-heading font-bold text-[#00DC82]">
              {professionalRequest?.status === 'APPROVED' ? copy.professionalDashboard : copy.professionalRequest}
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-2xl font-bold text-premium">{copy.nextStepsTitle}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {copy.nextSteps.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-muted">
                <LockKeyhole className="mb-3 h-4 w-4 text-[#00DC82]" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
