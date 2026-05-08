import { RegulatoryTimelineItem } from "./domain/energy-assessment";

export const REGULATORY_DISCLAIMER = "Estimación orientativa basada en el borrador de la directiva europea EPBD. El calendario real dependerá de la transposición normativa española, que puede introducir excepciones o plazos adicionales. Consulta siempre fuentes oficiales.";

export const DISCLAIMER_TEXT = "Estimación orientativa basada en los datos facilitados por el usuario. No sustituye al Certificado de Eficiencia Energética oficial regulado por el Real Decreto 390/2021. Las decisiones técnicas, económicas o legales deben contrastarse con un técnico competente y fuentes oficiales actualizadas.";

export const REGULATORY_TIMELINE: RegulatoryTimelineItem[] = [
  {
    year: "Hoy",
    status: "vigente",
    title: "RD 390/2021",
    description: "El CEE oficial es obligatorio para vender o alquilar edificios o partes de edificios existentes en España cuando aplique.",
    riskLevel: "low"
  },
  {
    year: "2030",
    status: "objetivo_ue",
    title: "EPBD (Residencial)",
    description: "La Directiva europea impulsa objetivos de reducción de consumo promedio del parque residencial. Podría aumentar la presión regulatoria para viviendas ineficientes.",
    riskLevel: "medium"
  },
  {
    year: "2033",
    status: "en_desarrollo",
    title: "EPBD (Renovación)",
    description: "Conviene anticipar mejoras. Los Estados Miembros deberán garantizar una reducción mayor del consumo energético medio de los edificios residenciales.",
    riskLevel: "medium"
  },
  {
    year: "2050",
    status: "orientativo",
    title: "Net Zero",
    description: "Horizonte europeo de parque edificatorio descarbonizado. Cero emisiones en edificios residenciales.",
    riskLevel: "high"
  }
];
