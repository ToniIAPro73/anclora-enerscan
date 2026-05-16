import { providerHandoffRequestSchema, type ProviderHandoffRequest } from "./schema";

type ClientOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
};

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function sendProviderHandoffToSynergi(payload: ProviderHandoffRequest, options?: ClientOptions) {
  const env = options?.env || process.env;
  const apiUrl = env.SYNERGI_API_URL;
  const token = env.SYNERGI_SERVICE_TOKEN;
  const endpoint = env.SYNERGI_PROVIDER_HANDOFF_ENDPOINT || "/api/ingestion/provider-handoffs";

  if (!apiUrl || !token) {
    return { ok: true, skipped: true, reason: "missing_config" as const };
  }

  const parsed = providerHandoffRequestSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, skipped: false, error: "invalid_payload" };
  if (parsed.data.assessment.demo) return { ok: true, skipped: true, reason: "demo_assessment" as const };

  try {
    const response = await (options?.fetchImpl || fetch)(joinUrl(apiUrl, endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) return { ok: false, skipped: false, status: response.status, error: "synergi_request_failed" };
    return { ok: true, skipped: false, status: response.status };
  } catch (error) {
    return { ok: false, skipped: false, error: error instanceof Error ? error.message : "synergi_request_failed" };
  }
}
