import { NextResponse } from 'next/server';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAdmin(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export default async function AdminMetricsPage() {
  const session = await auth().catch(() => null);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never;
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
        <h1 className="font-heading text-4xl font-bold">Metricas internas EnergyScan</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['Assessments 7d', assessments7],
            ['Assessments 30d', assessments30],
            ['Pagos Premium 30d', payments30],
            ['Conversion %', conversion],
            ['Leads 30d', leads30],
            ['Proveedores', providers],
            ['Budget reviews 30d', budgetReviews30],
            ['Budget reviews pagadas', budgetPaid30],
            ['PDFs descargados 30d', pdfDownloads30],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-muted">{label}</p><p className="font-heading text-3xl font-bold">{value}</p></div>
          ))}
        </div>
      </main>
    </div>
  );
}
