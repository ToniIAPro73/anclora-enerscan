import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowUpRight, BriefcaseBusiness, FileText, History, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default async function ProfessionalPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).professional;
  const session = await auth().catch(() => null);
  const request = session?.user?.email ? await prisma.professionalAccessRequest.findFirst({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  }) : null;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-muted">{copy.intro}</p>
        <p className="mt-4 font-heading text-2xl font-bold text-[#00DC82]">{copy.price}</p>
        <p className="mt-3 text-sm text-muted">{copy.legal}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={request?.status === 'APPROVED' ? '/profesional/dashboard' : '/profesional/solicitar'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 font-heading font-bold text-[#07140f]">{request?.status === 'APPROVED' ? copy.dashboardCta : copy.cta}<ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 py-3 font-heading font-bold text-premium">{copy.residentialDashboard}</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            [copy.featureCases, BriefcaseBusiness],
            [copy.featurePdfBranding, FileText],
            [copy.featureClientPrecheck, ShieldCheck],
            [copy.featureHistory, History],
          ].map(([label, Icon]) => (
            <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <Icon className="h-6 w-6 text-[#00DC82]" />
              <p className="mt-4 font-heading font-bold text-premium">{label as string}</p>
            </div>
          ))}
        </div>
        {request && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase text-[#00DC82]">{copy.accessStatus}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-premium">{copy.statusLabel[request.status as keyof typeof copy.statusLabel] || request.status}</p>
          </div>
        )}
      </main>
    </div>
  );
}
