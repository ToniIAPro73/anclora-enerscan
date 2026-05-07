'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Home, Bolt, Check, ArrowRight, ArrowLeft, Target, ShieldCheck, Building, Thermometer, Sun, Wind } from 'lucide-react';

const assessmentSchema = z.object({
  objective: z.string().min(1, "Selecciona un objetivo"),
  propertyType: z.string().min(1, "Selecciona el tipo de inmueble"),
  year: z.number().min(1900).max(new Date().getFullYear()),
  area: z.number().min(1),
  zipcode: z.string().min(5),
  heating: z.string().min(1),
  cooling: z.string().min(1),
  waterHeating: z.string().min(1),
  windows: z.string().min(1),
  renewables: z.string().min(1),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

export default function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      objective: '',
      propertyType: 'piso',
      year: 1990,
      area: 80,
      zipcode: '',
      heating: 'gas',
      cooling: 'none',
      waterHeating: 'gas',
      windows: 'simple',
      renewables: 'none',
    }
  });

  const objective = watch('objective');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.id) {
        router.push(`/assessment/${result.id}`);
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#00DC82] font-heading font-semibold uppercase tracking-wider">Paso {step} de 4</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-[#00DC82]' : 'bg-[#262626]'}`} />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: OBJECTIVE */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">¿Cuál es tu objetivo?</h2>
            <div className="grid gap-4">
              {[
                { id: 'know', title: 'Conocer situación actual', desc: 'Descubre tu clasificación orientativa.', icon: Target },
                { id: 'target', title: 'Alcanzar una letra concreta', desc: 'Define tu meta y obtén un plan.', icon: Bolt },
                { id: 'sell', title: 'Preparar venta o alquiler', desc: 'Incrementa el valor de tu inmueble.', icon: Building },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setValue('objective', opt.id); nextStep(); }}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition ${objective === opt.id ? 'border-[#00DC82] bg-[#00DC82]/5' : 'border-[#262626] bg-[#131313] hover:border-[#7A7A7A]'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${objective === opt.id ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'bg-white/5 text-[#7A7A7A]'}`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-[#F0EDE8]">{opt.title}</p>
                    <p className="text-xs text-[#7A7A7A] mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: BASIC DATA */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Datos de la vivienda</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Tipo de inmueble</label>
                <select {...register('propertyType')} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none">
                  <option value="piso">Piso / Apartamento</option>
                  <option value="unifamiliar">Casa unifamiliar</option>
                  <option value="adosado">Adosado</option>
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
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">Siguiente</button>
            </div>
          </div>
        )}

        {/* STEP 3: SYSTEMS */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Instalaciones</h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Sistema de calefacción</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gas', label: 'Gas Natural' },
                    { id: 'electric', label: 'Eléctrico' },
                    { id: 'aerothermia', label: 'Aerotermia' },
                    { id: 'none', label: 'Ninguno' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setValue('heating', opt.id)}
                      className={`p-3 rounded-xl border text-sm transition ${watch('heating') === opt.id ? 'border-[#00DC82] bg-[#00DC82]/5' : 'border-[#262626] bg-[#131313]'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Tipo de ventanas</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'simple', label: 'Cristal Simple' },
                    { id: 'doble', label: 'Doble Cristal' },
                    { id: 'triple', label: 'Triple / Bajo emisivo' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setValue('windows', opt.id)}
                      className={`p-3 rounded-xl border text-sm transition ${watch('windows') === opt.id ? 'border-[#00DC82] bg-[#00DC82]/5' : 'border-[#262626] bg-[#131313]'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">Anterior</button>
              <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">Siguiente</button>
            </div>
          </div>
        )}

        {/* STEP 4: RENEWABLES, ATTACHMENTS & SUBMIT */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-heading font-bold text-2xl text-[#F0EDE8]">Energías renovables y adjuntos</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7A7A7A] uppercase">Presencia de renovables</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Ninguna' },
                  { id: 'solar', label: 'Solar Térmica' },
                  { id: 'fv', label: 'Fotovoltaica' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setValue('renewables', opt.id)}
                    className={`p-3 rounded-xl border text-sm transition ${watch('renewables') === opt.id ? 'border-[#00DC82] bg-[#00DC82]/5' : 'border-[#262626] bg-[#131313]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase block">Fotos de la vivienda (Opcional)</label>
                <div className="border-2 border-dashed border-[#262626] rounded-xl p-4 text-center hover:border-[#7A7A7A] transition cursor-pointer">
                  <input type="file" multiple className="hidden" id="photos-upload" />
                  <label htmlFor="photos-upload" className="text-xs text-[#7A7A7A] cursor-pointer">Haz clic para subir fotos</label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7A7A] uppercase block">Certificado CEE PDF (Opcional)</label>
                <div className="border-2 border-dashed border-[#262626] rounded-xl p-4 text-center hover:border-[#7A7A7A] transition cursor-pointer">
                  <input type="file" className="hidden" id="cee-upload" />
                  <label htmlFor="cee-upload" className="text-xs text-[#7A7A7A] cursor-pointer">Haz clic para subir tu CEE</label>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFB020]/5 border border-[#FFB020]/20 space-y-3">
              <div className="flex items-center gap-2 text-[#FFB020]">
                <ShieldCheck className="w-5 h-5" />
                <p className="font-heading font-bold text-sm">Información legal importante</p>
              </div>
              <p className="text-xs text-[#7A7A7A] leading-relaxed">
                Al enviar estos datos, aceptas que EnerScan realice una estimación orientativa. Este prediagnóstico no tiene validez legal ni administrativa y no sustituye al Certificado de Eficiencia Energética oficial (CEE).
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
