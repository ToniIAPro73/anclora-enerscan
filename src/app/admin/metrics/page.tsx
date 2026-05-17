import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export const dynamic = 'force-dynamic';

function isAdmin(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export default async function AdminMetricsPage() {
  const session = await auth().catch(() => null);
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).adminMetrics;
  if (!isAdmin(session?.user?.email)) {
    return (
      <div className="min-h-screen app-shell">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
          <h1 className="font-heading text-4xl font-bold">{copy.forbiddenTitle}</h1>
          <p className="mt-4 text-muted">{copy.forbiddenCopy}</p>
        </main>
      </div>
    );
  }
  const seven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [assessments7, assessments30, payments30, leads30, providers, budgetReviews30, budgetPaid30, pdfDownloads30] = await Promise.all([
    prisma.assessment.count({ where: { createdAt: { gte: seven } } }),
    prisma.assessment.count({ where: { createdAt: { gte: thirty } } }),
    prisma.assessment.count({ where: { paidAt: { gte: thirty } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirty } } }),
    prisma.provider.count(),
    prisma.budgetReview.count({ where: { createdAt: { gte: thirty } } }),
    prisma.budgetReview.count({ where: { paidAt: { gte: thirty } } }),
    prisma.analyticsEventLog.count({ where: { event: 'pdf_downloaded', createdAt: { gte: thirty } } }),
  ]);
  const conversion = assessments30 ? Math.round((payments30 / assessments30) * 1000) / 10 : 0;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.title}</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            [copy.assessments7, assessments7],
            [copy.assessments30, assessments30],
            [copy.premiumPayments30, payments30],
            [copy.conversion, conversion],
            [copy.leads30, leads30],
            [copy.providers, providers],
            [copy.budgetReviews30, budgetReviews30],
            [copy.budgetReviewsPaid, budgetPaid30],
            [copy.pdfDownloads30, pdfDownloads30],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-muted">{label}</p><p className="font-heading text-3xl font-bold">{value}</p></div>
          ))}
        </div>
      </main>
    </div>
  );
}
