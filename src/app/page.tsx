'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, CheckCircle2, Home, Gauge, Zap, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

export default function LandingPage() {
  const { dictionary: t, language } = usePreferences();

  return (
    <div className="min-h-screen app-shell overflow-x-hidden">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center pt-16">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00DC82]/30 bg-[#00DC82]/5 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00DC82] animate-pulse"></span>
                  <span className="text-xs text-[#00DC82] font-heading font-medium">{t.heroBadge}</span>
                </div>
                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] text-premium mb-6">
                  {t.heroTitleA}<br />
                  <span className="text-[#00DC82]">{t.heroTitleB}</span> {t.heroTitleC}
                </h1>
                <p className="text-muted text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                  {t.heroCopy}
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Link href="/wizard" className="px-7 py-3.5 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition pulse-glow">
                    {t.startFree}
                  </Link>
                  <Link href="/api/assessment/demo" className="px-7 py-3.5 rounded-full bg-[#FFB020] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">
                    {t.demo}
                  </Link>
                  <Link href="#como-funciona" className="px-7 py-3.5 rounded-full border border-[#262626] text-premium font-heading font-medium text-sm hover:border-[#7A7A7A] transition">
                    {t.howItWorks}
                  </Link>
                </div>
                <p className="text-[11px] text-muted leading-relaxed max-w-md">
                  {getLegalDisclaimer(language)}
                </p>
              </div>

              {/* GAUGE MOCKUP */}
              <div className="flex justify-center lg:justify-end">
                <div className="float-anim relative">
                  <div className="w-[320px] h-[160px] rounded-t-full border-b-0 relative overflow-hidden bg-gradient-to-r from-[#D32F2F] via-[#FDD835] to-[#1B8C2F] p-[2px]">
                    <div className="w-full h-full rounded-t-full app-shell flex items-end justify-center pb-4">
                       <span className="font-heading font-bold text-6xl text-premium">E</span>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-xs text-muted">Confianza media</p>
                    <div className="flex gap-1 justify-center mt-2">
                       {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(l => (
                         <span key={l} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${l === 'E' ? 'bg-[#FF9800] text-white' : 'bg-[#262626] text-[#7A7A7A]'}`}>{l}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 lg:mt-20">
              {[
                { label: '% del parque deficiente', val: '80%', color: 'text-premium' },
                { label: 'Primera fecha clave', val: '2030', color: 'text-[#FFB020]' },
                { label: 'Objetivo Clase E', val: '2033', color: 'text-[#EF4444]' },
                { label: 'Pasos del análisis', val: '7', color: 'text-[#00DC82]' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl surface-2 border text-center">
                  <p className={`font-heading font-bold text-2xl sm:text-3xl ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="py-24 sm:py-32 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs text-[#00DC82] font-heading font-semibold tracking-wider uppercase mb-3">{t.process}</p>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-premium mb-4">{t.processTitle}</h2>
              <p className="text-muted max-w-2xl mx-auto">{t.processCopy}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Describe tu vivienda', desc: 'Tipo, año, superficie, sistemas. Adjunta fotos y CEE.', icon: Home, step: '01', color: 'text-[#00DC82]' },
                { title: 'Obtén tu calificación', desc: 'Motor de reglas que estima tu letra orientativa.', icon: Gauge, step: '02', color: 'text-[#FFB020]' },
                { title: 'Explora mejoras', desc: 'Tres escenarios según presupuesto: básico a profundo.', icon: Zap, step: '03', color: 'text-[#00DC82]' },
                { title: 'Descarga tu informe', desc: 'PDF premium con normativa y conexión con proveedores.', icon: FileText, step: '04', color: 'text-[#FFB020]' },
              ].map((s, i) => (
                <div key={i} className="group p-6 rounded-2xl surface-2 border hover:border-[#00DC82]/30 transition">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-heading font-bold text-xs ${s.color}`}>{s.step}</span>
                    <div className="h-px flex-1 bg-[#262626]"></div>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-premium mb-2">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NORMATIVA PREVIEW */}
        <section id="normativa" className="py-24 sm:py-32 relative surface">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs text-[#EF4444] font-heading font-semibold tracking-wider uppercase mb-3">Contexto regulatorio</p>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-premium mb-4">La hoja de ruta que marca la UE</h2>
              <p className="text-muted max-w-2xl mx-auto">Información basada en normativa vigente y objetivos EPBD 2024.</p>
            </div>
            
            <div className="relative">
              <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00DC82] via-[#FFB020] to-[#EF4444]" />
              <div className="space-y-12">
                {[
                  { year: 'Hoy', title: 'R.D. 390/2021', desc: 'CEE obligatorio para venta/alquiler.', status: 'Vigente', color: 'bg-[#00DC82]' },
                  { year: '2030', title: 'Reducción 16%', desc: 'Meta de ahorro en energía primaria.', status: 'Objetivo UE', color: 'bg-[#FFB020]' },
                  { year: '2033', title: 'Clase E', desc: 'Objetivo residencial obligatorio.', status: 'Regulación', color: 'bg-[#EF4444]' }
                ].map((n, i) => (
                  <div key={i} className={`relative flex flex-col sm:flex-row items-start gap-6 sm:gap-0 ${i % 2 === 0 ? '' : 'sm:flex-row-reverse'}`}>
                    <div className={`sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'} pl-16`}>
                      <h3 className="font-heading font-bold text-xl text-premium mb-1">{n.year}</h3>
                      <p className="font-semibold text-sm text-premium mb-2">{n.title}</p>
                      <p className="text-sm text-muted">{n.desc}</p>
                    </div>
                    <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 top-1">
                      <div className={`w-3 h-3 rounded-full ${n.color} ring-4 ring-white/5`} />
                    </div>
                    <div className={`sm:w-1/2 ${i % 2 === 0 ? 'sm:pl-12' : 'sm:pr-12 sm:text-right'} pl-16`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7A7A]">{n.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRECIOS */}
        <section id="precios" className="py-24 sm:py-32 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs text-[#00DC82] font-heading font-semibold tracking-wider uppercase mb-3">{t.navPricing}</p>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-premium mb-4">Prediagnóstico claro antes de invertir</h2>
              <p className="text-muted max-w-2xl mx-auto">
                Anclora EnergyScan separa la valoración orientativa gratuita del informe premium demo. No hay pasarela de pago activa en esta versión.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Prediagnóstico',
                  price: '0€',
                  badge: 'Disponible',
                  cta: t.startFree,
                  href: '/wizard',
                  items: ['Wizard energético completo', 'Letra orientativa y confianza', 'Penalizaciones y fortalezas', 'Contexto normativo básico'],
                },
                {
                  name: 'Informe Premium',
                  price: 'Demo',
                  badge: 'Sin pago real',
                  cta: t.demo,
                  href: '/api/assessment/demo',
                  items: ['PDF premium de ejemplo', 'Escenarios de mejora', 'Documentación aportada', 'Categorías de proveedores sugeridas'],
                },
              ].map((plan) => (
                <div key={plan.name} className="surface-2 border rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-premium">{plan.name}</h3>
                      <p className="mt-2 text-sm text-muted">{plan.badge}</p>
                    </div>
                    <p className="font-heading text-3xl font-bold text-[#00DC82]">{plan.price}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00DC82]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 text-sm font-heading font-bold text-[#0A0A0A] transition hover:brightness-110">
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted leading-relaxed max-w-3xl mx-auto text-center mt-8">
              {getLegalDisclaimer(language)}
            </p>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-24 sm:py-32 relative overflow-hidden text-center">
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-premium mb-6">
              Tu vivienda merece un prediagnóstico<br /><span className="text-[#00DC82]">antes de la obligación</span>
            </h2>
            <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
              En menos de 10 minutos obtendrás una primera estimación de tu situación energética y rutas de mejora.
            </p>
            <Link href="/wizard" className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-base hover:brightness-110 transition pulse-glow">
              {t.startFree} <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-[11px] text-muted mt-6">
              {getLegalDisclaimer(language)}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
