import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { getProviderStatusLabel } from '@/lib/enum-labels';
import { ProviderStatusChanger } from '@/components/admin/ProviderStatusChanger';

export const dynamic = 'force-dynamic';

function isAdmin(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

const headings = {
  es: {
    title: 'Administración de Proveedores',
    forbidden: 'Acceso no autorizado',
    forbiddenCopy: 'Solo los administradores pueden acceder a esta sección.',
    name: 'Nombre',
    email: 'Email',
    status: 'Estado',
    categories: 'Categorías',
    zones: 'Zonas',
    credits: 'Créditos',
    leads: 'Leads',
    registered: 'Alta',
    back: 'Volver a métricas',
    noProviders: 'No hay proveedores registrados.',
    save: 'Guardar',
    saving: '…',
    saved: '✓',
    saveError: 'Error',
  },
  en: {
    title: 'Provider Administration',
    forbidden: 'Unauthorized access',
    forbiddenCopy: 'Only administrators can access this section.',
    name: 'Name',
    email: 'Email',
    status: 'Status',
    categories: 'Categories',
    zones: 'Zones',
    credits: 'Credits',
    leads: 'Leads',
    registered: 'Registered',
    back: 'Back to metrics',
    noProviders: 'No providers registered.',
    save: 'Save',
    saving: '…',
    saved: '✓',
    saveError: 'Error',
  },
  de: {
    title: 'Anbieter-Administration',
    forbidden: 'Kein Zugriff',
    forbiddenCopy: 'Nur Administratoren können auf diesen Bereich zugreifen.',
    name: 'Name',
    email: 'E-Mail',
    status: 'Status',
    categories: 'Kategorien',
    zones: 'Regionen',
    credits: 'Guthaben',
    leads: 'Leads',
    registered: 'Registriert',
    back: 'Zurück zu Metriken',
    noProviders: 'Keine Anbieter registriert.',
    save: 'Speichern',
    saving: '…',
    saved: '✓',
    saveError: 'Fehler',
  },
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#FFB020]/20 text-[#FFB020]',
  VERIFIED: 'bg-[#00DC82]/20 text-[#00DC82]',
  PREFERRED: 'bg-blue-500/20 text-blue-400',
  SUSPENDED: 'bg-[#EF4444]/20 text-[#EF4444]',
  EXCLUSIVE: 'bg-purple-500/20 text-purple-400',
};

export default async function AdminProvidersPage() {
  const session = await auth().catch(() => null);
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = headings[language] ?? headings.es;

  if (!isAdmin(session?.user?.email)) {
    return (
      <div className="min-h-screen app-shell">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
          <h1 className="font-heading text-4xl font-bold text-premium">{copy.forbidden}</h1>
          <p className="mt-4 text-muted">{copy.forbiddenCopy}</p>
        </main>
      </div>
    );
  }

  const providers = await prisma.provider.findMany({
    include: {
      leads: { select: { id: true, status: true } },
      accounts: { select: { userId: true } },
      creditLedger: { select: { credits: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';

  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00DC82]">Admin</p>
            <h1 className="mt-2 font-heading text-4xl font-bold text-premium">{copy.title}</h1>
          </div>
          <a href="/admin/metrics" className="rounded-full border border-white/10 px-4 py-2 text-sm font-heading font-semibold text-premium hover:border-[#00DC82]/40">
            {copy.back}
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
          {(['PENDING', 'VERIFIED', 'PREFERRED', 'SUSPENDED'] as const).map((s) => {
            const count = providers.filter((p) => p.status === s).length;
            return (
              <span key={s} className={`rounded-full px-3 py-1 ${statusColors[s] ?? 'bg-white/5 text-muted'}`}>
                {getProviderStatusLabel(s, language)}: {count}
              </span>
            );
          })}
        </div>

        {providers.length === 0 ? (
          <p className="mt-8 text-muted">{copy.noProviders}</p>
        ) : (
          <div className="mt-8 grid gap-4">
            {providers.map((provider) => {
              // creditLedger used for future credit balance display
              void provider.creditLedger;
              const categories = (() => { try { return JSON.parse(provider.categories) as string[]; } catch { return []; } })();
              const zones = (() => { try { return JSON.parse(provider.zones) as string[]; } catch { return []; } })();

              return (
                <article key={provider.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ProviderStatusChanger
                          providerId={provider.id}
                          currentStatus={provider.status}
                          statusLabel={(s) => getProviderStatusLabel(s, language)}
                          labels={{ save: copy.save, saving: copy.saving, saved: copy.saved, saveError: copy.saveError }}
                        />
                        <span className="text-xs text-muted">{provider.createdAt.toLocaleDateString(locale)}</span>
                      </div>
                      <h2 className="mt-2 font-heading text-xl font-bold text-premium">{provider.name}</h2>
                      {provider.legalName && <p className="text-sm text-muted">{provider.legalName}</p>}
                      {provider.email && <p className="mt-1 text-sm text-muted">{provider.email}</p>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold text-muted">
                      <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        {copy.credits}: <span className="text-[#00DC82]">{provider.leadCreditsBalance}</span>
                      </span>
                      <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        {copy.leads}: <span className="text-premium">{provider.leads.length}</span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span key={cat} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-muted">{cat}</span>
                    ))}
                    {zones.map((zone) => (
                      <span key={zone} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted">{zone}</span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
