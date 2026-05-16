import { energySignalAggregateSchema, type EnergySignalAggregate } from "./schema";

type ClientOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
};

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function sendEnergySignalsToDataLab(signals: EnergySignalAggregate[], options?: ClientOptions) {
  const env = options?.env || process.env;
  const apiUrl = env.DATA_LAB_API_URL;
  const token = env.DATA_LAB_SERVICE_TOKEN;
  const endpoint = env.DATA_LAB_ENERGY_SIGNALS_ENDPOINT || "/api/ingestion/energy-signals";

  if (!apiUrl || !token) {
    return { ok: true, skipped: true, reason: "missing_config" as const };
  }

  const validSignals = signals.map((signal) => energySignalAggregateSchema.parse(signal));
  try {
    const response = await (options?.fetchImpl || fetch)(joinUrl(apiUrl, endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ signals: validSignals }),
    });
    if (!response.ok) return { ok: false, skipped: false, status: response.status, error: "data_lab_request_failed" };
    return { ok: true, skipped: false, status: response.status };
  } catch (error) {
    return { ok: false, skipped: false, error: error instanceof Error ? error.message : "data_lab_request_failed" };
  }
}
