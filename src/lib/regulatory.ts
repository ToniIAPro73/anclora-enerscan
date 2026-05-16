import { RegulatoryTimelineItem } from "./domain/energy-assessment";
import { AppLanguage, normalizeLanguage } from "./preferences";

export const REGULATORY_DISCLAIMER =
  "Anclora EnergyScan ofrece un prediagnóstico energético orientativo basado en los datos aportados por el usuario y reglas técnicas de estimación. No sustituye al Certificado de Eficiencia Energética oficial regulado por el Real Decreto 390/2021 ni tiene validez administrativa. Las referencias a la Directiva (UE) 2024/1275 y a la evolución normativa europea se incluyen como contexto informativo y pueden variar según su transposición y desarrollo normativo en España.";

export const DISCLAIMER_TEXT =
  "Estimación orientativa basada en datos declarados por el usuario. No sustituye al Certificado de Eficiencia Energética oficial regulado en España por el Real Decreto 390/2021, no tiene validez administrativa y debe contrastarse con un técnico competente antes de tomar decisiones técnicas, económicas o legales.";

export const REGULATORY_TIMELINE: RegulatoryTimelineItem[] = [
  {
    id: "es-rd-390-2021",
    year: "Hoy",
    dateLabel: "España · vigente",
    status: "current",
    title: "Certificación energética oficial",
    description: "El Real Decreto 390/2021 regula el procedimiento básico para la certificación de la eficiencia energética de los edificios en España.",
    riskLevel: "low",
    jurisdiction: "ES",
    legalReference: "Real Decreto 390/2021",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2021-9176",
    impactOnUser: "Para vender o alquilar una vivienda cuando aplique, el usuario necesita un CEE oficial emitido por técnico competente. EnergyScan solo prepara una estimación orientativa.",
    disclaimer: "El informe de EnergyScan no es un CEE oficial ni puede registrarse ante una administración.",
  },
  {
    id: "eu-epbd-2024-1275",
    year: "2024",
    dateLabel: "Unión Europea · marco vigente",
    status: "current",
    title: "Directiva (UE) 2024/1275",
    description: "La nueva EPBD está en vigor como marco europeo para mejorar el rendimiento energético del parque edificatorio y orientar las estrategias nacionales de renovación.",
    riskLevel: "medium",
    jurisdiction: "EU",
    legalReference: "Directiva (UE) 2024/1275",
    url: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024L1275",
    impactOnUser: "Aporta contexto sobre la presión regulatoria europea, pero las obligaciones concretas para viviendas en España dependerán de su transposición y desarrollo nacional.",
    disclaimer: "No debe interpretarse como obligación individual directa sin normativa española aplicable.",
  },
  {
    id: "es-pniec",
    year: "2024-2030",
    dateLabel: "España · referencia estratégica",
    status: "informative",
    title: "PNIEC y rehabilitación energética",
    description: "El PNIEC actúa como referencia estratégica de política energética y climática, incluyendo eficiencia, electrificación, renovables y rehabilitación.",
    riskLevel: "medium",
    jurisdiction: "ES",
    legalReference: "Plan Nacional Integrado de Energía y Clima",
    url: "https://www.miteco.gob.es/",
    impactOnUser: "Puede orientar prioridades de inversión y programas de apoyo, pero no confirma elegibilidad ni importes para una vivienda concreta.",
    disclaimer: "Consulta siempre fuentes oficiales estatales, autonómicas o municipales para convocatorias vigentes.",
  },
  {
    id: "eu-2030-2033-residential",
    year: "2030/2033",
    dateLabel: "Horizonte europeo",
    status: "upcoming",
    title: "Reducción de consumo medio residencial",
    description: "La Directiva (UE) 2024/1275 introduce objetivos de reducción del consumo de energía primaria media del parque residencial a escala nacional.",
    riskLevel: "medium",
    jurisdiction: "EU",
    legalReference: "Directiva (UE) 2024/1275",
    impactOnUser: "Puede aumentar el interés comercial y regulatorio por mejorar viviendas ineficientes, especialmente antes de venta, alquiler o reforma.",
    disclaimer: "Estos horizontes no sustituyen a la transposición española ni determinan por sí solos una obligación individual sobre esta vivienda.",
  },
  {
    id: "eu-2050-zero-emission",
    year: "2050",
    dateLabel: "Largo plazo",
    status: "future",
    title: "Parque edificatorio de cero emisiones",
    description: "La estrategia europea apunta a un parque edificatorio descarbonizado y de muy bajas emisiones en 2050.",
    riskLevel: "high",
    jurisdiction: "EU",
    legalReference: "Pacto Verde Europeo / Directiva (UE) 2024/1275",
    impactOnUser: "Refuerza la conveniencia de planificar mejoras por fases: envolvente, electrificación eficiente y renovables cuando sean viables.",
    disclaimer: "Contexto estratégico de largo plazo, no diagnóstico oficial ni asesoramiento legal.",
  },
];

const REGULATORY_TRANSLATIONS: Record<string, Record<'en' | 'de', Partial<RegulatoryTimelineItem>>> = {
  "es-rd-390-2021": {
    en: {
      year: "Today",
      dateLabel: "Spain - current",
      title: "Official energy certification",
      description: "Royal Decree 390/2021 regulates the basic procedure for energy performance certification of buildings in Spain.",
      impactOnUser: "For sale or rental where applicable, the user needs an official EPC issued by a qualified technician. EnergyScan only prepares an indicative estimate.",
      disclaimer: "The EnergyScan report is not an official EPC and cannot be registered with an administration.",
    },
    de: {
      year: "Heute",
      dateLabel: "Spanien - gültig",
      title: "Offizieller Energieausweis",
      description: "Das Königliche Dekret 390/2021 regelt das grundlegende Verfahren für Energieausweise von Gebäuden in Spanien.",
      impactOnUser: "Für Verkauf oder Vermietung, soweit anwendbar, ist ein offizieller Energieausweis durch Fachleute erforderlich. EnergyScan erstellt nur eine Orientierung.",
      disclaimer: "Der EnergyScan-Bericht ist kein offizieller Energieausweis und kann nicht behördlich registriert werden.",
    },
  },
  "eu-epbd-2024-1275": {
    en: {
      dateLabel: "European Union - current framework",
      title: "Directive (EU) 2024/1275",
      description: "The new EPBD is the European framework for improving building energy performance and guiding national renovation strategies.",
      impactOnUser: "It provides regulatory context, but concrete obligations for homes in Spain depend on national transposition and development.",
      disclaimer: "Do not read it as a direct individual obligation without applicable Spanish rules.",
    },
    de: {
      dateLabel: "Europäische Union - aktueller Rahmen",
      title: "Richtlinie (EU) 2024/1275",
      description: "Die neue EPBD ist der europäische Rahmen zur Verbesserung der Energieeffizienz von Gebäuden und nationaler Sanierungsstrategien.",
      impactOnUser: "Sie liefert regulatorischen Kontext; konkrete Pflichten für Wohnungen in Spanien hängen von nationaler Umsetzung ab.",
      disclaimer: "Nicht als direkte Einzelpflicht ohne anwendbare spanische Vorschriften verstehen.",
    },
  },
  "es-pniec": {
    en: {
      dateLabel: "Spain - strategic reference",
      title: "PNIEC and energy renovation",
      description: "The PNIEC is a strategic reference for energy and climate policy, including efficiency, electrification, renewables and renovation.",
      impactOnUser: "It may guide investment priorities and support programmes, but does not confirm eligibility or amounts for a specific home.",
      disclaimer: "Always check official national, regional or municipal sources for active calls.",
    },
    de: {
      dateLabel: "Spanien - strategische Referenz",
      title: "PNIEC und energetische Sanierung",
      description: "Der PNIEC ist eine strategische Referenz der Energie- und Klimapolitik, einschließlich Effizienz, Elektrifizierung, Erneuerbare und Sanierung.",
      impactOnUser: "Er kann Investitionsprioritäten und Förderprogramme einordnen, bestätigt aber keine Förderfähigkeit oder Beträge für eine konkrete Immobilie.",
      disclaimer: "Aktive Programme immer bei offiziellen staatlichen, regionalen oder kommunalen Quellen prüfen.",
    },
  },
  "eu-2030-2033-residential": {
    en: {
      dateLabel: "European horizon",
      title: "Average residential consumption reduction",
      description: "Directive (EU) 2024/1275 introduces national-level targets to reduce average primary energy consumption in the residential stock.",
      impactOnUser: "It may increase commercial and regulatory interest in improving inefficient homes, especially before sale, rental or renovation.",
      disclaimer: "These horizons do not replace Spanish transposition and do not define an individual obligation for this home by themselves.",
    },
    de: {
      dateLabel: "Europäischer Horizont",
      title: "Reduktion des durchschnittlichen Wohnenergieverbrauchs",
      description: "Die Richtlinie (EU) 2024/1275 führt nationale Ziele zur Senkung des durchschnittlichen Primärenergieverbrauchs im Wohnbestand ein.",
      impactOnUser: "Dies kann das Interesse an der Verbesserung ineffizienter Wohnungen erhöhen, besonders vor Verkauf, Vermietung oder Sanierung.",
      disclaimer: "Diese Horizonte ersetzen nicht die spanische Umsetzung und begründen allein keine Einzelpflicht für diese Immobilie.",
    },
  },
  "eu-2050-zero-emission": {
    en: {
      dateLabel: "Long term",
      title: "Zero-emission building stock",
      description: "The European strategy points to a decarbonised, very low-emission building stock by 2050.",
      impactOnUser: "It reinforces the convenience of planning improvements in phases: envelope, efficient electrification and renewables where viable.",
      disclaimer: "Long-term strategic context, not an official diagnosis or legal advice.",
    },
    de: {
      dateLabel: "Langfristig",
      title: "Emissionsfreier Gebäudebestand",
      description: "Die europäische Strategie zielt bis 2050 auf einen dekarbonisierten Gebäudebestand mit sehr niedrigen Emissionen.",
      impactOnUser: "Sie unterstützt eine phasenweise Planung: Gebäudehülle, effiziente Elektrifizierung und erneuerbare Energien, wo tragfähig.",
      disclaimer: "Langfristiger strategischer Kontext, keine offizielle Diagnose oder Rechtsberatung.",
    },
  },
};

export function localizeRegulatoryTimeline(language?: string): RegulatoryTimelineItem[] {
  const lang = normalizeLanguage(language);
  if (lang === "es") return REGULATORY_TIMELINE;

  return REGULATORY_TIMELINE.map((item) => ({
    ...item,
    ...REGULATORY_TRANSLATIONS[item.id]?.[lang as Exclude<AppLanguage, "es">],
  }));
}
