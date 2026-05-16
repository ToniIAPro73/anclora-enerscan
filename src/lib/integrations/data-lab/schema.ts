import { z } from "zod";

export const energySignalAggregateSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sourceSystem: z.literal("anclora-energyscan"),
  aggregationWindow: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    granularity: z.enum(["day", "week", "month"]),
  }),
  geography: z.object({
    country: z.literal("ES"),
    province: z.string().nullable().optional(),
    municipality: z.string().nullable().optional(),
    postalCodePrefix: z.string().nullable().optional(),
  }),
  segment: z.object({
    propertyType: z.string().nullable().optional(),
    constructionYearBucket: z.enum(["pre_1980", "1980_2006", "2007_2019", "2020_plus", "unknown"]),
    areaBucket: z.enum(["lt_60", "60_100", "100_180", "180_plus", "unknown"]),
  }),
  metrics: z.object({
    assessmentCount: z.number().int().nonnegative(),
    premiumUnlockedCount: z.number().int().nonnegative(),
    providerRequestCount: z.number().int().nonnegative(),
    averageScore: z.number().nullable().optional(),
    averageConfidence: z.number().nullable().optional(),
    highImprovementPotentialCount: z.number().int().nonnegative(),
    regulatoryGapCount: z.number().int().nonnegative(),
  }),
  distribution: z.object({
    ratingBuckets: z.record(z.string(), z.number().int().nonnegative()),
    scoreBuckets: z.object({
      low: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      high: z.number().int().nonnegative(),
    }),
  }),
  privacy: z.object({
    anonymized: z.literal(true),
    minGroupSize: z.number().int().positive(),
    piiIncluded: z.literal(false),
    aggregationRule: z.literal("k-anonymity-threshold"),
  }),
});

export type EnergySignalAggregate = z.infer<typeof energySignalAggregateSchema>;
export type ConstructionYearBucket = EnergySignalAggregate["segment"]["constructionYearBucket"];
export type AreaBucket = EnergySignalAggregate["segment"]["areaBucket"];
