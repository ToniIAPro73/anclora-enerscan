import type { ProviderHandoffRequest, RequestedProviderService } from "./schema";

type Locale = "es" | "en" | "de";

export const PROVIDER_HANDOFF_CONSENT_COPY: Record<Locale, string> = {
  es: "Acepto que Anclora comparta mis datos de contacto y el resumen técnico de mi prediagnóstico energético con proveedores o partners seleccionados para que puedan contactarme en relación con los servicios solicitados. Entiendo que Anclora EnergyScan no emite certificados energéticos oficiales y que cualquier certificación deberá realizarla un técnico habilitado.",
  en: "I agree that Anclora may share my contact details and the technical summary of my energy pre-assessment with selected providers or partners so they can contact me about the requested services. I understand that Anclora EnergyScan does not issue official energy certificates and that any certification must be performed by a qualified technician.",
  de: "Ich stimme zu, dass Anclora meine Kontaktdaten und die technische Zusammenfassung meiner energetischen Voreinschätzung mit ausgewählten Anbietern oder Partnern teilen darf, damit sie mich zu den angefragten Leistungen kontaktieren können. Ich verstehe, dass Anclora EnergyScan keine offiziellen Energiezertifikate ausstellt und dass jede Zertifizierung von einer qualifizierten Fachperson durchgeführt werden muss.",
};

type BuildProviderHandoffRequestInput = {
  assessment: {
    id: string;
    isDemo?: boolean | null;
    demo?: boolean | null;
    score?: number | null;
    estimatedLetter?: string | null;
    rating?: string | null;
    confidence?: number | null;
    improvementPotential?: "low" | "medium" | "high" | null;
  };
  propertyContext: ProviderHandoffRequest["propertyContext"];
  requestedServices: readonly RequestedProviderService[];
  contact: ProviderHandoffRequest["contact"];
  consent: {
    providerContactAccepted: boolean;
    privacyAccepted: boolean;
    acceptedAt: string;
    consentVersion: string;
  };
  routing: ProviderHandoffRequest["routing"];
  metadata: ProviderHandoffRequest["metadata"];
  occurredAt?: string;
};

function getImprovementPotential(score?: number | null): "low" | "medium" | "high" | null {
  if (typeof score !== "number") return null;
  if (score < 55) return "high";
  if (score < 75) return "medium";
  return "low";
}

export function buildProviderHandoffRequest(input: BuildProviderHandoffRequestInput): ProviderHandoffRequest {
  if (input.consent.providerContactAccepted !== true) {
    throw new Error("providerContactAccepted consent is required for Synergi handoff");
  }
  if (input.consent.privacyAccepted !== true) {
    throw new Error("privacyAccepted consent is required for Synergi handoff");
  }

  const locale = input.metadata.locale;

  return {
    schemaVersion: "1.0",
    sourceSystem: "anclora-energyscan",
    targetSystem: "anclora-synergi",
    eventType: "provider_handoff_requested",
    occurredAt: input.occurredAt || new Date().toISOString(),
    assessment: {
      id: input.assessment.id,
      demo: Boolean(input.assessment.isDemo || input.assessment.demo || input.assessment.id.startsWith("local_")),
      score: input.assessment.score ?? null,
      rating: input.assessment.estimatedLetter || input.assessment.rating || null,
      confidence: input.assessment.confidence ?? null,
      improvementPotential: input.assessment.improvementPotential || getImprovementPotential(input.assessment.score),
    },
    propertyContext: {
      province: input.propertyContext.province || null,
      municipality: input.propertyContext.municipality || null,
      postalCode: input.propertyContext.postalCode || null,
      propertyType: input.propertyContext.propertyType || null,
      constructionYear: input.propertyContext.constructionYear ?? null,
      builtAreaM2: input.propertyContext.builtAreaM2 ?? null,
      usefulAreaM2: input.propertyContext.usefulAreaM2 ?? null,
    },
    requestedServices: [...input.requestedServices],
    contact: input.contact,
    consent: {
      providerContactAccepted: true,
      privacyAccepted: true,
      acceptedAt: input.consent.acceptedAt,
      consentVersion: input.consent.consentVersion,
      consentTextSnapshot: PROVIDER_HANDOFF_CONSENT_COPY[locale],
    },
    routing: input.routing,
    metadata: input.metadata,
  };
}
