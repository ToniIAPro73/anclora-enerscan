import type { AppLanguage } from '@/lib/preferences';

// Centralized human-readable labels for persisted enum/string values.
// Internal values (house, flat, DRAFT, PENDING…) must not appear raw in the UI.

const propertyTypeLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    flat: 'Piso / Apartamento',
    house: 'Casa unifamiliar',
    terraced: 'Adosado',
    penthouse: 'Ático',
    ground_floor: 'Planta baja',
    unknown: 'Tipo no indicado',
  },
  en: {
    flat: 'Flat / Apartment',
    house: 'Detached House',
    terraced: 'Terraced House',
    penthouse: 'Penthouse',
    ground_floor: 'Ground Floor',
    unknown: 'Type not specified',
  },
  de: {
    flat: 'Wohnung',
    house: 'Einfamilienhaus',
    terraced: 'Reihenhaus',
    penthouse: 'Penthouse',
    ground_floor: 'Erdgeschoss',
    unknown: 'Typ nicht angegeben',
  },
};

const assessmentPaymentStatusLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    unpaid: 'Gratuito',
    paid: 'Premium',
    DRAFT: 'Borrador',
    pending: 'Pendiente',
  },
  en: {
    unpaid: 'Free',
    paid: 'Premium',
    DRAFT: 'Draft',
    pending: 'Pending',
  },
  de: {
    unpaid: 'Kostenlos',
    paid: 'Premium',
    DRAFT: 'Entwurf',
    pending: 'Ausstehend',
  },
};

const budgetReviewStatusLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    DRAFT: 'Borrador',
    ANALYZED: 'Analizado',
    PAID: 'Pagado',
    ERROR: 'Error en análisis',
  },
  en: {
    DRAFT: 'Draft',
    ANALYZED: 'Analysed',
    PAID: 'Paid',
    ERROR: 'Analysis error',
  },
  de: {
    DRAFT: 'Entwurf',
    ANALYZED: 'Analysiert',
    PAID: 'Bezahlt',
    ERROR: 'Analysefehler',
  },
};

const providerStatusLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    PENDING: 'Pendiente de verificación',
    VERIFIED: 'Verificado',
    PREFERRED: 'Preferente',
    SUSPENDED: 'Suspendido',
    EXCLUSIVE: 'Exclusivo',
  },
  en: {
    PENDING: 'Pending verification',
    VERIFIED: 'Verified',
    PREFERRED: 'Preferred',
    SUSPENDED: 'Suspended',
    EXCLUSIVE: 'Exclusive',
  },
  de: {
    PENDING: 'Verifizierung ausstehend',
    VERIFIED: 'Verifiziert',
    PREFERRED: 'Bevorzugt',
    SUSPENDED: 'Gesperrt',
    EXCLUSIVE: 'Exklusiv',
  },
};

const leadStatusLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    PENDING: 'Pendiente',
    CONTACTED: 'Contactado',
    QUOTED: 'Presupuestado',
    WON: 'Ganado',
    LOST: 'Perdido',
    CANCELLED: 'Cancelado',
  },
  en: {
    PENDING: 'Pending',
    CONTACTED: 'Contacted',
    QUOTED: 'Quoted',
    WON: 'Won',
    LOST: 'Lost',
    CANCELLED: 'Cancelled',
  },
  de: {
    PENDING: 'Ausstehend',
    CONTACTED: 'Kontaktiert',
    QUOTED: 'Angeboten',
    WON: 'Gewonnen',
    LOST: 'Verloren',
    CANCELLED: 'Abgebrochen',
  },
};

const professionalAccessStatusLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    NONE: 'Sin solicitud',
    PENDING: 'Pendiente de revisión',
    APPROVED: 'Aprobado',
    REJECTED: 'No aprobado',
  },
  en: {
    NONE: 'No request',
    PENDING: 'Under review',
    APPROVED: 'Approved',
    REJECTED: 'Not approved',
  },
  de: {
    NONE: 'Keine Anfrage',
    PENDING: 'In Prüfung',
    APPROVED: 'Genehmigt',
    REJECTED: 'Nicht genehmigt',
  },
};

const confidenceLevelLabels: Record<AppLanguage, Record<string, string>> = {
  es: {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    unknown: 'Desconocida',
  },
  en: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    unknown: 'Unknown',
  },
  de: {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    unknown: 'Unbekannt',
  },
};

function getLabel(
  map: Record<AppLanguage, Record<string, string>>,
  lang: AppLanguage,
  value: string | null | undefined,
  nullFallback = '—',
): string {
  const langMap = map[lang] ?? map.es;
  if (value == null || value === '') return nullFallback;
  return langMap[value] ?? value;
}

export function getPropertyTypeLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(propertyTypeLabels, lang, value);
}

export function getAssessmentPaymentStatusLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(assessmentPaymentStatusLabels, lang, value, value ?? '—');
}

export function getBudgetReviewStatusLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(budgetReviewStatusLabels, lang, value, value ?? '—');
}

export function getProviderStatusLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(providerStatusLabels, lang, value, value ?? '—');
}

export function getLeadStatusLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(leadStatusLabels, lang, value, value ?? '—');
}

export function getProfessionalAccessStatusLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(professionalAccessStatusLabels, lang, value, value ?? '—');
}

export function getConfidenceLevelLabel(value: string | null | undefined, lang: AppLanguage = 'es'): string {
  return getLabel(confidenceLevelLabels, lang, value, '—');
}
