import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default async function ProviderLeadsPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  const session = await auth().catch(() => null);
  const account = session?.user?.id ? await prisma.providerAccount.findUnique({ where: { userId: session.user.id }, include: { provider: true } }) : null;
  const leads = account ? await prisma.lead.findMany({ where: { providerId: account.providerId }, orderBy: { createdAt: 'desc' } }) : [];
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.leadsTitle}</h1>
        <p className="mt-2 text-sm text-muted">{copy.leadsNotice}</p>
        <div className="mt-8 grid gap-3">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap justify-between gap-3"><p className="font-bold">{lead.requestedService || copy.serviceFallback}</p><p>{lead.status}</p></div>
              <p className="text-sm text-muted">{lead.zone || copy.zoneFallback} · {lead.urgency || copy.urgencyFallback}</p>
              <p className="mt-2 text-xs text-muted">{lead.contactUnlockedAt ? `${lead.userName || ''} ${lead.userEmail || ''} ${lead.userPhone || ''}` : copy.contactLocked}</p>
            </article>
          ))}
          {leads.length === 0 && <p className="text-muted">{copy.emptyLeads}</p>}
        </div>
      </main>
    </div>
  );
}
