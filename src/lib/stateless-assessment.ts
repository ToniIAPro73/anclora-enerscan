import { REGULATORY_TIMELINE } from "./regulatory";
import { calculateScoreV2 } from "./scoring";
import { generateScenarios } from "./simulator";
import {
  AssessmentAttachment,
  PremiumReportData,
  PropertyDataV2,
  ScoreResultV2,
} from "./domain/energy-assessment";

type StatelessAssessmentPayload = {
  propertyData: PropertyDataV2;
  scoreResult: ScoreResultV2;
  attachments?: AssessmentAttachment[];
  isDemo?: boolean;
  createdAt?: string;
};

const STATELESS_PREFIX = "local_";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createStatelessAssessmentId(payload: StatelessAssessmentPayload): string {
  return `${STATELESS_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

export function isStatelessAssessmentId(id: string): boolean {
  return id.startsWith(STATELESS_PREFIX);
}

export function parseStatelessAssessmentId(id: string): StatelessAssessmentPayload | null {
  if (!isStatelessAssessmentId(id)) return null;
  try {
    return JSON.parse(fromBase64Url(id.slice(STATELESS_PREFIX.length))) as StatelessAssessmentPayload;
  } catch {
    return null;
  }
}

export function createStatelessPayload(
  propertyData: PropertyDataV2,
  options: { attachments?: AssessmentAttachment[]; isDemo?: boolean } = {}
): StatelessAssessmentPayload {
  return {
    propertyData,
    scoreResult: calculateScoreV2(propertyData),
    attachments: options.attachments || [],
    isDemo: options.isDemo || false,
    createdAt: new Date().toISOString(),
  };
}

export function createReportDataFromPayload(id: string, payload: StatelessAssessmentPayload, language: "es" | "en" | "de" = "es"): PremiumReportData {
  return {
    id,
    date: new Date(payload.createdAt || Date.now()).toLocaleDateString(language === "es" ? "es-ES" : language === "de" ? "de-DE" : "en-US"),
    propertyData: payload.propertyData,
    scoreResult: payload.scoreResult,
    scenarios: generateScenarios(payload.propertyData, payload.scoreResult),
    regulatoryContext: REGULATORY_TIMELINE,
    providerCategories: ["aislamiento", "ventanas", "climatización", "acs", "fotovoltaica", "solar térmica", "certificador"],
    attachments: payload.attachments || [],
    language,
    isDemo: payload.isDemo,
  };
}
