import { energyAssessmentLeadSchema, type EnergyAssessmentLead } from "./schema";

type ClientEnv = Record<string, string | undefined>;
type ClientOptions = {
  env?: ClientEnv;
  fetchImpl?: typeof fetch;
};

type IntegrationResult =
  | { ok: true; skipped: true; reason: "missing_config" }
  | { ok: true; skipped: false; status: number }
  | { ok: false; skipped: false; status?: number; error: string };

function getEnv(options?: ClientOptions): ClientEnv {
  return options?.env || process.env;
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function sendEnergyAssessmentLeadToNexus(
  lead: EnergyAssessmentLead,
  options?: ClientOptions,
): Promise<IntegrationResult> {
  const env = getEnv(options);
  const apiUrl = env.NEXUS_API_URL;
  const token = env.NEXUS_SERVICE_TOKEN;
  const endpoint = env.NEXUS_ENERGY_LEAD_ENDPOINT || "/api/ingestion/energy-assessments";

  if (!apiUrl || !token) {
    return { ok: true, skipped: true, reason: "missing_config" };
  }

  const parsed = energyAssessmentLeadSchema.safeParse(lead);
  if (!parsed.success) {
    return { ok: false, skipped: false, error: "invalid_payload" };
  }

  try {
    const response = await (options?.fetchImpl || fetch)(joinUrl(apiUrl, endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      return { ok: false, skipped: false, status: response.status, error: "nexus_request_failed" };
    }

    return { ok: true, skipped: false, status: response.status };
  } catch (error) {
    return { ok: false, skipped: false, error: error instanceof Error ? error.message : "nexus_request_failed" };
  }
}
