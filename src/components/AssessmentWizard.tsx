'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { Bolt, Target, ShieldCheck, Building, UploadCloud, X, FileText } from 'lucide-react';
import { CadastreSearch } from './CadastreSearch';
import type { CadastralMatch } from '@/lib/catastro/types';
import { MAX_ATTACHMENTS, MAX_ATTACHMENT_SIZE, formatFileSize, isAllowedAttachment, sanitizeFilename } from '@/lib/attachments';
import { usePreferences } from './AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

const DIRECT_UPLOAD_FALLBACK_LIMIT = 4 * 1024 * 1024;

const fieldSteps: Partial<Record<string, number>> = {
  objective: 1,
  propertyType: 2,
  year: 2,
  area: 2,
  zipcode: 2,
  orientation: 2,
  roofType: 2,
  windows: 3,
  facadeInsulation: 3,
  roofInsulation: 3,
  ventilation: 3,
  heating: 4,
  cooling: 4,
  waterHeating: 4,
  renewables: 4,
  budgetRange: 5,
  timelineHorizon: 5,
  targetLetter: 5,
  acceptTerms: 5,
};

type UploadedAttachment = {
  name: string;
  type: string;
  size: number;
  pathname: string;
  url: string;
};

export default function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [confirmedMatch, setConfirmedMatch] = useState<CadastralMatch | null>(null);
  const { dictionary: t, language, formatCurrency } = usePreferences();

  const assessmentSchema = useMemo(() => z.object({
    objective: z.string().min(1, t.wizardSelectObjective),
    propertyType: z.string().min(1, t.wizardSelectPropertyType),
    year: z.number().min(1800).max(new Date().getFullYear()),
    area: z.number().min(1),
    zipcode: z.string().min(5),
    orientation: z.string().min(1),
    roofType: z.string().min(1),
    heating: z.string().min(1),
    cooling: z.string().min(1),
    waterHeating: z.string().min(1),
    ventilation: z.string().min(1),
    windows: z.string().min(1),
    renewables: z.string().min(1),
    facadeInsulation: z.string().optional(),
    roofInsulation: z.string().optional(),
    budgetRange: z.string().optional(),
    timelineHorizon: z.string().optional(),
    targetLetter: z.string().optional(),
    acceptTerms: z.literal(true, {
      error: t.wizardAcceptTermsError
    }),
  }), [t]);

  type AssessmentFormValues = z.infer<typeof assessmentSchema>;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      objective: 'current_state',
      propertyType: 'flat',
      year: 1990,
      area: 80,
      zipcode: '',
      orientation: 'unknown',
      roofType: 'unknown',
      heating: 'gas',
      cooling: 'none',
      waterHeating: 'gas',
      ventilation: 'natural',
      windows: 'double',
      renewables: 'none',
      facadeInsulation: 'unknown',
      roofInsulation: 'unknown',
      budgetRange: 'medium',
      timelineHorizon: 'one_year',
      targetLetter: 'A',
    }
  });

  const objective = watch('objective');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleCadastreConfirm = (match: CadastralMatch) => {
    setConfirmedMatch(match);
    if (match.yearBuilt) setValue('year', match.yearBuilt);
    if (match.surfaceBuiltM2) setValue('area', match.surfaceBuiltM2);
    if (match.postalCode) setValue('zipcode', match.postalCode);
  };

  const addFiles = (incoming: FileList | File[]) => {
    setFileError(null);
    const nextFiles = [...files];
    for (const file of Array.from(incoming)) {
      if (nextFiles.length >= MAX_ATTACHMENTS) {
        setFileError(`Máximo ${MAX_ATTACHMENTS} archivos por valoración.`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setFileError(`${file.name} supera el límite de ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
        continue;
      }
      if (!isAllowedAttachment(file)) {
        setFileError(`${file.name} no es un tipo admitido.`);
        continue;
      }
      nextFiles.push(file);
    }
    setFiles(nextFiles);
  };

  const parseAssessmentResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const message = await response.text();
    return {
      error: response.ok ? undefined : message || `Error ${response.status} al crear la valoración`,
    };
  };

  const uploadAttachments = async (): Promise<UploadedAttachment[]> => {
    const uploaded: UploadedAttachment[] = [];
    const batchId = crypto.randomUUID();

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const pathname = `assessment-drafts/${batchId}/${index + 1}-${sanitizeFilename(file.name)}`;
      const blob = await upload(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/blob/upload',
        contentType: file.type || 'application/octet-stream',
        multipart: file.size > 4.5 * 1024 * 1024,
        clientPayload: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        }),
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(((index + percentage / 100) / files.length) * 100));
        },
      });

      uploaded.push({
        name: file.name,
        type: file.type || blob.contentType || 'application/octet-stream',
        size: file.size,
        pathname: blob.pathname,
        url: blob.url,
      });
    }

    return uploaded;
  };

  const submitAssessmentJson = async (data: AssessmentFormValues, uploadedAttachments: UploadedAttachment[]) => {
    return fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        uploadedAttachments,
        cadastralData: confirmedMatch,
      }),
    });
  };

  const submitAssessmentMultipart = async (data: AssessmentFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    files.forEach((file) => formData.append('attachments', file));
    if (confirmedMatch) {
      formData.append('cadastralData', JSON.stringify(confirmedMatch));
    }

    return fetch('/api/assessment', {
      method: 'POST',
      body: formData,
    });
  };

  const canUseDirectUploadFallback = () =>
    files.reduce((total, file) => total + file.size, 0) <= DIRECT_UPLOAD_FALLBACK_LIMIT;

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsSubmitting(true);
    setFileError(null);
    setFormError(null);
    setUploadProgress(files.length > 0 ? 0 : null);

    try {
      let response: Response;
      if (files.length === 0) {
        response = await submitAssessmentJson(data, []);
      } else {
        try {
          const uploadedAttachments = await uploadAttachments();
          response = await submitAssessmentJson(data, uploadedAttachments);
        } catch (uploadError) {
          if (!canUseDirectUploadFallback()) throw uploadError;
          setUploadProgress(null);
          response = await submitAssessmentMultipart(data);
        }
      }

      const result = await parseAssessmentResponse(response);
      if (result.id) {
        router.push(`/assessment/${result.id}`);
      } else if (result.error) {
        setFileError(result.error);
        setIsSubmitting(false);
        setUploadProgress(null);
      } else {
        setFileError('No se pudo completar la valoración. Inténtalo de nuevo.');
        setIsSubmitting(false);
        setUploadProgress(null);
      }
    } catch (error) {
      console.error(error);
      setFileError(error instanceof Error ? error.message : 'No se pudo completar la valoración');
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const onInvalid = (validationErrors: FieldErrors<AssessmentFormValues>) => {
    const firstField = Object.keys(validationErrors)[0] as keyof AssessmentFormValues | undefined;
    if (firstField && fieldSteps[firstField]) {
      setStep(fieldSteps[firstField]);
    }
    const firstError = firstField ? validationErrors[firstField] : undefined;
    setFormError(
      typeof firstError?.message === 'string'
        ? firstError.message
        : t.wizardValidationSummary
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#00DC82] font-heading font-semibold uppercase tracking-wider">{t.wizardStep} {step} {t.wizardOf} 5</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-[#00DC82]' : 'bg-[#262626]'}`} />
            ))}
          </div>
        </div>
      </div>

      {formError && (
        <div className="mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {/* STEP 1: OBJECTIVE */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-premium">{t.wizardTitle}</h2>
            <div className="grid gap-4">
              {[
                { id: 'current_state', title: t.wizardObjectiveCurrent, desc: t.wizardObjectiveCurrentDesc, icon: Target },
                { id: 'target_letter', title: t.wizardObjectiveTarget, desc: t.wizardObjectiveTargetDesc, icon: Bolt },
                { id: 'sale_rent', title: t.wizardObjectiveSale, desc: t.wizardObjectiveSaleDesc, icon: Building },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setValue('objective', opt.id); nextStep(); }}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition ${objective === opt.id ? 'border-[#00DC82] bg-[#00DC82]/5' : 'surface border hover:border-[#7A7A7A]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${objective === opt.id ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'bg-white/5 text-[#7A7A7A]'}`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-premium">{opt.title}</p>
                    <p className="text-xs text-muted mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: BASIC DATA */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-premium">{t.wizardPropertyData}</h2>
            
            <CadastreSearch onConfirm={handleCadastreConfirm} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardPropertyType}</label>
                <select {...register('propertyType')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="flat">{t.wizardPropertyTypeFlat}</option>
                  <option value="house">{t.wizardPropertyTypeHouse}</option>
                  <option value="terraced">{t.wizardPropertyTypeTerraced}</option>
                  <option value="penthouse">{t.wizardPropertyTypePenthouse}</option>
                  <option value="ground_floor">{t.wizardPropertyTypeGroundFloor}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardConstructionYear}</label>
                <input type="number" {...register('year', { valueAsNumber: true })} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardAreaLabel} ({t.unitArea})</label>
                <input type="number" {...register('area', { valueAsNumber: true })} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardZipcode}</label>
                <input type="text" {...register('zipcode')} placeholder="28001" className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardOrientationLabel}</label>
                <select {...register('orientation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="north">{t.wizardOrientationNorth}</option>
                  <option value="south">{t.wizardOrientationSouth}</option>
                  <option value="east">{t.wizardOrientationEast}</option>
                  <option value="west">{t.wizardOrientationWest}</option>
                  <option value="mixed">{t.wizardOrientationMixed}</option>
                  <option value="unknown">{t.wizardOrientationUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardRoofTypeLabel}</label>
                <select {...register('roofType')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="flat">{t.wizardRoofTypeFlat}</option>
                  <option value="pitched">{t.wizardRoofTypePitched}</option>
                  <option value="shared">{t.wizardRoofTypeShared}</option>
                  <option value="unknown">{t.wizardRoofTypeUnknown}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">{t.previous}</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">{t.next}</button>
            </div>
          </div>
        )}

        {/* STEP 3: ENVELOPE & WINDOWS */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">{t.wizardEnvelope}</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardWindowsLabel}</label>
                <select {...register('windows')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="single">{t.wizardWindowsSingle}</option>
                  <option value="double">{t.wizardWindowsDouble}</option>
                  <option value="triple">{t.wizardWindowsTriple}</option>
                  <option value="unknown">{t.wizardWindowsUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardFacadeInsulationLabel}</label>
                <select {...register('facadeInsulation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">{t.wizardInsulationNone}</option>
                  <option value="partial">{t.wizardInsulationPartial}</option>
                  <option value="good">{t.wizardInsulationGood}</option>
                  <option value="unknown">{t.wizardInsulationUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardRoofInsulationLabel}</label>
                <select {...register('roofInsulation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">{t.wizardInsulationNone}</option>
                  <option value="partial">{t.wizardInsulationPartial}</option>
                  <option value="good">{t.wizardInsulationGood}</option>
                  <option value="unknown">{t.wizardInsulationUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardVentilationLabel}</label>
                <select {...register('ventilation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="natural">{t.wizardVentilationNatural}</option>
                  <option value="mechanical">{t.wizardVentilationMechanical}</option>
                  <option value="heat_recovery">{t.wizardVentilationHeatRecovery}</option>
                  <option value="unknown">{t.wizardVentilationUnknown}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">{t.previous}</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">{t.next}</button>
            </div>
          </div>
        )}

        {/* STEP 4: SYSTEMS */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">{t.wizardSystems}</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardHeatingLabel}</label>
                <select {...register('heating')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="gas">{t.wizardHeatingGas}</option>
                  <option value="electric">{t.wizardHeatingElectric}</option>
                  <option value="heat_pump">{t.wizardHeatingHeatPump}</option>
                  <option value="biomass">{t.wizardHeatingBiomass}</option>
                  <option value="none">{t.wizardHeatingNone}</option>
                  <option value="unknown">{t.wizardHeatingUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardCoolingLabel}</label>
                <select {...register('cooling')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">{t.wizardCoolingNone}</option>
                  <option value="split">{t.wizardCoolingSplit}</option>
                  <option value="central">{t.wizardCoolingCentral}</option>
                  <option value="heat_pump">{t.wizardCoolingHeatPump}</option>
                  <option value="unknown">{t.wizardCoolingUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardWaterHeatingLabel}</label>
                <select {...register('waterHeating')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="gas">{t.wizardWaterHeatingGas}</option>
                  <option value="electric">{t.wizardWaterHeatingElectric}</option>
                  <option value="heat_pump">{t.wizardWaterHeatingHeatPump}</option>
                  <option value="solar">{t.wizardWaterHeatingSolar}</option>
                  <option value="unknown">{t.wizardWaterHeatingUnknown}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardRenewablesLabel}</label>
                <select {...register('renewables')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">{t.wizardRenewablesNone}</option>
                  <option value="photovoltaic">{t.wizardRenewablesPhotovoltaic}</option>
                  <option value="solar_thermal">{t.wizardRenewablesSolarThermal}</option>
                  <option value="both">{t.wizardRenewablesBoth}</option>
                  <option value="unknown">{t.wizardRenewablesUnknown}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">{t.previous}</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">{t.next}</button>
            </div>
          </div>
        )}

        {/* STEP 5: ATTACHMENTS & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">{t.wizardBudgetConfirm}</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardBudgetLabel}</label>
              <select {...register('budgetRange')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                <option value="low">{t.wizardBudgetLow} ({"<"} {formatCurrency(3000, { maximumFractionDigits: 0 })})</option>
                <option value="medium">{t.wizardBudgetMedium} ({formatCurrency(3000, { maximumFractionDigits: 0 })} - {formatCurrency(10000, { maximumFractionDigits: 0 })})</option>
                <option value="high">{t.wizardBudgetHigh} ({">"} {formatCurrency(10000, { maximumFractionDigits: 0 })})</option>
                <option value="unknown">{t.wizardBudgetUnknown}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardTimelineLabel}</label>
              <select {...register('timelineHorizon')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                <option value="immediate">{t.wizardTimelineImmediate}</option>
                <option value="six_months">{t.wizardTimelineSixMonths}</option>
                <option value="one_year">{t.wizardTimelineOneYear}</option>
                <option value="three_years">{t.wizardTimelineThreeYears}</option>
                <option value="unknown">{t.wizardTimelineUnknown}</option>
              </select>
            </div>

            <div
              className="rounded-2xl border border-dashed border-[#00DC82]/35 bg-[#00DC82]/5 p-5"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
            >
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                <UploadCloud className="h-8 w-8 text-[#00DC82]" />
                <span className="font-heading text-sm font-bold text-premium">{t.attachmentsHelp}</span>
                <span className="text-xs text-muted">{t.attachmentsLimit}</span>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.md"
                  className="sr-only"
                  onChange={(event) => event.target.files && addFiles(event.target.files)}
                />
              </label>
              {fileError && <p className="mt-3 text-xs text-[#EF4444]">{fileError}</p>}
              {uploadProgress !== null && (
                <div className="mt-3 space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#00DC82]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted">{t.processing} {uploadProgress}%</p>
                </div>
              )}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <span className="flex items-center gap-2 text-muted"><FileText className="h-4 w-4 text-[#00DC82]" /> {file.name} ({formatFileSize(file.size)})</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))} className="text-muted hover:text-[#EF4444]" aria-label="Eliminar archivo">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#262626]">
              <div className="flex items-start gap-3">
                <input type="checkbox" id="acceptTerms" {...register('acceptTerms')} className="mt-1 accent-[#00DC82]" />
                <label htmlFor="acceptTerms" className="text-sm text-[#7A7A7A] leading-tight cursor-pointer">
                  {t.submitLegal} {getLegalDisclaimer(language)}
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms.message}</p>}
            </div>

            <div className="p-4 rounded-xl bg-[#FFB020]/5 border border-[#FFB020]/20 space-y-3">
              <div className="flex items-center gap-2 text-[#FFB020]">
                <ShieldCheck className="w-5 h-5" />
                <p className="font-heading font-bold text-sm">{t.importantLegal}</p>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed">
                {t.importantLegalCopy}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">{t.previous}</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
              >
                {isSubmitting ? t.processing : t.getResult}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
