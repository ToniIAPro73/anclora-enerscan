import { AppLanguage, normalizeLanguage } from "./preferences";

export const legalDisclaimer = {
  es: "EnerScan es un prediagnóstico orientativo. No sustituye al Certificado de Eficiencia Energética oficial ni a la inspección de un técnico competente. Ahorros, costes y clasificaciones son estimaciones.",
  en: "EnerScan is an indicative pre-assessment. It does not replace the official Energy Performance Certificate or an inspection by a qualified technician. Savings, costs and ratings are estimates.",
  de: "EnerScan ist eine orientierende Voreinschätzung. Sie ersetzt weder den offiziellen Energieausweis noch die Prüfung durch qualifizierte Fachleute. Einsparungen, Kosten und Klassen sind Schätzungen.",
};

export const dictionaries = {
  es: {
    navHow: "Cómo funciona",
    navRegulation: "Normativa",
    navImprovements: "Mejoras",
    navPricing: "Precios",
    start: "Iniciar análisis",
    startFree: "Iniciar análisis gratuito",
    demo: "Ver ejemplo de valoración",
    heroBadge: "Directiva EPBD 2024/1275",
    heroTitleA: "Descubre la situación",
    heroTitleB: "energética",
    heroTitleC: "de tu vivienda",
    heroCopy: "Prediagnóstico orientativo, contexto normativo actualizado y rutas de mejora con conectividad directa con proveedores. Sin sustituir el certificado oficial.",
    howItWorks: "Ver cómo funciona",
    process: "Proceso",
    processTitle: "Cuatro pasos hacia tu prediagnóstico",
    processCopy: "Un flujo guiado que te lleva desde la descripción de tu vivienda hasta un informe personalizado.",
    wizardTitle: "Tu prediagnóstico energético",
    result: "Resultado preliminar",
    estimatedRating: "Clasificación orientativa",
    downloadPdf: "Descargar PDF",
    demoBadge: "Demo sin datos personales",
    attachments: "Documentación aportada",
    noAttachments: "No se aportó documentación adicional.",
    footerCopy: "Plataforma de prediagnóstico energético, preparación regulatoria y activación de rehabilitación inmobiliaria.",
  },
  en: {
    navHow: "How it works",
    navRegulation: "Regulation",
    navImprovements: "Improvements",
    navPricing: "Pricing",
    start: "Start assessment",
    startFree: "Start free assessment",
    demo: "View sample assessment",
    heroBadge: "EPBD Directive 2024/1275",
    heroTitleA: "Understand your home's",
    heroTitleB: "energy",
    heroTitleC: "position",
    heroCopy: "Indicative pre-assessment, updated regulatory context and improvement routes with provider connectivity. It does not replace the official certificate.",
    howItWorks: "See how it works",
    process: "Process",
    processTitle: "Four steps to your pre-assessment",
    processCopy: "A guided flow from property data to a personalized report.",
    wizardTitle: "Your energy pre-assessment",
    result: "Preliminary result",
    estimatedRating: "Indicative rating",
    downloadPdf: "Download PDF",
    demoBadge: "Demo without personal data",
    attachments: "Submitted documentation",
    noAttachments: "No additional documentation was submitted.",
    footerCopy: "Energy pre-assessment platform for regulatory readiness and property renovation activation.",
  },
  de: {
    navHow: "Ablauf",
    navRegulation: "Regulierung",
    navImprovements: "Massnahmen",
    navPricing: "Preise",
    start: "Analyse starten",
    startFree: "Kostenlose Analyse starten",
    demo: "Beispielbewertung ansehen",
    heroBadge: "EPBD-Richtlinie 2024/1275",
    heroTitleA: "Verstehen Sie die",
    heroTitleB: "Energie",
    heroTitleC: "lage Ihrer Immobilie",
    heroCopy: "Orientierende Voreinschätzung, aktueller regulatorischer Kontext und Verbesserungswege mit Anbieteranbindung. Ersetzt keinen offiziellen Ausweis.",
    howItWorks: "Ablauf ansehen",
    process: "Prozess",
    processTitle: "Vier Schritte zur Voreinschätzung",
    processCopy: "Ein geführter Ablauf von Immobiliendaten bis zum personalisierten Bericht.",
    wizardTitle: "Ihre energetische Voreinschätzung",
    result: "Vorläufiges Ergebnis",
    estimatedRating: "Orientierende Klasse",
    downloadPdf: "PDF herunterladen",
    demoBadge: "Demo ohne persönliche Daten",
    attachments: "Eingereichte Dokumentation",
    noAttachments: "Es wurde keine zusätzliche Dokumentation eingereicht.",
    footerCopy: "Plattform für energetische Voreinschätzung, regulatorische Vorbereitung und Sanierungsaktivierung.",
  },
} as const;

export type Dictionary = (typeof dictionaries)[AppLanguage];

export function getDictionary(language?: string): Dictionary {
  return dictionaries[normalizeLanguage(language)];
}

export function getLegalDisclaimer(language?: string): string {
  return legalDisclaimer[normalizeLanguage(language)];
}
