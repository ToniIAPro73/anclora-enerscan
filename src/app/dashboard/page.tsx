import Link from 'next/link';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { signOut } from '@/app/auth/actions';

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
    prisma.assessment.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.budgetReview.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }),
  ]);

  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';

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

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/wizard" className="rounded-full bg-[#00DC82] px-5 py-3 font-heading font-bold text-[#07140f]">{copy.newAssessment}</Link>
          <Link href="/budget-review" className="rounded-full border border-[#00DC82]/30 px-5 py-3 font-heading font-bold text-[#00DC82] hover:bg-[#00DC82]/10">{copy.reviewBudget}</Link>
          {providerAccount && <Link href="/provider/dashboard" className="rounded-full border border-white/10 px-5 py-3 font-heading font-bold text-premium hover:border-[#00DC82]/40">{copy.providerArea}</Link>}
        </div>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold text-premium">{copy.assessmentsTitle}</h2>
          <div className="mt-4 grid gap-3">
            {assessments.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">{copy.emptyAssessments}</p>
            ) : assessments.map((assessment) => (
              <Link key={assessment.id} href={`/assessment/${assessment.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#00DC82]/40">
                <p className="font-bold">{assessment.estimatedLetter} · {assessment.area} m2 · {assessment.year}</p>
                <p className="text-sm text-muted">{assessment.createdAt.toLocaleDateString(locale)} · {assessment.paidAt ? copy.premium : copy.free}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold text-premium">{copy.budgetReviewsTitle}</h2>
          <div className="mt-4 grid gap-3">
            {budgetReviews.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">{copy.emptyBudgetReviews}</p>
            ) : budgetReviews.map((review) => (
              <Link key={review.id} href={`/budget-review?review=${review.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#00DC82]/40">
                <p className="font-bold">{review.fileName || copy.budgetReviewFallback}</p>
                <p className="text-sm text-muted">{review.createdAt.toLocaleDateString(locale)} · {review.paidAt ? copy.premium : review.status}</p>
              </Link>
            ))}
          </div>
        </section>

        {providerAccount && (
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-bold text-premium">{copy.providerTitle}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link href="/provider/dashboard" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#00DC82]/40">
                <p className="text-xs text-muted">{copy.providerArea}</p>
                <p className="mt-1 font-bold">{providerAccount.provider.name}</p>
              </Link>
              <Link href="/provider/leads" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#00DC82]/40">
                <p className="text-xs text-muted">{copy.providerLeads}</p>
                <p className="mt-1 font-bold">{providerAccount.provider.status}</p>
              </Link>
              <Link href="/provider/billing" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#00DC82]/40">
                <p className="text-xs text-muted">{copy.providerBilling}</p>
                <p className="mt-1 font-bold">{providerAccount.provider.leadCreditsBalance}</p>
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
