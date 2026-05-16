import { z } from "zod";

export const providerHandoffRequestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sourceSystem: z.literal("anclora-energyscan"),
  targetSystem: z.literal("anclora-synergi"),
  eventType: z.literal("provider_handoff_requested"),
  occurredAt: z.string().datetime(),
  assessment: z.object({
    id: z.string().min(1),
    demo: z.boolean(),
    score: z.number().nullable().optional(),
    rating: z.string().nullable().optional(),
    confidence: z.number().nullable().optional(),
    improvementPotential: z.enum(["low", "medium", "high"]).nullable().optional(),
  }),
  propertyContext: z.object({
    province: z.string().nullable().optional(),
    municipality: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    propertyType: z.string().nullable().optional(),
    constructionYear: z.number().nullable().optional(),
    builtAreaM2: z.number().nullable().optional(),
    usefulAreaM2: z.number().nullable().optional(),
  }),
  requestedServices: z.array(z.enum([
    "cee_official_certificate",
    "insulation",
    "hvac",
    "solar_pv",
    "windows",
    "full_retrofit",
    "audit_visit",
    "subsidy_advisory",
  ])).min(1),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    preferredLanguage: z.enum(["es", "en", "de"]),
  }),
  consent: z.object({
    providerContactAccepted: z.literal(true),
    privacyAccepted: z.literal(true),
    acceptedAt: z.string().datetime(),
    consentVersion: z.string().min(1),
    consentTextSnapshot: z.string().min(1),
  }),
  routing: z.object({
    priority: z.enum(["normal", "high"]),
    preferredProviderType: z.enum(["certifier", "installer", "advisor", "retrofit_company"]).nullable().optional(),
    territory: z.enum(["mallorca", "ibiza", "menorca", "balearic_islands", "spain", "unknown"]),
  }),
  metadata: z.object({
    locale: z.enum(["es", "en", "de"]),
    sourceUrl: z.string().nullable().optional(),
  }),
});

export type ProviderHandoffRequest = z.infer<typeof providerHandoffRequestSchema>;
export type RequestedProviderService = ProviderHandoffRequest["requestedServices"][number];
