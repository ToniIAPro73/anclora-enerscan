import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AttachmentList } from '@/components/AttachmentList';
import { ProviderLeadSection } from '@/components/ProviderLeadSection';
import { PdfDownloadLink } from '@/components/PdfDownloadLink';
import { prisma } from '@/lib/prisma';
import { generateScenarios } from '@/lib/simulator';
import { REGULATORY_TIMELINE } from '@/lib/regulatory';
import { getRelevantSubsidies } from '@/lib/subsidies';
import { formatEuroRange } from '@/lib/costs/format';
import { COST_ESTIMATE_DISCLAIMER } from '@/lib/costs/cost-disclaimers';
import { AlertTriangle, CheckCircle2, HelpCircle, Lightbulb, FileText } from 'lucide-react';
import { AssessmentAttachment, PropertyDataV2, ScoreResultV2, EnergyLetter, PropertyType, HeatingSystem, CoolingSystem, WaterHeatingSystem, WindowType, RenewableSystem, InsulationLevel, BudgetRange, AssessmentObjective, ConfidenceLevel, PropertyOrientation, RoofType, VentilationType, TimelineHorizon } from '@/lib/domain/energy-assessment';
import { parseStatelessAssessmentId } from '@/lib/stateless-assessment';
import { cookies } from 'next/headers';
import { getPreferencesForLanguage, normalizeCurrency, normalizeLanguage, normalizeMeasurementSystem } from '@/lib/preferences';
import { formatArea } from '@/lib/formatters';
import { getDictionary, getLegalDisclaimer, formatValueLabel } from '@/lib/i18n';
import { localizeScenarios, localizeSubsidies } from '@/lib/scenario-i18n';

export const dynamic = 'force-dynamic';

export default async function AssessmentResultsPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const language = normalizeLanguage(cookieStore.get('enerscan-language')?.value);
  const defaults = getPreferencesForLanguage(language);
  const currency = normalizeCurrency(cookieStore.get('enerscan-currency')?.value || defaults.currency);
  const measurementSystem = normalizeMeasurementSystem(cookieStore.get('enerscan-measurement-system')?.value || defaults.measurementSystem);
  const t = getDictionary(language);

  const statelessPayload = parseStatelessAssessmentId(params.id);
  const assessment = statelessPayload ? null : await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { attachments: true, cadastralRecord: true }
  });

  if (!assessment && !statelessPayload) return <div>No se encontró el análisis.</div>;

  const cadastralRecordRaw = statelessPayload?.cadastralRecord || assessment?.cadastralRecord;
  const cadastralRecord = cadastralRecordRaw ? {
    cadastralReference: cadastralRecordRaw.cadastralReference,
    address: cadastralRecordRaw.address,
    municipality: cadastralRecordRaw.municipality,
    province: cadastralRecordRaw.province,
    propertyUse: cadastralRecordRaw.propertyUse,
    surfaceBuiltM2: cadastralRecordRaw.surfaceBuiltM2,
    yearBuilt: cadastralRecordRaw.yearBuilt,
    parcelReference: cadastralRecordRaw.parcelReference,
    // Map Prisma internal fields to unified UI names if coming from DB
    floor: 'internalFloor' in cadastralRecordRaw ? cadastralRecordRaw.internalFloor : cadastralRecordRaw.floor,
    door: 'internalDoor' in cadastralRecordRaw ? cadastralRecordRaw.internalDoor : cadastralRecordRaw.door,
    block: 'internalBlock' in cadastralRecordRaw ? cadastralRecordRaw.internalBlock : cadastralRecordRaw.block,
    staircase: 'internalStaircase' in cadastralRecordRaw ? cadastralRecordRaw.internalStaircase : cadastralRecordRaw.staircase,
    participationPct: 'participationPct' in cadastralRecordRaw ? cadastralRecordRaw.participationPct : cadastralRecordRaw.participationCoefficient,
  } : null;

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


  const scenarios = localizeScenarios(generateScenarios(propertyData, scoreResult), language);
  const subsidies = localizeSubsidies(getRelevantSubsidies(propertyData), language);
  const isDemo = statelessPayload?.isDemo || assessment?.isDemo || false;
  const attachments: AssessmentAttachment[] = statelessPayload?.attachments || assessment?.attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    category: attachment.category as AssessmentAttachment['category'],
    size: attachment.size,
    path: attachment.path,
    createdAt: attachment.createdAt.toISOString(),
  })) || [];
  const exteriorCount = attachments.filter((attachment) => attachment.category === 'EXTERIOR').length;
  const interiorCount = attachments.filter((attachment) => attachment.category === 'INTERIOR').length;
  const ceeCount = attachments.filter((attachment) => attachment.category === 'CEE' || attachment.type === 'application/pdf').length;

  return (
    <div className="min-h-screen app-shell">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* HEADER / SCORING */}
          <div className="grid lg:grid-cols-2 gap-8 items-center surface border rounded-3xl p-8 lg:p-12 glow-green">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-[#00DC82] font-heading font-semibold uppercase tracking-wider mb-2">{isDemo ? t.resultDemo : t.result}</p>
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-premium">{t.estimatedRating}</h1>
              </div>
              <p className="text-muted leading-relaxed">
                {t.resultCopy} ({formatArea(propertyData.area, measurementSystem, language)}, {propertyData.year}).
              </p>
              {isDemo && (
                <p className="rounded-xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-3 text-xs font-semibold text-[#FFB020]">
                  {t.demoNotice}
                </p>
              )}
              {scoreResult.explanation && (
                <p className="text-sm text-premium">{scoreResult.explanation}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted uppercase">{t.engineConfidence}</span>
                    <span className={`text-sm font-bold max-w-fit px-2 py-0.5 rounded ${scoreResult.confidence === 'Alta' ? 'bg-[#00DC82]/20 text-[#00DC82]' : scoreResult.confidence === 'Media' ? 'bg-[#FFB020]/20 text-[#FFB020]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                      {scoreResult.confidence}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted uppercase">{t.climateZone}</span>
                    <span className="text-sm font-bold text-premium">{scoreResult.climateZone}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted leading-relaxed italic">
                {getLegalDisclaimer(language)}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-32 h-32 rounded-3xl surface-2 border-2 border-[#00DC82]/30 flex items-center justify-center text-6xl font-heading font-bold text-premium shadow-2xl shadow-[#00DC82]/10">
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
          <section className="surface border rounded-3xl p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-premium">{t.capturedData}</h2>
              {cadastralRecord && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00DC82]/10 border border-[#00DC82]/20 text-[#00DC82] text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.cadastralVerified}
                </div>
              )}
            </div>

            {cadastralRecord && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{t.cadastralReference}</p>
                    <p className="text-sm font-mono font-bold text-[#00DC82] break-all">{cadastralRecord.cadastralReference}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{t.cadastralOfficialAddress}</p>
                    <p className="text-sm font-semibold text-premium">{cadastralRecord.address}</p>
                    {(cadastralRecord.floor || cadastralRecord.door) && (
                      <p className="text-[10px] font-bold text-[#00DC82] uppercase">
                        {cadastralRecord.floor && `${t.cadastralResultsFloor} ${cadastralRecord.floor}`}
                        {cadastralRecord.door && ` · ${t.cadastralResultsDoor} ${cadastralRecord.door}`}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{t.cadastralMunicipality}</p>
                    <p className="text-sm font-semibold text-premium">{cadastralRecord.municipality}, {cadastralRecord.province}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted tracking-wider">{t.cadastralDetailPropertyUse}</p>
                    <p className="text-sm font-semibold text-premium uppercase">{cadastralRecord.propertyUse || '---'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase text-muted">{t.cadastralResultsBuiltArea}</p>
                    <p className="text-sm font-bold text-premium">{cadastralRecord.surfaceBuiltM2 ? formatArea(cadastralRecord.surfaceBuiltM2, measurementSystem, language) : '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase text-muted">{t.wizardCatastroDetailYear}</p>
                    <p className="text-sm font-bold text-premium">{cadastralRecord.yearBuilt || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase text-muted">{t.cadastralDetailParticipationCoefficient}</p>
                    <p className="text-sm font-bold text-premium">{cadastralRecord.participationPct ? `${cadastralRecord.participationPct}%` : '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase text-muted">{t.cadastralDetailParcelReference}</p>
                    <p className="text-sm font-mono text-muted">{cadastralRecord.parcelReference || '---'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                [t.wizardSummaryType, formatValueLabel('propertyType', propertyData.propertyType, language)],
                [t.wizardSummaryOrientation, formatValueLabel('orientation', propertyData.orientation || 'unknown', language)],
                [t.wizardSummaryRoof, formatValueLabel('roofType', propertyData.roofType || 'unknown', language)],
                [t.wizardSummaryVentilation, formatValueLabel('ventilation', propertyData.ventilation || 'unknown', language)],
                [t.wizardSummaryHeating, formatValueLabel('heating', propertyData.heating || 'unknown', language)],
                [t.wizardSummaryCooling, formatValueLabel('cooling', propertyData.cooling || 'unknown', language)],
                [t.wizardSummaryAcs, formatValueLabel('waterHeating', propertyData.waterHeating || 'unknown', language)],
                [t.wizardSummaryHorizon, formatValueLabel('timeline', propertyData.timelineHorizon || 'unknown', language)],
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
                <h3 className="font-heading font-bold text-lg">{t.penalties}</h3>
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
                <p className="text-sm text-[#7A7A7A]">{t.noMajorPenalties}</p>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#00DC82] mb-4">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-heading font-bold text-lg">{t.strengths}</h3>
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
                <p className="text-sm text-[#7A7A7A]">{t.noStrengths}</p>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#FFB020] mb-4">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-lg">{t.missingData}</h3>
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
                <p className="text-sm text-[#7A7A7A]">{t.completeData}</p>
              )}
            </div>
          </div>

          {/* REGULATORY TIMELINE */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="font-heading font-bold text-3xl text-[#F0EDE8] mb-2">{language === 'en' ? 'Regulatory context' : language === 'de' ? 'Regulatorischer Kontext' : 'Contexto regulatorio'}</h2>
              <p className="text-[#7A7A7A] text-sm italic">{getLegalDisclaimer(language)}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REGULATORY_TIMELINE.map((n, i) => (
                <div key={i} className="bg-[#131313] border border-[#262626] rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 ${n.riskLevel === 'high' ? 'bg-[#EF4444]' : n.riskLevel === 'medium' ? 'bg-[#FFB020]' : 'bg-[#00DC82]'}`} />
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <span className="font-heading font-bold text-xl text-[#F0EDE8]">{n.year}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${n.status === 'current' || n.status === 'vigente' ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'bg-[#FFB020]/20 text-[#FFB020]'}`}>{n.dateLabel}</span>
                  </div>
                  <p className="font-bold text-sm text-[#F0EDE8] relative z-10">{n.title}</p>
                  <p className="text-xs text-[#7A7A7A] leading-relaxed relative z-10">{n.description}</p>
                  <p className="text-xs text-[#B8B8B8] leading-relaxed relative z-10">{n.impactOnUser}</p>
                  <p className="text-[10px] text-[#7A7A7A] relative z-10">{n.legalReference}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PREMIUM REPORT CTA */}
          <section className="bg-gradient-to-r from-[#00DC82]/20 to-[#FFB020]/20 border border-white/10 rounded-3xl p-8 text-center space-y-6">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F0EDE8]">{t.premiumReportTitle}</h2>
            <p className="text-[#7A7A7A] max-w-2xl mx-auto">
              {t.premiumReportCopy}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <PdfDownloadLink assessmentId={params.id} />
            </div>
            <p className="text-[10px] text-[#7A7A7A]/60">{t.dynamicPdf}</p>
          </section>

          {/* ATTACHMENTS */}
          <section className="surface border rounded-3xl p-6 lg:p-8">
            <div className="mb-5 flex items-center gap-2 text-premium">
              <FileText className="h-5 w-5 text-[#00DC82]" />
              <h2 className="font-heading text-2xl font-bold">{t.attachments}</h2>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-premium">{attachments.length}</p>
                <p className="text-[10px] font-semibold uppercase text-muted">{t.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-[#FFB020]">{ceeCount}</p>
                <p className="text-[10px] font-semibold uppercase text-muted">CEE/PDF</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-[#00DC82]">{exteriorCount + interiorCount}</p>
                <p className="text-[10px] font-semibold uppercase text-muted">{t.images}</p>
              </div>
            </div>
            <p className="mb-4 text-xs text-muted">
              {isDemo
                ? t.attachmentsDemoCopy
                : t.attachmentsRealCopy}
            </p>
            <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase">
              <span className="rounded-full bg-white/5 px-2 py-1 text-muted">{t.exterior}: {exteriorCount}</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-muted">{t.interior}: {interiorCount}</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-muted">CEE: {ceeCount}</span>
            </div>
            <AttachmentList assessmentId={params.id} initialAttachments={attachments} />
          </section>

          {/* SIMULATOR */}
          <section className="space-y-8">
             <div className="text-center">
              <h2 className="font-heading font-bold text-3xl text-[#F0EDE8] mb-2">{t.simulatorTitle}</h2>
              <p className="text-[#7A7A7A]">{t.simulatorCopy}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {scenarios.map(s => (
                <div key={s.id} className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 flex flex-col hover:border-[#00DC82]/30 transition group">
                  <h3 className="font-heading font-bold text-xl text-[#F0EDE8] mb-1">{s.title}</h3>
                  <p className="text-xs text-[#7A7A7A] mb-4">{s.objective}</p>
                  {s.description && <p className="text-xs text-[#B8B8B8] mb-4">{s.description}</p>}
                  <ul className="space-y-2 mb-6 flex-1">
                    {s.measures.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#7A7A7A]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00DC82] mt-0.5 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-[#262626] space-y-2">
                    <div className="flex justify-between gap-3 text-xs"><span className="text-[#7A7A7A]">{t.investment}:</span><span className="font-bold text-right">{s.estimatedCostRange}</span></div>
                    {s.costEstimate && (
                      <div className="rounded-xl border border-[#00DC82]/20 bg-[#00DC82]/5 p-3 text-xs">
                        <div className="flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">{t.indicativeRange}:</span>
                          <span className="font-bold text-[#00DC82] text-right">{formatEuroRange(s.costEstimate.minTotal, s.costEstimate.maxTotal, s.costEstimate.midTotal, { currency, language })}</span>
                        </div>
                        <div className="mt-1 flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">{t.confidence}:</span>
                          <span className="font-bold text-[#FFB020]">{s.costEstimate.confidence}</span>
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-[#7A7A7A]">{s.costEstimate.sourceSummary}</p>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 text-xs"><span className="text-[#7A7A7A]">{t.savings}:</span><span className="font-bold text-[#00DC82] text-right">{s.estimatedSavingsRange}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#7A7A7A]">{t.jump}:</span><span className="font-bold text-[#FFB020]">{s.expectedLetterImpact}</span></div>
                    {s.rationale && <p className="pt-2 text-[10px] leading-relaxed text-[#7A7A7A]">{s.rationale}</p>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-[#7A7A7A]">
              {COST_ESTIMATE_DISCLAIMER} Factores que pueden modificar el precio: superficie real de huecos, estado inicial, calidades, accesibilidad, ubicación, permisos, comunidad de propietarios, disponibilidad de materiales y visita técnica.
            </p>
          </section>

          {/* SUBSIDIES */}
          <section className="surface border rounded-3xl p-6 lg:p-8 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-2xl text-premium">{t.subsidiesTitle}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">{getLegalDisclaimer(language)}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {subsidies.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-heading text-base font-bold text-premium">{item.title}</h3>
                    <span className="rounded-full bg-[#00DC82]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#00DC82]">{item.scope}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                  <p className="mt-3 text-[10px] leading-relaxed text-[#FFB020]">{item.eligibilityDisclaimer}</p>
                </div>
              ))}
            </div>
          </section>

          <ProviderLeadSection assessmentId={params.id} zone={propertyData.zipcode} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
