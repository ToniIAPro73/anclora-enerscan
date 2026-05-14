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
import type { EnergyCertificateCEE, RehabBudgetAnalysis } from '@/lib/ingestion/types';

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

type ImportState<T> = {
  fileName?: string;
  data?: T;
  warnings: string[];
  error?: string;
  status: 'idle' | 'processing' | 'ready' | 'failed';
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
  const [ceeImport, setCeeImport] = useState<ImportState<EnergyCertificateCEE>>({ status: 'idle', warnings: [] });
  const [ceeDetailsOpen, setCeeDetailsOpen] = useState(false);
  const [ceeAppliedNotice, setCeeAppliedNotice] = useState(false);
  const [budgetImport, setBudgetImport] = useState<ImportState<RehabBudgetAnalysis>>({ status: 'idle', warnings: [] });
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

  const addAttachmentFile = (file: File) => {
    setFiles((current) => {
      if (current.some((item) => item.name === file.name && item.size === file.size)) return current;
      if (current.length >= MAX_ATTACHMENTS) return current;
      return [...current, file];
    });
  };

  const analyzeCeeFile = async (file: File) => {
    setCeeImport({ status: 'processing', fileName: file.name, warnings: [] });
    addAttachmentFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/ingestion/cee/analyze', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo analizar el CEE');
      setCeeImport({
        status: 'ready',
        fileName: file.name,
        data: result.certificate,
        warnings: result.warnings || [],
      });
      setCeeAppliedNotice(false);
    } catch (error) {
      setCeeImport({
        status: 'failed',
        fileName: file.name,
        warnings: [],
        error: error instanceof Error ? error.message : 'No se pudo analizar el CEE',
      });
    }
  };

  const applyCeeData = () => {
    const certificate = ceeImport.data;
    if (!certificate) return;
    if (certificate.yearBuilt) setValue('year', certificate.yearBuilt);
    if (certificate.usefulAreaM2 || certificate.builtAreaM2) setValue('area', Math.round(certificate.usefulAreaM2 || certificate.builtAreaM2 || 0));
    if (certificate.postalCode) setValue('zipcode', certificate.postalCode);
    if (certificate.globalLetter) setValue('targetLetter', certificate.globalLetter);
    setAreaNotice(Boolean(certificate.builtAreaM2 && !certificate.usefulAreaM2));
    setCeeAppliedNotice(true);
  };

  const analyzeBudgetFile = async (file: File) => {
    setBudgetImport({ status: 'processing', fileName: file.name, warnings: [] });
    addAttachmentFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (ceeImport.data?.globalLetter) formData.append('currentLetter', ceeImport.data.globalLetter);
      if (ceeImport.data?.nonRenewableEPKwhM2Year) formData.append('currentNonRenewableEP', String(ceeImport.data.nonRenewableEPKwhM2Year));
      if (ceeImport.data?.emissionsKgCO2M2Year) formData.append('currentEmissions', String(ceeImport.data.emissionsKgCO2M2Year));
      if (ceeImport.data?.usefulAreaM2) formData.append('usefulAreaM2', String(ceeImport.data.usefulAreaM2));
      const target = watch('targetLetter');
      if (target) formData.append('targetLetter', target);
      formData.append('propertyType', watch('propertyType'));
      const response = await fetch('/api/ingestion/budget/analyze', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo analizar el presupuesto');
      setBudgetImport({
        status: 'ready',
        fileName: file.name,
        data: result.budget,
        warnings: result.warnings || [],
      });
    } catch (error) {
      setBudgetImport({
        status: 'failed',
        fileName: file.name,
        warnings: [],
        error: error instanceof Error ? error.message : 'No se pudo analizar el presupuesto',
      });
    }
  };

  const formatCeeMetric = (metric?: { value?: number; letter?: string; unit?: string }) => {
    if (!metric || (metric.value === undefined && !metric.letter)) return '---';
    return `${metric.value ?? '---'} ${metric.unit || ''}${metric.letter ? ` · ${metric.letter}` : ''}`.trim();
  };

  const renderMetricRows = (
    title: string,
    partial?: EnergyCertificateCEE['extractedSections'] extends infer T
      ? T extends { indicators?: infer I }
        ? I extends Record<string, infer M>
          ? M
          : never
        : never
      : never
  ) => {
    if (!partial) return null;
    const rows = [
      [t.wizardCeeDetailTotal, partial.total],
      [t.wizardCeeDetailHeating, partial.heating],
      [t.wizardCeeDetailCooling, partial.cooling],
      [t.wizardCeeDetailDhw, partial.dhw],
      [t.wizardCeeDetailLighting, partial.lighting],
    ].filter(([, value]) => value);

    if (rows.length === 0) return null;
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <h4 className="mb-2 text-xs font-bold uppercase text-[#00DC82]">{title}</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-white/5 p-2">
              <p className="text-[10px] font-bold uppercase text-muted">{label as string}</p>
              <p className="text-xs font-bold text-premium">{formatCeeMetric(value as { value?: number; letter?: string; unit?: string })}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCeeDetailsModal = () => {
    const certificate = ceeImport.data;
    if (!ceeDetailsOpen || !certificate) return null;
    const sections = certificate.extractedSections;
    const opaqueElements = sections?.envelope?.opaqueElements || [];
    const openings = sections?.envelope?.openings || [];
    const systems = sections?.systems || [];
    const improvements = sections?.improvementMeasures || [];

    return (
      <div className="fixed inset-0 z-[9500] flex items-center justify-center overflow-hidden bg-black/75 px-3 py-4 sm:px-4 sm:py-6" role="dialog" aria-modal="true">
        <div className="flex max-h-[82dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101512] shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#00DC82]">{t.wizardCeeDetailSource}</p>
              <h3 className="font-heading text-xl font-bold text-premium">{t.wizardCeeDetailTitle}</h3>
              <p className="mt-1 text-xs text-muted">{ceeImport.fileName || t.wizardSourceCee}</p>
            </div>
            <button type="button" onClick={() => setCeeDetailsOpen(false)} className="rounded-full border border-white/10 p-2 text-muted hover:text-premium" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="mb-3 text-sm font-bold text-premium">{t.wizardCeeDetailIdentification}</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [t.wizardCeeProgram, certificate.sourceProgram || 'UNKNOWN'],
                  [t.wizardCeeEnergyLetter, certificate.globalLetter || '---'],
                  [t.wizardCeeUsefulArea, certificate.usefulAreaM2 ? `${certificate.usefulAreaM2} ${t.unitArea}` : '---'],
                  [t.wizardCeeDetailClimateZone, certificate.climateZone || '---'],
                  [t.wizardCeeDetailYearBuilt, certificate.yearBuilt || '---'],
                  [t.wizardZipcode, certificate.postalCode || '---'],
                  [t.cadastralReference, certificate.cadastralReference || '---'],
                  [t.wizardCeeIssueDate, certificate.issueDate || '---'],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-black/20 p-3">
                    <p className="text-[10px] font-bold uppercase text-muted">{label}</p>
                    <p className="mt-1 break-words text-xs font-bold text-premium">{value}</p>
                  </div>
                ))}
              </div>
              {certificate.addressLine && <p className="mt-3 text-xs text-muted">{certificate.addressLine}</p>}
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-premium">{t.wizardCeeDetailRating}</h4>
              <div className="grid gap-3 lg:grid-cols-3">
                {renderMetricRows(t.wizardCeeNonRenewableEnergy, sections?.indicators?.primaryEnergy)}
                {renderMetricRows(t.wizardCeeEmissions, sections?.indicators?.emissions)}
                {renderMetricRows(t.wizardCeeDetailDemand, sections?.indicators?.demand)}
              </div>
            </section>

            {(opaqueElements.length > 0 || openings.length > 0) && (
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-premium">{t.wizardCeeDetailEnvelope}</h4>
                {opaqueElements.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="bg-white/5 text-muted"><tr><th className="p-2">{t.wizardCeeDetailName}</th><th className="p-2">{t.wizardPropertyType}</th><th className="p-2">{t.wizardCeeDetailArea}</th><th className="p-2">{t.wizardCeeDetailTransmittance}</th><th className="p-2">{t.wizardCeeDetailSource}</th></tr></thead>
                      <tbody>{opaqueElements.map((item) => <tr key={`${item.name}-${item.areaM2}`} className="border-t border-white/10"><td className="p-2 text-premium">{item.name}</td><td className="p-2">{item.type}</td><td className="p-2">{item.areaM2 ?? '---'}</td><td className="p-2">{item.transmittanceWm2K ?? '---'}</td><td className="p-2">{item.source || '---'}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
                {openings.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="bg-white/5 text-muted"><tr><th className="p-2">{t.wizardCeeDetailName}</th><th className="p-2">{t.wizardCeeDetailArea}</th><th className="p-2">{t.wizardCeeDetailTransmittance}</th><th className="p-2">{t.wizardCeeDetailSolarFactor}</th><th className="p-2">{t.wizardCeeDetailSource}</th></tr></thead>
                      <tbody>{openings.map((item) => <tr key={`${item.name}-${item.areaM2}`} className="border-t border-white/10"><td className="p-2 text-premium">{item.name}</td><td className="p-2">{item.areaM2 ?? '---'}</td><td className="p-2">{item.transmittanceWm2K ?? '---'}</td><td className="p-2">{item.solarFactor ?? '---'}</td><td className="p-2">{item.source || '---'}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {systems.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-premium">{t.wizardCeeDetailSystems}</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {systems.map((system, index) => (
                    <div key={`${system.section}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                      <p className="font-bold text-[#00DC82]">{system.name}</p>
                      <p className="mt-1 text-premium">{system.type || '---'}</p>
                      <p className="mt-1 text-muted">{system.energyType || '---'} · {system.seasonalEfficiencyPct ?? system.nominalPowerKw ?? '---'}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {improvements.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-premium">{t.wizardCeeDetailImprovements}</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {improvements.map((item) => (
                    <div key={item.title} className="rounded-xl border border-[#FFB020]/20 bg-[#FFB020]/5 p-3 text-xs">
                      <p className="font-bold text-premium">{item.title}</p>
                      <p className="mt-1 text-[#FFB020]">{item.costEstimateEur ? `${item.costEstimateEur.toLocaleString('es-ES')} EUR` : '---'}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCeeImportBlock = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div>
        <p className="font-heading text-sm font-bold text-premium">{t.wizardCeeTitle}</p>
        <p className="mt-1 text-xs text-muted">{t.wizardCeeDescription}</p>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#00DC82]/30 px-4 py-2 text-xs font-bold text-[#00DC82] hover:bg-[#00DC82]/10">
        <UploadCloud className="h-4 w-4" />
        {ceeImport.status === 'processing' ? t.wizardCeeProcessing : t.wizardCeeUploadButton}
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) analyzeCeeFile(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {ceeImport.status === 'ready' && ceeImport.data && (
        <div className="rounded-xl border border-[#00DC82]/20 bg-[#00DC82]/5 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-bold text-[#00DC82]">{t.wizardCeeDetected}</span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-muted">
              {ceeImport.data.extractionStatus === 'NEEDS_REVIEW' ? t.wizardSourceReviewRequired : t.wizardSourceCee}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-muted">
            <span>{t.wizardCeeProgram}: <b className="text-premium">{ceeImport.data.sourceProgram || 'UNKNOWN'}</b></span>
            <span>{t.wizardCeeEnergyLetter}: <b className="text-premium">{ceeImport.data.globalLetter || '---'}</b></span>
            <span>{t.wizardCeeNonRenewableEnergy}: <b className="text-premium">{ceeImport.data.nonRenewableEPKwhM2Year ?? '---'}</b></span>
            <span>{t.wizardCeeEmissions}: <b className="text-premium">{ceeImport.data.emissionsKgCO2M2Year ?? '---'}</b></span>
            <span>{t.wizardCeeUsefulArea}: <b className="text-premium">{ceeImport.data.usefulAreaM2 || ceeImport.data.builtAreaM2 || '---'} {t.unitArea}</b></span>
            <span>{t.wizardCeeIssueDate}: <b className="text-premium">{ceeImport.data.issueDate || '---'}</b></span>
          </div>
          <p className="mt-2 text-[10px] text-[#FFB020]">{t.wizardCeeNeedsReview}</p>
          {ceeAppliedNotice && <p className="mt-2 rounded-lg border border-[#00DC82]/20 bg-[#00DC82]/10 px-2 py-1 text-[10px] font-semibold text-[#00DC82]">{t.wizardCeeApplied}</p>}
          {ceeImport.warnings.map((warning) => <p key={warning} className="mt-1 text-[10px] text-[#FFB020]">{warning}</p>)}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={applyCeeData} className="rounded-full bg-[#00DC82] px-3 py-1.5 text-[11px] font-bold text-[#0A0A0A]">
              {t.wizardCeeUseData}
            </button>
            <button type="button" onClick={() => setCeeDetailsOpen(true)} className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-muted hover:text-premium">
              {t.wizardCeeReviewManually}
            </button>
          </div>
        </div>
      )}
      {ceeImport.status === 'failed' && <p className="text-xs text-[#EF4444]">{ceeImport.error || t.wizardCeeFailed}</p>}
    </div>
  );

  const renderBudgetImportBlock = () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div>
        <p className="font-heading text-sm font-bold text-premium">{t.wizardBudgetImportTitle}</p>
        <p className="mt-1 text-xs text-muted">{t.wizardBudgetImportDescription}</p>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#00DC82]/30 px-4 py-2 text-xs font-bold text-[#00DC82] hover:bg-[#00DC82]/10">
        <UploadCloud className="h-4 w-4" />
        {budgetImport.status === 'processing' ? t.wizardBudgetProcessing : t.wizardBudgetUploadButton}
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) analyzeBudgetFile(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {budgetImport.status === 'ready' && budgetImport.data && (
        <div className="rounded-xl border border-[#00DC82]/20 bg-[#00DC82]/5 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-bold text-[#00DC82]">{t.wizardBudgetDetected}</span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-muted">{budgetImport.data.impactConfidence}</span>
          </div>
          <p className="text-muted">{t.wizardBudgetTotal}: <b className="text-premium">{budgetImport.data.totalAmount ? `${budgetImport.data.totalAmount.toLocaleString('es-ES')} €` : '---'}</b></p>
          <p className="mt-2 text-muted">{t.wizardBudgetDetectedMeasures}: <b className="text-premium">{budgetImport.data.detectedMeasures.map((measure) => measure.category).join(', ') || '---'}</b></p>
          <p className="mt-2 text-premium">{t.wizardBudgetEstimatedImpact}: {budgetImport.data.analysisSummary}</p>
          {budgetImport.data.missingMeasures.length > 0 && (
            <p className="mt-2 text-[10px] text-[#FFB020]">{t.wizardBudgetMissingMeasures}: {budgetImport.data.missingMeasures.join(', ')}</p>
          )}
          {budgetImport.warnings.map((warning) => <p key={warning} className="mt-1 text-[10px] text-[#FFB020]">{warning}</p>)}
        </div>
      )}
      {budgetImport.status === 'failed' && <p className="text-xs text-[#EF4444]">{budgetImport.error || t.wizardBudgetFailed}</p>}
    </div>
  );

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
        energyCertificate: ceeImport.data,
        rehabBudget: budgetImport.data,
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
    if (ceeImport.data) {
      formData.append('energyCertificate', JSON.stringify(ceeImport.data));
    }
    if (budgetImport.data) {
      formData.append('rehabBudget', JSON.stringify(budgetImport.data));
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
    <div className={`mx-auto ${step === 2 ? 'h-full w-full max-w-none px-4 py-4 sm:px-8 lg:px-12 lg:overflow-hidden' : 'max-w-3xl px-4 py-8 lg:h-full lg:overflow-y-auto custom-scrollbar'}`}>
      <div className={`${step === 2 ? 'flex h-full min-h-0 w-full flex-col' : ''}`}>
        <div className={step === 2 ? 'mb-4 shrink-0' : 'mb-8'}>
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

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className={step === 2 ? 'flex min-h-0 flex-1 flex-col' : 'space-y-8'}>
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
          <div className="flex min-h-0 flex-1 flex-col space-y-4">
            <div className="flex shrink-0 items-center justify-between gap-4">
              <h2 className="font-heading font-bold text-2xl text-premium">{t.wizardPropertyData}</h2>
              {autofillNotice && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00DC82]/10 border border-[#00DC82]/20 text-[#00DC82] text-[10px] font-bold uppercase animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.wizardCatastroAutofillApplied}
                </div>
              )}
            </div>
            
            <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-12">
              <div className={`${isDataPanelCollapsed ? 'hidden' : 'lg:col-span-3'} min-h-0 space-y-6 overflow-y-auto pr-2 custom-scrollbar`}>
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

                {renderCeeImportBlock()}
                {renderBudgetImportBlock()}

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

              <div className={`${isDataPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-9'} flex h-full min-h-0 flex-col space-y-4 transition-[grid-column] duration-300`}>
                <div className="flex min-h-0 flex-1 flex-col">
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
                  <div className="relative min-h-[340px] flex-1 overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:min-h-0">
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
      {renderCeeDetailsModal()}
      </div>
    </div>
  );
}
