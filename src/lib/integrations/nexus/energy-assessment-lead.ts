import type { EnergyAssessmentLead } from "./schema";

type Locale = "es" | "en" | "de";
type Currency = "EUR" | "GBP";
type Units = "metric" | "imperial";
type SourceChannel = EnergyAssessmentLead["sourceChannel"];
type EventType = EnergyAssessmentLead["eventType"];

type AssessmentLike = {
  id: string;
  publicId?: string | null;
  isDemo?: boolean | null;
  demo?: boolean | null;
  score?: number | null;
  estimatedLetter?: string | null;
  rating?: string | null;
  confidence?: number | string | null;
  paidAt?: Date | string | null;
  stripeSessionId?: string | null;
  budgetRange?: string | null;
  propertyType?: string | null;
  year?: number | null;
  constructionYear?: number | null;
  area?: number | null;
  usefulAreaM2?: number | null;
  zipcode?: string | null;
  postalCode?: string | null;
  province?: string | null;
  municipality?: string | null;
  address?: string | null;
  cadastralReference?: string | null;
  cadastralRecord?: {
    province?: string | null;
    municipality?: string | null;
    address?: string | null;
    cadastralReference?: string | null;
    surfaceBuiltM2?: number | null;
    surfaceDwellingM2?: number | null;
  } | null;
};

export type BuildEnergyAssessmentLeadInput = {
  assessment: AssessmentLike;
  sourceChannel: SourceChannel;
  eventType: EventType;
  occurredAt?: string;
  contact?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    preferredLanguage?: Locale | null;
  } | null;
  consent: {
    privacyAccepted: boolean;
    providerContactAccepted: boolean;
    analyticsAggregationAccepted?: boolean;
    acceptedAt?: string | null;
    consentVersion: string;
  };
  metadata: {
    locale: Locale;
    currency: Currency;
    units: Units;
    sourceUrl?: string | null;
    userAgentHash?: string | null;
  };
};

function toIso(value?: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeConfidence(value?: number | string | null) {
  if (typeof value === "number") return value;
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("alta") || normalized.includes("high")) return 0.85;
  if (normalized.includes("media") || normalized.includes("medium")) return 0.6;
  if (normalized.includes("baja") || normalized.includes("low")) return 0.35;
  return null;
}

function getImprovementPotential(score?: number | null): "low" | "medium" | "high" | null {
  if (typeof score !== "number") return null;
  if (score < 55) return "high";
  if (score < 75) return "medium";
  return "low";
}

function getRegulatoryGap(rating?: string | null) {
  if (!rating) return null;
  if (["E", "F", "G"].includes(rating.toUpperCase())) return "high";
  if (rating.toUpperCase() === "D") return "medium";
  return null;
}

function getStatus(input: BuildEnergyAssessmentLeadInput): EnergyAssessmentLead["assessment"]["status"] {
  if (input.eventType === "provider_contact_requested") return "provider_requested";
  if (input.assessment.paidAt) return "premium_unlocked";
  if (typeof input.assessment.score === "number" || input.assessment.estimatedLetter || input.assessment.rating) return "completed";
  return "draft";
}

export function buildEnergyAssessmentLead(input: BuildEnergyAssessmentLeadInput): EnergyAssessmentLead {
  const assessment = input.assessment;
  const rating = assessment.estimatedLetter || assessment.rating || null;
  const demo = Boolean(assessment.isDemo || assessment.demo || assessment.id.startsWith("local_"));
  const requestedProviderContact = input.eventType === "provider_contact_requested" || input.consent.providerContactAccepted;
  const tags = ["energyscan", input.sourceChannel];
  if (demo) tags.push("demo");
  if (requestedProviderContact) tags.push("provider-request");
  if (assessment.paidAt) tags.push("premium");

  return {
    schemaVersion: "1.0",
    sourceSystem: "anclora-energyscan",
    sourceChannel: input.sourceChannel,
    eventType: input.eventType,
    occurredAt: input.occurredAt || new Date().toISOString(),
    assessment: {
      id: assessment.id,
      publicId: assessment.publicId || null,
      demo,
      status: getStatus(input),
      score: assessment.score ?? null,
      rating,
      confidence: normalizeConfidence(assessment.confidence),
      regulatoryGap: getRegulatoryGap(rating),
      improvementPotential: getImprovementPotential(assessment.score),
    },
    property: {
      country: "ES",
      province: assessment.cadastralRecord?.province || assessment.province || null,
      municipality: assessment.cadastralRecord?.municipality || assessment.municipality || null,
      postalCode: assessment.zipcode || assessment.postalCode || null,
      addressLabel: assessment.cadastralRecord?.address || assessment.address || null,
      cadastralReference: assessment.cadastralRecord?.cadastralReference || assessment.cadastralReference || null,
      propertyType: assessment.propertyType || null,
      constructionYear: assessment.year ?? assessment.constructionYear ?? null,
      builtAreaM2: assessment.cadastralRecord?.surfaceBuiltM2 || assessment.area || null,
      usefulAreaM2: assessment.cadastralRecord?.surfaceDwellingM2 || assessment.usefulAreaM2 || assessment.area || null,
    },
    contact: input.consent.privacyAccepted ? {
      name: input.contact?.name || null,
      email: input.contact?.email || null,
      phone: input.contact?.phone || null,
      preferredLanguage: input.contact?.preferredLanguage || input.metadata.locale,
    } : null,
    commercial: {
      premiumUnlocked: Boolean(assessment.paidAt),
      paidAt: toIso(assessment.paidAt),
      stripeSessionId: assessment.stripeSessionId || null,
      requestedProviderContact,
      urgency: null,
      budgetRange: assessment.budgetRange || null,
    },
    consent: {
      privacyAccepted: input.consent.privacyAccepted,
      providerContactAccepted: input.consent.providerContactAccepted,
      analyticsAggregationAccepted: input.consent.analyticsAggregationAccepted,
      acceptedAt: input.consent.acceptedAt || null,
      consentVersion: input.consent.consentVersion,
    },
    routing: {
      targetSystem: "anclora-nexus",
      suggestedPipeline: "energy_assessments",
      priority: demo ? "low" : requestedProviderContact ? "high" : "normal",
      tags,
    },
    metadata: {
      locale: input.metadata.locale,
      currency: input.metadata.currency,
      units: input.metadata.units,
      sourceUrl: input.metadata.sourceUrl || null,
      userAgentHash: input.metadata.userAgentHash || null,
    },
  };
}
