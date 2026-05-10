'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Bolt, Target, ShieldCheck, Building, UploadCloud, X, FileText } from 'lucide-react';
import { MAX_ATTACHMENTS, MAX_ATTACHMENT_SIZE, formatFileSize, isAllowedAttachment } from '@/lib/attachments';
import { usePreferences } from './AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

const assessmentSchema = z.object({
  objective: z.string().min(1, "Selecciona un objetivo"),
  propertyType: z.string().min(1, "Selecciona el tipo de inmueble"),
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
    error: "Debes aceptar el carácter orientativo"
  }),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

export default function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const { dictionary: t, language } = usePreferences();

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

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)));
          files.forEach((file) => formData.append('attachments', file));
          return formData;
        })(),
      });
      const result = await response.json();
      if (result.id) {
        router.push(`/assessment/${result.id}`);
      } else if (result.error) {
        setFileError(result.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#00DC82] font-heading font-semibold uppercase tracking-wider">Paso {step} de 5</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-[#00DC82]' : 'bg-[#262626]'}`} />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: OBJECTIVE */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-premium">{t.wizardTitle}</h2>
            <div className="grid gap-4">
              {[
                { id: 'current_state', title: 'Conocer situación actual', desc: 'Descubre tu clasificación orientativa.', icon: Target },
                { id: 'target_letter', title: 'Alcanzar una letra concreta', desc: 'Define tu meta y obtén un plan.', icon: Bolt },
                { id: 'sale_rent', title: 'Preparar venta o alquiler', desc: 'Incrementa el valor de tu inmueble.', icon: Building },
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
            <h2 className="font-heading font-bold text-2xl text-premium">Datos de la vivienda</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Tipo de inmueble</label>
                <select {...register('propertyType')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="flat">Piso / Apartamento</option>
                  <option value="house">Casa unifamiliar</option>
                  <option value="terraced">Adosado</option>
                  <option value="penthouse">Ático</option>
                  <option value="ground_floor">Planta baja</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Año de construcción</label>
                <input type="number" {...register('year', { valueAsNumber: true })} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Superficie útil (m²)</label>
                <input type="number" {...register('area', { valueAsNumber: true })} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Código Postal</label>
                <input type="text" {...register('zipcode')} placeholder="28001" className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Orientación principal</label>
                <select {...register('orientation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="north">Norte</option>
                  <option value="south">Sur</option>
                  <option value="east">Este</option>
                  <option value="west">Oeste</option>
                  <option value="mixed">Mixta</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Tipo de cubierta</label>
                <select {...register('roofType')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="flat">Plana</option>
                  <option value="pitched">Inclinada</option>
                  <option value="shared">Comunitaria / compartida</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">Siguiente</button>
            </div>
          </div>
        )}

        {/* STEP 3: ENVELOPE & WINDOWS */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Envolvente</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Tipo de ventanas</label>
                <select {...register('windows')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="single">Cristal Simple</option>
                  <option value="double">Doble Cristal</option>
                  <option value="triple">Triple / Bajo emisivo</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Aislamiento de Fachada</label>
                <select {...register('facadeInsulation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">Ninguno</option>
                  <option value="partial">Parcial / Básico</option>
                  <option value="good">Bueno (SATE / Inyección)</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Aislamiento de Cubierta</label>
                <select {...register('roofInsulation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">Ninguno</option>
                  <option value="partial">Parcial</option>
                  <option value="good">Bueno</option>
                  <option value="unknown">No lo sé / No aplica</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Ventilación</label>
                <select {...register('ventilation')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="natural">Natural</option>
                  <option value="mechanical">Mecánica</option>
                  <option value="heat_recovery">Mecánica con recuperador de calor</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">Siguiente</button>
            </div>
          </div>
        )}

        {/* STEP 4: SYSTEMS */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Instalaciones</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Sistema de calefacción</label>
                <select {...register('heating')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="gas">Caldera de Gas</option>
                  <option value="electric">Radiadores Eléctricos</option>
                  <option value="heat_pump">Aerotermia / Bomba de calor</option>
                  <option value="biomass">Biomasa / Pellets</option>
                  <option value="none">Ninguno</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Aire Acondicionado</label>
                <select {...register('cooling')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">Ninguno</option>
                  <option value="split">Split</option>
                  <option value="central">Centralizado por conductos</option>
                  <option value="heat_pump">Aerotermia</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Agua Caliente Sanitaria (ACS)</label>
                <select {...register('waterHeating')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="gas">Calentador/Caldera de Gas</option>
                  <option value="electric">Termo Eléctrico</option>
                  <option value="heat_pump">Aerotermia</option>
                  <option value="solar">Apoyo Solar Térmico</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Renovables</label>
                <select {...register('renewables')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="none">Ninguna</option>
                  <option value="photovoltaic">Paneles Solares (Fotovoltaica)</option>
                  <option value="solar_thermal">Solar Térmica</option>
                  <option value="both">Ambas</option>
                  <option value="unknown">No lo sé</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">Siguiente</button>
            </div>
          </div>
        )}

        {/* STEP 5: ATTACHMENTS & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Presupuesto y Confirmación</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Presupuesto estimado para mejoras</label>
              <select {...register('budgetRange')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                <option value="low">Bajo ({"<"} 3.000€)</option>
                <option value="medium">Medio (3.000€ - 10.000€)</option>
                <option value="high">Alto ({">"} 10.000€)</option>
                <option value="unknown">No lo tengo claro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Horizonte temporal deseado</label>
              <select {...register('timelineHorizon')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                <option value="immediate">Inmediato</option>
                <option value="six_months">Próximos 6 meses</option>
                <option value="one_year">Antes de 12 meses</option>
                <option value="three_years">1-3 años</option>
                <option value="unknown">No definido</option>
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
                <span className="font-heading text-sm font-bold text-premium">Adjunta fotos, PDF, DOCX o Markdown</span>
                <span className="text-xs text-muted">Arrastra archivos o selecciona hasta {MAX_ATTACHMENTS}. Máximo {formatFileSize(MAX_ATTACHMENT_SIZE)} por archivo.</span>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.md"
                  className="sr-only"
                  onChange={(event) => event.target.files && addFiles(event.target.files)}
                />
              </label>
              {fileError && <p className="mt-3 text-xs text-[#EF4444]">{fileError}</p>}
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
                  Acepto que Anclora EnergyScan realice una estimación orientativa. {getLegalDisclaimer(language)}
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms.message}</p>}
            </div>

            <div className="p-4 rounded-xl bg-[#FFB020]/5 border border-[#FFB020]/20 space-y-3">
              <div className="flex items-center gap-2 text-[#FFB020]">
                <ShieldCheck className="w-5 h-5" />
                <p className="font-heading font-bold text-sm">Información legal importante</p>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed">
                Este diagnóstico no sustituye la inspección de un técnico competente. Las letras generadas son una aproximación basada en el año de construcción y los sistemas declarados.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando...' : 'Obtener resultado'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
