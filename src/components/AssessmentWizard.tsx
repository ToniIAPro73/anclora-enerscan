'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { upload } from '@vercel/blob/client';
import { Bolt, Target, ShieldCheck, Building, UploadCloud, X, FileText, CheckCircle2, Info, Menu } from 'lucide-react';
import { CadastreSearch } from './CadastreSearch';
import type { CadastralMapFeature, CadastralMatch } from '@/lib/catastro/types';
import { mapCadastralMatchToWizardFields } from '@/lib/catastro/autofill';
import { mapMatchesToFeatures } from '@/lib/catastro/map-features';
import { getCoordinatesForLocation } from '@/lib/location/geocoding';
import { MAX_ATTACHMENTS, MAX_ATTACHMENT_SIZE, formatFileSize, isAllowedAttachment, sanitizeFilename } from '@/lib/attachments';
import { usePreferences } from './AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

const PropertyMap = dynamic(() => import('./PropertyMap'), { ssr: false, loading: () => <div className="w-full h-full min-h-[300px] bg-white/5 animate-pulse rounded-2xl" /> });

const DIRECT_UPLOAD_FALLBACK_LIMIT = 4 * 1024 * 1024;
const SELECTED_MAP_FEATURE_OFFSET = 0.00022;

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

function createSelectedMapFeature(lat: number, lng: number): CadastralMapFeature {
  const id = `selected-map-${lat.toFixed(6)}-${lng.toFixed(6)}`;
  return {
    id,
    label: 'Ubicación seleccionada',
    kind: 'address',
    center: { lat, lng },
    bounds: [
      [lat - SELECTED_MAP_FEATURE_OFFSET, lng - SELECTED_MAP_FEATURE_OFFSET],
      [lat + SELECTED_MAP_FEATURE_OFFSET, lng + SELECTED_MAP_FEATURE_OFFSET],
    ],
    selected: true,
    source: 'fallback',
  };
}

export default function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [confirmedMatch, setConfirmedMatch] = useState<CadastralMatch | null>(null);
  const [autofillNotice, setAutofillNotice] = useState<boolean>(false);
  const [areaNotice, setAreaNotice] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | undefined>();
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | undefined>();
  const [mapSourceLabel, setMapSourceLabel] = useState<string | undefined>();
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapResults, setMapResults] = useState<CadastralMatch[] | undefined>();
  const [selectedCadastralReference, setSelectedCadastralReference] = useState<string | undefined>();
  const [selectedMapFeature, setSelectedMapFeature] = useState<CadastralMapFeature | undefined>();
  const [isDataPanelCollapsed, setIsDataPanelCollapsed] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { dictionary: t, language, formatCurrency } = usePreferences();

  useEffect(() => {
    if (step !== 2) return;
    const resizeTimer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 260);
    return () => window.clearTimeout(resizeTimer);
  }, [isDataPanelCollapsed, step]);

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
    // Location fields
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationSource: z.enum(['catastro', 'manual', 'none']),
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
      locationSource: 'none',
    }
  });

  const objective = watch('objective');
  const lat = watch('latitude');
  const lng = watch('longitude');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleCadastreConfirm = useCallback((match: CadastralMatch) => {
    setConfirmedMatch(match);
    setSelectedCadastralReference(match.cadastralReference || match.parcelReference);
    const autofill = mapCadastralMatchToWizardFields(match);
    
    if (autofill.year) setValue('year', autofill.year);
    if (autofill.area) setValue('area', autofill.area);
    if (autofill.zipcode) setValue('zipcode', autofill.zipcode);
    if (autofill.propertyType) setValue('propertyType', autofill.propertyType);
    
    if (autofill.lat && autofill.lng) {
      setValue('latitude', autofill.lat);
      setValue('longitude', autofill.lng);
      setValue('locationSource', 'catastro');
      setMapCenter({ lat: autofill.lat, lng: autofill.lng });
      setMapZoom(18);
      setMapSourceLabel(t.wizardMapLocationCatastro);
    }

    setAutofillNotice(true);
    setAreaNotice(autofill.areaRequiresReview);
    setTimeout(() => {
      setAutofillNotice(false);
      setAreaNotice(false);
    }, 8000);
  }, [setValue, t.wizardMapLocationCatastro]);

  const handleMatchSelect = useCallback((match: CadastralMatch | null) => {
    setSelectedCadastralReference(match?.cadastralReference || match?.parcelReference);
    if (match?.lat && match?.lng) {
      setMapCenter({ lat: match.lat, lng: match.lng });
      setMapZoom(18);
      setMapSourceLabel(t.wizardMapLocationCatastro);
    }
  }, [t.wizardMapLocationCatastro]);

  const mapFeatures = useMemo(() => {
    const matches = confirmedMatch ? [confirmedMatch] : mapResults || [];
    const features = mapMatchesToFeatures(matches, selectedCadastralReference);
    if (selectedMapFeature && !features.some((feature) => feature.id === selectedMapFeature.id)) {
      features.push(selectedMapFeature);
    }
    return features;
  }, [confirmedMatch, mapResults, selectedCadastralReference, selectedMapFeature]);

  const handleLocationChange = useCallback((province: string, municipality: string) => {
    const coords = getCoordinatesForLocation(province, municipality);
    if (coords) {
      const feature = createSelectedMapFeature(coords.lat, coords.lng);
      setSelectedMapFeature(feature);
      setSelectedCadastralReference(feature.id);
      setMapCenter({ lat: coords.lat, lng: coords.lng });
      setMapZoom(coords.zoom || 14);
      setMapSourceLabel(municipality ? t.wizardMapLocationMunicipality : t.wizardMapLocationProvince);
    }
  }, [t.wizardMapLocationMunicipality, t.wizardMapLocationProvince]);

  const handleAddressChange = useCallback((address: { province: string, municipality: string, street: string, number: string, sigla: string, provinceCode?: string, municipalityCode?: string, streetCode?: string }) => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          province: address.province,
          municipality: address.municipality,
          street: address.street,
          number: address.number,
          sigla: address.sigla,
        });
        if (address.provinceCode) params.set('provinceCode', address.provinceCode);
        if (address.municipalityCode) params.set('municipalityCode', address.municipalityCode);
        if (address.streetCode) params.set('streetCode', address.streetCode);
        const res = await fetch(`/api/catastro/geocode?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          
          if (!data.lat || !data.lng || isNaN(data.lat) || isNaN(data.lng)) return;

          // Intelligent zoom based on geocoding accuracy
          let zoom = 18;
          if (data.accuracy === 'exact') zoom = 18;
          else if (data.accuracy === 'street') zoom = 17;
          else zoom = 14; // Municipality or province fallback
          
          setMapCenter({ lat: data.lat, lng: data.lng });
          setMapZoom(zoom);
          setMapSourceLabel(t.wizardMapLocationAddress);

          // Update form coordinates ONLY if we have a precise location (street or exact)
          // This prevents overwriting a manual precise marker with a municipality center
          if (data.accuracy === 'exact' || data.accuracy === 'street') {
            setValue('latitude', data.lat);
            setValue('longitude', data.lng);
            setValue('locationSource', 'catastro');
          }
        } else {
          console.warn('Geocode API returned non-ok response:', res.status);
        }
      } catch (err) {
        console.error('Auto-geocoding failed:', err);
      }
    }, 600);
  }, [t.wizardMapLocationAddress, geocodeTimeoutRef, setValue]);

  const handleSearchResults = useCallback((results: CadastralMatch[]) => {
    setMapResults(results);
    if (results.length > 0) setSelectedMapFeature(undefined);
    const validCoords = results.filter(r => r.lat && r.lng);
    if (validCoords.length > 1) {
      const lats = validCoords.map(r => r.lat!);
      const lngs = validCoords.map(r => r.lng!);
      setMapBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ]);
      setMapSourceLabel(t.wizardMapLocationAddress);
    } else if (validCoords.length === 1) {
      const match = validCoords[0];
      setSelectedCadastralReference(match.cadastralReference || match.parcelReference);
      setMapCenter({ lat: match.lat!, lng: match.lng! });
      setMapZoom(18);
      setMapSourceLabel(t.wizardMapLocationCatastro);
      
      // Update form coordinates for single match
      setValue('latitude', match.lat!);
      setValue('longitude', match.lng!);
      setValue('locationSource', 'catastro');
    }
  }, [t.wizardMapLocationAddress, t.wizardMapLocationCatastro, setValue]);

  const handleMapClick = useCallback((pos: { lat: number; lng: number }) => {
    const feature = createSelectedMapFeature(pos.lat, pos.lng);
    setSelectedMapFeature(feature);
    setSelectedCadastralReference(feature.id);
    setValue('latitude', pos.lat);
    setValue('longitude', pos.lng);
    setValue('locationSource', 'manual');
    setMapCenter(pos);
    setMapZoom(18);
    setMapSourceLabel(t.wizardMapLocationManual);
  }, [setValue, t.wizardMapLocationManual]);

  const handleParcelSelect = useCallback(async (plat: number, plng: number) => {
    const fallbackFeature = createSelectedMapFeature(plat, plng);
    setSelectedMapFeature(fallbackFeature);
    setSelectedCadastralReference(fallbackFeature.id);
    setMapCenter({ lat: plat, lng: plng });
    setMapZoom(18);
    setValue('latitude', plat);
    setValue('longitude', plng);
    setValue('locationSource', 'manual');
    setIsMapLoading(true);
    try {
      const res = await fetch('/api/catastro/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'coords', lat: plat, lng: plng }),
      });
      
      const data = await res.json();
      if (data.ok && data.data?.matches?.length > 0) {
        const matches = data.data.matches;
        setSelectedMapFeature(undefined);
        // If it's a direct match or a small list, we let the Search component handle the list
        // but we update the map viewport to center on the selected point
        setMapCenter({ lat: plat, lng: plng });
        setMapZoom(18);
        setMapSourceLabel(t.wizardMapLocationCatastro);
        
        // Update form coordinates
        setValue('latitude', plat);
        setValue('longitude', plng);
        setValue('locationSource', 'catastro');
        
        // Pass results back to the search component to show the list/detail
        handleSearchResults(matches);
      } else {
        setMapSourceLabel(t.wizardMapLocationManual);
      }
    } catch (err) {
      console.error('Parcel select failed:', err);
      setMapSourceLabel(t.wizardMapLocationManual);
    } finally {
      setIsMapLoading(false);
    }
  }, [t.wizardMapLocationCatastro, t.wizardMapLocationManual, handleSearchResults, setValue]);

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
        // The latitude/longitude/locationSource are already in 'data' because they are in the schema
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
    <div className={`mx-auto py-8 ${step === 2 ? 'w-full max-w-none px-4 sm:px-8 lg:px-12' : 'max-w-3xl px-4'}`}>
      <div className={`${step === 2 ? 'w-full mx-auto' : ''}`}>
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
          <div className="space-y-6 min-h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading font-bold text-2xl text-premium">{t.wizardPropertyData}</h2>
              {autofillNotice && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00DC82]/10 border border-[#00DC82]/20 text-[#00DC82] text-[10px] font-bold uppercase animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.wizardCatastroAutofillApplied}
                </div>
              )}
            </div>
            
            <div className="grid lg:grid-cols-12 gap-8 flex-1">
              <div className={`${isDataPanelCollapsed ? 'hidden' : 'lg:col-span-3'} space-y-6 overflow-y-auto max-h-[75vh] lg:max-h-none pr-2 custom-scrollbar`}>
                <CadastreSearch 
                  onConfirm={handleCadastreConfirm} 
                  onLocationChange={handleLocationChange} 
                  onMatchSelect={handleMatchSelect}
                  onAddressChange={handleAddressChange}
                  onResults={handleSearchResults}
                  externalResults={mapResults}
                  onReset={() => {
                    setMapResults(undefined);
                    setSelectedCadastralReference(undefined);
                  }}
                />

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
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-[#7A7A7A] uppercase">{t.wizardAreaLabel} ({t.unitArea})</label>
                    <input type="number" {...register('area', { valueAsNumber: true })} className="w-full bg-[#131313] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none" />
                    {areaNotice && (
                      <p className="text-[10px] font-bold text-[#FFB020] mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
                        <Info className="w-3 h-3" />
                        {t.wizardCatastroAreaBuiltNotice}
                      </p>
                    )}
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

                <div className="flex gap-4 pt-4 hidden lg:flex">
                  <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-full border border-[#262626] font-heading font-bold text-sm hover:bg-white/5 transition">{t.previous}</button>
                  <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition">{t.next}</button>
                </div>
              </div>

              <div className={`${isDataPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-9'} space-y-4 h-full flex flex-col min-h-[400px] transition-[grid-column] duration-300`}>
                <div className="flex flex-col h-full flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsDataPanelCollapsed((current) => !current)}
                        className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[#F0EDE8] hover:bg-white/10 transition"
                        aria-label={isDataPanelCollapsed ? 'Expandir panel de datos' : 'Contraer panel de datos'}
                        title={isDataPanelCollapsed ? 'Expandir panel de datos' : 'Contraer panel de datos'}
                      >
                        <Menu className="h-5 w-5" />
                      </button>
                      <span className="text-[10px] font-bold uppercase text-[#7A7A7A]">{t.wizardMapTitle}</span>
                    </div>
                    {mapSourceLabel && (
                      <span className="text-[9px] font-bold text-[#00DC82] uppercase px-2 py-0.5 rounded bg-[#00DC82]/10 border border-[#00DC82]/20">
                        {mapSourceLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative min-h-[400px]">
                    <PropertyMap 
                      lat={mapCenter?.lat || lat} 
                      lng={mapCenter?.lng || lng} 
                      zoom={mapZoom}
                      bounds={mapBounds}
                      onPositionChange={handleMapClick}
                      onParcelSelect={handleParcelSelect}
                      features={mapFeatures}
                      onFeatureSelect={(feature) => {
                        setSelectedCadastralReference(feature.cadastralReference || feature.parcelReference || feature.id);
                        const match = (mapResults || []).find((item) =>
                          item.cadastralReference === feature.cadastralReference ||
                          item.parcelReference === feature.parcelReference
                        );
                        if (match) handleMatchSelect(match);
                      }}
                      isLoading={isMapLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 lg:hidden">
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
    </div>
  );
}
