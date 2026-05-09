import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AttachmentList } from '@/components/AttachmentList';
import { prisma } from '@/lib/prisma';
import { generateScenarios } from '@/lib/simulator';
import { REGULATORY_TIMELINE, DISCLAIMER_TEXT, REGULATORY_DISCLAIMER } from '@/lib/regulatory';
import { AlertTriangle, ArrowRight, Download, CheckCircle2, HelpCircle, Lightbulb, FileText } from 'lucide-react';
import { PropertyDataV2, ScoreResultV2, EnergyLetter, PropertyType, HeatingSystem, CoolingSystem, WaterHeatingSystem, WindowType, RenewableSystem, InsulationLevel, BudgetRange, AssessmentObjective, ConfidenceLevel, PropertyOrientation, RoofType, VentilationType, TimelineHorizon } from '@/lib/domain/energy-assessment';
import { parseStatelessAssessmentId } from '@/lib/stateless-assessment';

export default async function AssessmentResultsPage({ params }: { params: { id: string } }) {
  const statelessPayload = parseStatelessAssessmentId(params.id);
  const assessment = statelessPayload ? null : await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { attachments: true }
  });

  if (!assessment && !statelessPayload) return <div>No se encontró el análisis.</div>;

  const propertyData: PropertyDataV2 = statelessPayload ? statelessPayload.propertyData : {
    year: assessment!.year,
    area: assessment!.area,
    zipcode: assessment!.zipcode,
    propertyType: (assessment!.propertyType || 'unknown') as PropertyType,
    orientation: (assessment!.orientation || 'unknown') as PropertyOrientation,
    roofType: (assessment!.roofType || 'unknown') as RoofType,
    heating: (assessment!.heating || 'unknown') as HeatingSystem,
    cooling: (assessment!.cooling || 'unknown') as CoolingSystem,
    waterHeating: (assessment!.waterHeating || 'unknown') as WaterHeatingSystem,
    ventilation: (assessment!.ventilation || 'unknown') as VentilationType,
    windows: (assessment!.windows || 'unknown') as WindowType,
    renewables: (assessment!.renewables || 'unknown') as RenewableSystem,
    facadeInsulation: (assessment!.facadeInsulation || 'unknown') as InsulationLevel,
    roofInsulation: (assessment!.roofInsulation || 'unknown') as InsulationLevel,
    budgetRange: (assessment!.budgetRange || 'unknown') as BudgetRange,
    timelineHorizon: (assessment!.timelineHorizon || 'unknown') as TimelineHorizon,
    targetLetter: (assessment!.targetLetter || 'G') as EnergyLetter,
    objective: (assessment!.objective || 'unknown') as AssessmentObjective,
  };

  const scoreResult: ScoreResultV2 = statelessPayload ? statelessPayload.scoreResult : {
    score: assessment!.score || 0,
    estimatedLetter: assessment!.estimatedLetter as EnergyLetter,
    confidence: (assessment!.confidence || 'Media') as ConfidenceLevel,
    climateZone: assessment!.climateZone || 'Desconocida',
    penalties: JSON.parse(assessment!.penalties || '[]'),
    strengths: JSON.parse(assessment!.strengths || '[]'),
    missingData: JSON.parse(assessment!.missingData || '[]'),
    explanation: assessment!.explanation || '',
  };


  const scenarios = generateScenarios(propertyData, scoreResult);
  const providers = await prisma.provider.findMany({ take: 3 }).catch(() => []);
  const isDemo = statelessPayload?.isDemo || assessment?.isDemo || false;
  const attachments = statelessPayload?.attachments || assessment?.attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    path: attachment.path,
    createdAt: attachment.createdAt.toISOString(),
  })) || [];

  return (
    <div className="min-h-screen app-shell">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* HEADER / SCORING */}
          <div className="grid lg:grid-cols-2 gap-8 items-center surface border rounded-3xl p-8 lg:p-12 glow-green">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-[#00DC82] font-heading font-semibold uppercase tracking-wider mb-2">{isDemo ? 'Resultado preliminar · Demo' : 'Resultado preliminar'}</p>
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-premium">Tu clasificación orientativa</h1>
              </div>
              <p className="text-muted leading-relaxed">
                Basado en los datos declarados de tu vivienda ({propertyData.area}m², construida en {propertyData.year}), hemos estimado tu letra energética actual.
              </p>
              {isDemo && (
                <p className="rounded-xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-3 text-xs font-semibold text-[#FFB020]">
                  Este informe usa datos ficticios para mostrar la experiencia premium sin datos personales.
                </p>
              )}
              {scoreResult.explanation && (
                <p className="text-sm text-[#F0EDE8]">{scoreResult.explanation}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted uppercase">Confianza del motor</span>
                    <span className={`text-sm font-bold max-w-fit px-2 py-0.5 rounded ${scoreResult.confidence === 'Alta' ? 'bg-[#00DC82]/20 text-[#00DC82]' : scoreResult.confidence === 'Media' ? 'bg-[#FFB020]/20 text-[#FFB020]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                      {scoreResult.confidence}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted uppercase">Zona Climática</span>
                    <span className="text-sm font-bold text-premium">{scoreResult.climateZone}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted leading-relaxed italic">
                {DISCLAIMER_TEXT}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#262626] to-[#0A0A0A] border-2 border-[#00DC82]/30 flex items-center justify-center text-6xl font-heading font-bold text-[#F0EDE8] shadow-2xl shadow-[#00DC82]/10">
                {scoreResult.estimatedLetter}
              </div>
              <div className="flex gap-1">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(l => (
                  <div key={l} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${l === scoreResult.estimatedLetter ? 'bg-[#00DC82] text-[#0A0A0A]' : 'bg-[#262626] text-[#7A7A7A]'}`}>{l}</div>
                ))}
              </div>
            </div>
          </div>

          {/* CAPTURED DATA */}
          <section className="surface border rounded-3xl p-6 lg:p-8">
            <h2 className="mb-5 font-heading text-2xl font-bold text-premium">Datos capturados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Tipo', propertyData.propertyType],
                ['Orientación', propertyData.orientation],
                ['Cubierta', propertyData.roofType],
                ['Ventilación', propertyData.ventilation],
                ['Calefacción', propertyData.heating],
                ['Refrigeración', propertyData.cooling],
                ['ACS', propertyData.waterHeating],
                ['Horizonte', propertyData.timelineHorizon],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase text-muted">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-premium">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PENALTIES, STRENGTHS & GAPS */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#EF4444] mb-4">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-lg">Factores penalizadores</h3>
              </div>
              {scoreResult.penalties.length > 0 ? (
                <ul className="space-y-3">
                  {scoreResult.penalties.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#7A7A7A]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-1.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#7A7A7A]">No se detectaron penalizaciones mayores.</p>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#00DC82] mb-4">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-heading font-bold text-lg">Puntos fuertes</h3>
              </div>
              {scoreResult.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {scoreResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#7A7A7A]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00DC82] mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#7A7A7A]">No se detectaron puntos fuertes destacados.</p>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#FFB020] mb-4">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-lg">Datos faltantes</h3>
              </div>
              {scoreResult.missingData.length > 0 ? (
                <ul className="space-y-3">
                  {scoreResult.missingData.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#7A7A7A]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFB020] mt-1.5 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#7A7A7A]">Datos completos.</p>
              )}
            </div>
          </div>

          {/* REGULATORY TIMELINE */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="font-heading font-bold text-3xl text-[#F0EDE8] mb-2">Contexto regulatorio</h2>
              <p className="text-[#7A7A7A] text-sm italic">{REGULATORY_DISCLAIMER}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REGULATORY_TIMELINE.map((n, i) => (
                <div key={i} className="bg-[#131313] border border-[#262626] rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 ${n.riskLevel === 'high' ? 'bg-[#EF4444]' : n.riskLevel === 'medium' ? 'bg-[#FFB020]' : 'bg-[#00DC82]'}`} />
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-heading font-bold text-xl text-[#F0EDE8]">{n.year}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${n.status === 'vigente' ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'bg-[#FFB020]/20 text-[#FFB020]'}`}>{n.status}</span>
                  </div>
                  <p className="font-bold text-sm text-[#F0EDE8] relative z-10">{n.title}</p>
                  <p className="text-xs text-[#7A7A7A] leading-relaxed relative z-10">{n.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ATTACHMENTS */}
          <section className="surface border rounded-3xl p-6 lg:p-8">
            <div className="mb-5 flex items-center gap-2 text-premium">
              <FileText className="h-5 w-5 text-[#00DC82]" />
              <h2 className="font-heading text-2xl font-bold">Documentación aportada</h2>
            </div>
            <p className="mb-4 text-xs text-muted">Los archivos se registran como soporte documental, pero no han sido analizados automáticamente por EnerScan.</p>
            <AttachmentList
              assessmentId={params.id}
              initialAttachments={attachments}
            />
          </section>

          {/* PREMIUM REPORT CTA */}
          <section className="bg-gradient-to-r from-[#00DC82]/20 to-[#FFB020]/20 border border-white/10 rounded-3xl p-8 text-center space-y-6">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F0EDE8]">Obtén tu Informe Premium Detallado</h2>
            <p className="text-[#7A7A7A] max-w-2xl mx-auto">
              Descarga un PDF completo con 3 escenarios de mejora, desglose de costes, ahorro anual estimado y acceso prioritario a proveedores.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href={`/api/assessment/${params.id}/pdf`}
                className="px-8 py-4 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold flex items-center gap-2 hover:brightness-110 transition shadow-xl shadow-[#00DC82]/20"
                download
              >
                <Download className="w-5 h-5" /> Descargar PDF (Demo Premium)
              </a>
            </div>
            <p className="text-[10px] text-[#7A7A7A]/60">Documento PDF generado de forma dinámica.</p>
          </section>

          {/* SIMULATOR */}
          <section className="space-y-8">
             <div className="text-center">
              <h2 className="font-heading font-bold text-3xl text-[#F0EDE8] mb-2">Simulador de mejoras</h2>
              <p className="text-[#7A7A7A]">Explora cómo impactarían diferentes actuaciones en tu letra y bolsillo.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {scenarios.map(s => (
                <div key={s.id} className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 flex flex-col hover:border-[#00DC82]/30 transition group">
                  <h3 className="font-heading font-bold text-xl text-[#F0EDE8] mb-1">{s.title}</h3>
                  <p className="text-xs text-[#7A7A7A] mb-4">{s.objective}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {s.measures.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#7A7A7A]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00DC82] mt-0.5 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-[#262626] space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-[#7A7A7A]">Coste:</span><span className="font-bold">{s.estimatedCostRange}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#7A7A7A]">Ahorro:</span><span className="font-bold text-[#00DC82]">{s.estimatedSavingsRange}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#7A7A7A]">Salto:</span><span className="font-bold text-[#FFB020]">{s.expectedLetterImpact}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* MARKETPLACE */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="font-heading font-bold text-3xl text-[#F0EDE8] mb-2">Marketplace de proveedores</h2>
              <p className="text-[#7A7A7A]">Empresas para ejecutar tus mejoras en CP {propertyData.zipcode}.</p>
            </div>
            {providers.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map(p => (
                  <div key={p.id} className="bg-[#131313] border border-[#262626] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-[#F0EDE8]">{p.name}</h4>
                      {p.verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00DC82]/10 text-[#00DC82]">Verificado</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(p.categories).map((c: string) => (
                        <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#7A7A7A] border border-white/5">{c}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-[#FFB020]">
                        <span className="text-xs font-bold">{p.rating}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i <= p.rating ? 'bg-[#FFB020]' : 'bg-[#262626]'}`} />)}
                        </div>
                      </div>
                      <button className="text-xs font-bold text-[#00DC82] flex items-center gap-1 hover:underline">Solicitar presupuesto <ArrowRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#7A7A7A] text-sm">Aún no hay proveedores registrados en tu zona. Las categorías recomendadas son: aislamiento, ventanas, climatización y fotovoltaica.</div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
