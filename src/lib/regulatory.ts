export interface RegulatoryNode {
  year: string;
  title: string;
  description: string;
  status: "vigente" | "desarrollo" | "objetivo";
  severity: "low" | "medium" | "high";
}

export const REGULATORY_TIMELINE: RegulatoryNode[] = [
  {
    year: "Hoy",
    title: "R.D. 390/2021",
    description: "El CEE es obligatorio para vender o alquilar en España. La mayoría del parque residencial se sitúa entre F y G.",
    status: "vigente",
    severity: "low"
  },
  {
    year: "2030",
    title: "Directiva EPBD - Meta 1",
    description: "Reducción del 16% del uso medio de energía primaria en edificios residenciales. Senda de avance hacia letra E.",
    status: "desarrollo",
    severity: "medium"
  },
  {
    year: "2033",
    title: "Objetivo Clase E",
    description: "Objetivo de alcanzar clase E para edificios residenciales existentes. Fuertes implicaciones para viviendas F o G.",
    status: "objetivo",
    severity: "high"
  },
  {
    year: "2050",
    title: "Descarbonización Total",
    description: "Parque edificatorio de consumo nulo. Requerirá rehabilitaciones profundas generalizadas.",
    status: "objetivo",
    severity: "high"
  }
];

export const DISCLAIMER_TEXT = "Estimación orientativa basada en datos facilitados por el usuario. No sustituye al CEE oficial regulado por el Real Decreto 390/2021.";
export const REGULATORY_DISCLAIMER = "La información regulatoria mostrada combina normativa española vigente y objetivos europeos sujetos a desarrollo y transposición. No debe interpretarse como asesoramiento legal.";
