import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const energyAssessmentLeadSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sourceSystem: z.literal("anclora-energyscan"),
  sourceChannel: z.enum(["energy_assessment", "premium_report", "provider_request"]),
  eventType: z.enum(["energy_assessment_created", "premium_report_paid", "provider_contact_requested"]),
  occurredAt: z.string().datetime(),
  assessment: z.object({
    id: z.string().min(1),
    publicId: nullableString,
    demo: z.boolean(),
    status: z.enum(["draft", "completed", "premium_unlocked", "provider_requested"]),
    score: nullableNumber,
    rating: nullableString,
    confidence: nullableNumber,
    regulatoryGap: nullableString,
    improvementPotential: z.enum(["low", "medium", "high"]).nullable().optional(),
  }),
  property: z.object({
    country: z.literal("ES"),
    province: nullableString,
    municipality: nullableString,
    postalCode: nullableString,
    addressLabel: nullableString,
    cadastralReference: nullableString,
    propertyType: nullableString,
    constructionYear: nullableNumber,
    builtAreaM2: nullableNumber,
    usefulAreaM2: nullableNumber,
  }),
  contact: z.object({
    name: nullableString,
    email: nullableString,
    phone: nullableString,
    preferredLanguage: z.enum(["es", "en", "de"]).nullable().optional(),
  }).nullable().optional(),
  commercial: z.object({
    premiumUnlocked: z.boolean(),
    paidAt: nullableString,
    stripeSessionId: nullableString,
    requestedProviderContact: z.boolean(),
    urgency: z.enum(["low", "medium", "high"]).nullable().optional(),
    budgetRange: nullableString,
  }),
  consent: z.object({
    privacyAccepted: z.boolean(),
    providerContactAccepted: z.boolean(),
    analyticsAggregationAccepted: z.boolean().optional(),
    acceptedAt: nullableString,
    consentVersion: z.string().min(1),
  }),
  routing: z.object({
    targetSystem: z.literal("anclora-nexus"),
    suggestedPipeline: z.literal("energy_assessments"),
    priority: z.enum(["low", "normal", "high"]),
    tags: z.array(z.string()),
  }),
  metadata: z.object({
    locale: z.enum(["es", "en", "de"]),
    currency: z.enum(["EUR", "GBP"]),
    units: z.enum(["metric", "imperial"]),
    sourceUrl: nullableString,
    userAgentHash: nullableString,
  }),
});

export type EnergyAssessmentLead = z.infer<typeof energyAssessmentLeadSchema>;
