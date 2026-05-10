import { PropertyDataV2, SubsidyInfoItem } from "./domain/energy-assessment";

export const SUBSIDY_DISCLAIMER =
  "Información orientativa. EnergyScan no verifica convocatorias en tiempo real, no garantiza elegibilidad, no promete importes y no sustituye la consulta de bases oficiales estatales, autonómicas o municipales.";

export const SUBSIDY_INFO_ITEMS: SubsidyInfoItem[] = [
  {
    id: "self-consumption-storage",
    title: "Autoconsumo, almacenamiento y renovables",
    scope: "state",
    appliesTo: ["fotovoltaica", "baterías", "autoconsumo", "renovables"],
    description: "Programas estatales o autonómicos derivados del marco de incentivos al autoconsumo y almacenamiento, incluyendo referencias como el RD 477/2021 o sus líneas sucesoras cuando estén abiertas.",
    eligibilityDisclaimer: "La disponibilidad depende de convocatorias, presupuesto, comunidad autónoma, fecha de solicitud y requisitos técnicos. No se presume elegibilidad automática.",
    referenceUrl: "https://www.idae.es/",
  },
  {
    id: "energy-renovation",
    title: "Rehabilitación energética de vivienda",
    scope: "regional",
    appliesTo: ["aislamiento", "ventanas", "rehabilitación energética", "envolvente"],
    description: "Líneas informativas relacionadas con mejora de envolvente, reducción de demanda energética o rehabilitación de edificios, gestionadas normalmente por administraciones autonómicas o locales.",
    eligibilityDisclaimer: "Cada convocatoria exige comprobar edificio, actuación, ahorro justificable, documentación técnica y plazos vigentes.",
    referenceUrl: "https://www.miteco.gob.es/",
  },
  {
    id: "heat-pump-electrification",
    title: "Bombas de calor y electrificación eficiente",
    scope: "regional",
    appliesTo: ["aerotermia", "bomba de calor", "climatización", "ACS"],
    description: "Algunos programas IDAE, autonómicos o locales pueden contemplar sustitución de sistemas fósiles por bombas de calor, aerotermia u otras soluciones eficientes.",
    eligibilityDisclaimer: "La actuación debe confirmarse con bases oficiales y presupuesto profesional. No todas las sustituciones son subvencionables.",
    referenceUrl: "https://www.idae.es/",
  },
  {
    id: "tax-deductions-local-bonuses",
    title: "Deducciones fiscales y bonificaciones municipales",
    scope: "local",
    appliesTo: ["IBI", "ICIO", "IRPF", "rehabilitación", "renovables"],
    description: "Pueden existir deducciones fiscales o bonificaciones municipales asociadas a mejoras energéticas, autoconsumo o rehabilitación.",
    eligibilityDisclaimer: "Dependen del municipio, normativa fiscal vigente, certificados justificativos y requisitos administrativos. Deben verificarse en fuentes oficiales.",
  },
];

export function getRelevantSubsidies(property: PropertyDataV2): SubsidyInfoItem[] {
  const items = new Map<string, SubsidyInfoItem>();

  for (const item of SUBSIDY_INFO_ITEMS) {
    if (item.id === "tax-deductions-local-bonuses") items.set(item.id, item);
  }

  if (property.renewables === "none" || property.renewables === "unknown") {
    items.set("self-consumption-storage", SUBSIDY_INFO_ITEMS[0]);
  }

  if (property.facadeInsulation !== "good" || property.roofInsulation !== "good" || property.windows !== "triple") {
    items.set("energy-renovation", SUBSIDY_INFO_ITEMS[1]);
  }

  if (property.heating === "gas" || property.heating === "electric" || property.waterHeating === "gas" || property.waterHeating === "electric") {
    items.set("heat-pump-electrification", SUBSIDY_INFO_ITEMS[2]);
  }

  return Array.from(items.values());
}
