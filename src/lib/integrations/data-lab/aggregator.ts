import type { AreaBucket, ConstructionYearBucket, EnergySignalAggregate } from "./schema";

export type EnergySignalAssessmentInput = {
  id?: string | null;
  province?: string | null;
  municipality?: string | null;
  postalCode?: string | null;
  propertyType?: string | null;
  year?: number | null;
  area?: number | null;
  score?: number | null;
  confidence?: number | null;
  estimatedLetter?: string | null;
  paidAt?: Date | string | null;
  providerRequested?: boolean | null;
  regulatoryGap?: string | null;
  improvementPotential?: string | null;
};

type AggregationOptions = {
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  minGroupSize?: number;
};

export function getConstructionYearBucket(year?: number | null): ConstructionYearBucket {
  if (!year) return "unknown";
  if (year < 1980) return "pre_1980";
  if (year <= 2006) return "1980_2006";
  if (year <= 2019) return "2007_2019";
  return "2020_plus";
}

export function getAreaBucket(area?: number | null): AreaBucket {
  if (!area) return "unknown";
  if (area < 60) return "lt_60";
  if (area <= 100) return "60_100";
  if (area <= 180) return "100_180";
  return "180_plus";
}

function getPostalPrefix(postalCode?: string | null) {
  return postalCode && postalCode.length >= 2 ? postalCode.slice(0, 2) : null;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function getScoreBucket(score?: number | null): "low" | "medium" | "high" | null {
  if (typeof score !== "number") return null;
  if (score < 50) return "low";
  if (score < 75) return "medium";
  return "high";
}

function stableBucket<T extends string>(values: T[], fallback: T): T {
  return values.length > 0 && values.every((value) => value === values[0]) ? values[0] : fallback;
}

export function buildEnergySignalAggregates(
  assessments: EnergySignalAssessmentInput[],
  options: AggregationOptions,
): EnergySignalAggregate[] {
  const minGroupSize = options.minGroupSize || 5;
  const groups = new Map<string, EnergySignalAssessmentInput[]>();

  for (const assessment of assessments) {
    const key = [
      assessment.province || "",
      assessment.municipality || "",
      getPostalPrefix(assessment.postalCode) || "",
      assessment.propertyType || "",
    ].join("|");
    groups.set(key, [...(groups.get(key) || []), assessment]);
  }

  return Array.from(groups.values())
    .filter((group) => group.length >= minGroupSize)
    .map((group) => {
      const first = group[0];
      const scores = group.map((item) => item.score).filter((value): value is number => typeof value === "number");
      const confidences = group.map((item) => item.confidence).filter((value): value is number => typeof value === "number");
      const ratingBuckets: Record<string, number> = {};
      const scoreBuckets = { low: 0, medium: 0, high: 0 };

      for (const item of group) {
        if (item.estimatedLetter) {
          ratingBuckets[item.estimatedLetter] = (ratingBuckets[item.estimatedLetter] || 0) + 1;
        }
        const bucket = getScoreBucket(item.score);
        if (bucket) scoreBuckets[bucket] += 1;
      }

      return {
        schemaVersion: "1.0",
        sourceSystem: "anclora-energyscan",
        aggregationWindow: {
          from: options.from,
          to: options.to,
          granularity: options.granularity,
        },
        geography: {
          country: "ES",
          province: first.province || null,
          municipality: first.municipality || null,
          postalCodePrefix: getPostalPrefix(first.postalCode),
        },
        segment: {
          propertyType: first.propertyType || null,
          constructionYearBucket: stableBucket(group.map((item) => getConstructionYearBucket(item.year)), "unknown"),
          areaBucket: stableBucket(group.map((item) => getAreaBucket(item.area)), "unknown"),
        },
        metrics: {
          assessmentCount: group.length,
          premiumUnlockedCount: group.filter((item) => Boolean(item.paidAt)).length,
          providerRequestCount: group.filter((item) => Boolean(item.providerRequested)).length,
          averageScore: average(scores),
          averageConfidence: average(confidences),
          highImprovementPotentialCount: group.filter((item) => item.improvementPotential === "high").length,
          regulatoryGapCount: group.filter((item) => Boolean(item.regulatoryGap)).length,
        },
        distribution: {
          ratingBuckets,
          scoreBuckets,
        },
        privacy: {
          anonymized: true,
          minGroupSize,
          piiIncluded: false,
          aggregationRule: "k-anonymity-threshold",
        },
      } satisfies EnergySignalAggregate;
    });
}
