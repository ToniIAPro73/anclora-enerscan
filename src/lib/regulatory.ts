import { RegulatoryTimelineItem } from "./domain/energy-assessment";

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
