import type { AppLanguage } from '@/lib/preferences';

// Category scale: 1 = no immediate action, 2 = review/plan, 3 = high priority
export type ConditionRiskCategory = 1 | 2 | 3;

export type ConditionElement =
  | 'roof'
  | 'facade'
  | 'windows'
  | 'dampness'
  | 'ventilation'
  | 'heating'
  | 'dhw'
  | 'cooling'
  | 'electricity_basic'
  | 'accessibility'
  | 'common_elements';

export type ConditionRiskSource =
  | 'declared'
  | 'catastro'
  | 'attachment'
  | 'inferred'
  | 'unknown';

export type ConditionRiskItem = {
  element: ConditionElement;
  category: ConditionRiskCategory;
  source: ConditionRiskSource;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  reasonKey: string;
  recommendationKey: string;
  requiresProfessionalReview: boolean;
};

// ---- Label maps ----

export const categoryLabels: Record<AppLanguage, Record<ConditionRiskCategory, string>> = {
  es: {
    1: 'Sin acción inmediata',
    2: 'Revisar / planificar',
    3: 'Prioridad alta',
  },
  en: {
    1: 'No immediate action',
    2: 'Review / plan',
    3: 'High priority',
  },
  de: {
    1: 'Kein sofortiger Handlungsbedarf',
    2: 'Überprüfen / planen',
    3: 'Hohe Priorität',
  },
};

export const elementLabels: Record<AppLanguage, Record<ConditionElement, string>> = {
  es: {
    roof: 'Cubierta',
    facade: 'Fachada / Envolvente',
    windows: 'Ventanas',
    dampness: 'Humedades',
    ventilation: 'Ventilación',
    heating: 'Calefacción',
    dhw: 'Agua caliente sanitaria',
    cooling: 'Refrigeración',
    electricity_basic: 'Instalación eléctrica',
    accessibility: 'Accesibilidad',
    common_elements: 'Elementos comunes',
  },
  en: {
    roof: 'Roof',
    facade: 'Facade / Envelope',
    windows: 'Windows',
    dampness: 'Dampness',
    ventilation: 'Ventilation',
    heating: 'Heating',
    dhw: 'Hot water (DHW)',
    cooling: 'Cooling',
    electricity_basic: 'Electrical installation',
    accessibility: 'Accessibility',
    common_elements: 'Common elements',
  },
  de: {
    roof: 'Dach',
    facade: 'Fassade / Gebäudehülle',
    windows: 'Fenster',
    dampness: 'Feuchtigkeit',
    ventilation: 'Lüftung',
    heating: 'Heizung',
    dhw: 'Warmwasser (TWW)',
    cooling: 'Kühlung',
    electricity_basic: 'Elektroinstallation',
    accessibility: 'Barrierefreiheit',
    common_elements: 'Gemeinschaftselemente',
  },
};

export const sourceLabels: Record<AppLanguage, Record<ConditionRiskSource, string>> = {
  es: {
    declared: 'Declarado por usuario',
    catastro: 'Catastro',
    attachment: 'Adjunto aportado',
    inferred: 'Derivado por regla',
    unknown: 'Desconocido',
  },
  en: {
    declared: 'User declared',
    catastro: 'Cadastre',
    attachment: 'Submitted attachment',
    inferred: 'Derived by rule',
    unknown: 'Unknown',
  },
  de: {
    declared: 'Vom Nutzer angegeben',
    catastro: 'Kataster',
    attachment: 'Eingereichtes Dokument',
    inferred: 'Durch Regel abgeleitet',
    unknown: 'Unbekannt',
  },
};

export const moduleDisclaimer: Record<AppLanguage, string> = {
  es: 'Este módulo no es una inspección técnica ni sustituye la revisión presencial de un profesional cualificado. Las categorías se basan en datos declarados y reglas orientativas.',
  en: 'This module is not a technical inspection and does not replace an on-site review by a qualified professional. Categories are based on declared data and indicative rules.',
  de: 'Dieses Modul ist keine technische Inspektion und ersetzt nicht die Vor-Ort-Prüfung durch qualifizierte Fachleute. Die Kategorien basieren auf angegebenen Daten und orientierenden Regeln.',
};

export function getCategoryLabel(category: ConditionRiskCategory, lang: AppLanguage = 'es'): string {
  return (categoryLabels[lang] ?? categoryLabels.es)[category];
}

export function getElementLabel(element: ConditionElement, lang: AppLanguage = 'es'): string {
  return (elementLabels[lang] ?? elementLabels.es)[element];
}

export function getSourceLabel(source: ConditionRiskSource, lang: AppLanguage = 'es'): string {
  return (sourceLabels[lang] ?? sourceLabels.es)[source];
}

export function getModuleDisclaimer(lang: AppLanguage = 'es'): string {
  return moduleDisclaimer[lang] ?? moduleDisclaimer.es;
}
