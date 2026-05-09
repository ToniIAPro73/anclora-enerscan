'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Star } from 'lucide-react';
import { formatProviderCategory, formatProviderStatus } from '@/lib/domain/partners';

type PublicProvider = {
  id: string;
  name: string;
  categories: string[];
  categoryLabels?: string[];
  zones: string[];
  status: string;
  verified: boolean;
  rating: number;
  slaHours?: number | null;
};

type LeadState = 'idle' | 'sending' | 'sent' | 'error';

const serviceOptions = [
  ['CEE', 'Certificación energética'],
  ['WINDOWS', 'Ventanas'],
  ['INSULATION', 'Aislamiento'],
  ['HVAC', 'Climatización / aerotermia'],
  ['SOLAR', 'Fotovoltaica / renovables'],
  ['REFORM', 'Reforma'],
  ['OTHER', 'Otro'],
];

export function ProviderLeadSection({ assessmentId, zone }: { assessmentId: string; zone?: string }) {
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<PublicProvider | null>(null);
  const [leadState, setLeadState] = useState<LeadState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/providers')
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setProviders(data.providers || []);
        setFallback(Boolean(data.fallback));
      })
      .catch(() => {
        if (!active) return;
        setProviders([]);
        setFallback(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [zone]);

  const visibleProviders = useMemo(() => providers.slice(0, 5), [providers]);

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) return;
    setLeadState('sending');
    setMessage('');
    const formData = new FormData(event.currentTarget);
    const payload = {
      assessmentId,
      providerId: selectedProvider.id,
      userName: String(formData.get('userName') || ''),
      userEmail: String(formData.get('userEmail') || ''),
      userPhone: String(formData.get('userPhone') || ''),
      requestedService: String(formData.get('requestedService') || ''),
      estimatedBudget: String(formData.get('estimatedBudget') || ''),
      urgency: String(formData.get('urgency') || ''),
      zone,
      source: assessmentId.startsWith('local_') ? 'demo' : 'assessment',
      consentAccepted: formData.get('consentAccepted') === 'on',
      notes: String(formData.get('notes') || ''),
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok && !data.ok) {
        throw new Error(data.error || 'No se pudo registrar la solicitud.');
      }
      setLeadState('sent');
      setMessage('Solicitud enviada. Un proveedor podrá revisar la información y contactar contigo.');
      event.currentTarget.reset();
    } catch (error) {
      setLeadState('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la solicitud.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00DC82]">Red de partners</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-premium">Partners recomendados para tus mejoras</h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          Según los datos aportados y los escenarios sugeridos, puedes solicitar contacto con proveedores verificados para estudiar actuaciones como certificación energética, ventanas, aislamiento, climatización o renovables.
        </p>
      </div>

      {fallback && (
        <p className="rounded-2xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-3 text-xs text-[#FFB020]">
          Mostrando proveedores demo de respaldo. La disponibilidad real debe confirmarse directamente con cada profesional.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-muted">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando proveedores...
        </div>
      ) : visibleProviders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProviders.map((provider) => (
            <article key={provider.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-premium">{provider.name}</h3>
                {provider.verified && (
                  <span className="shrink-0 rounded-full bg-[#00DC82]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#00DC82]">
                    {formatProviderStatus(provider.status)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.categories.map((category) => (
                  <span key={category} className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] font-semibold text-muted">
                    {formatProviderCategory(category)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Zonas: {provider.zones.join(', ')}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#FFB020]">
                  <Star className="h-4 w-4 fill-current" /> {provider.rating.toFixed(1)}
                  {provider.slaHours ? <span className="text-xs font-normal text-muted">SLA {provider.slaHours}h</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setLeadState('idle');
                    setMessage('');
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#00DC82] px-4 py-2 text-xs font-bold text-[#0A0A0A]"
                >
                  Solicitar contacto <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted">
          No hay proveedores disponibles para este filtro. Las categorías recomendadas siguen siendo certificación energética, ventanas, aislamiento, climatización y renovables.
        </p>
      )}

      {selectedProvider && (
        <form onSubmit={submitLead} className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase text-[#00DC82]">Solicitud de contacto</p>
            <h3 className="mt-1 font-heading text-xl font-bold text-premium">{selectedProvider.name}</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-muted">
              Nombre
              <input name="userName" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Email
              <input name="userEmail" type="email" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Teléfono
              <input name="userPhone" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Servicio interesado
              <select name="requestedService" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]">
                {serviceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Urgencia
              <select name="urgency" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="IMMEDIATE">Inmediata</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted">
              Presupuesto estimado
              <input name="estimatedBudget" placeholder="Ej. 5.000 - 15.000 EUR" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-premium outline-none focus:border-[#00DC82]" />
            </label>
          </div>

          <label className="mt-3 block space-y-1 text-xs font-semibold text-muted">
            Notas
            <textarea name="notes" rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-premium outline-none focus:border-[#00DC82]" />
          </label>

          <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed text-muted">
            <input name="consentAccepted" type="checkbox" className="mt-1 h-4 w-4 accent-[#00DC82]" />
            Acepto que Anclora EnergyScan registre esta solicitud de contacto y la comparta con proveedores demo/verificados para preparar un presupuesto orientativo. No implica contratación ni resultado garantizado.
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={leadState === 'sending'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 text-sm font-bold text-[#0A0A0A] disabled:opacity-60">
              {leadState === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Enviar solicitud
            </button>
            {message && (
              <p className={`text-sm ${leadState === 'error' ? 'text-[#EF4444]' : 'text-[#00DC82]'}`}>{message}</p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
