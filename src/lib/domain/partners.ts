export type ProviderStatus = "PENDING" | "VERIFIED" | "PREFERRED" | "SUSPENDED" | "EXCLUSIVE";
export type ProviderCategory = "CEE" | "AUDIT" | "WINDOWS" | "INSULATION" | "HVAC" | "SOLAR" | "REFORM" | "ACS" | "OTHER";
export type PartnerType = "REAL_ESTATE" | "PROVIDER_REFERRER" | "AGENCY" | "CONSULTANT" | "INTERNAL";
export type PartnerStatus = "ACTIVE" | "PAUSED" | "SUSPENDED";
export type LeadStatus = "PENDING" | "CONTACTED" | "QUOTED" | "WON" | "LOST" | "CANCELLED";
export type LeadRequestedService =
  | "CEE"
  | "AUDIT"
  | "WINDOWS"
  | "INSULATION"
  | "HVAC"
  | "SOLAR"
  | "REFORM"
  | "REAL_ESTATE_VALUATION"
  | "OTHER";
export type LeadUrgency = "LOW" | "MEDIUM" | "HIGH" | "IMMEDIATE";
export type CommissionStatus = "NOT_APPLICABLE" | "PENDING" | "PAYABLE" | "PAID" | "DISPUTED";
export type AttributionOwner = "ANCLORA" | "PARTNER" | "PROVIDER" | "SHARED";

const categoryLabels: Record<string, string> = {
  CEE: "Certificación energética",
  AUDIT: "Auditoría energética",
  WINDOWS: "Ventanas",
  INSULATION: "Aislamiento",
  HVAC: "Climatización / aerotermia",
  SOLAR: "Fotovoltaica / renovables",
  REFORM: "Reforma",
  ACS: "Agua caliente sanitaria",
  REAL_ESTATE_VALUATION: "Valoración inmobiliaria",
  OTHER: "Otro servicio",
};

const providerStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  PREFERRED: "Preferente",
  SUSPENDED: "Suspendido",
  EXCLUSIVE: "Exclusivo",
};

const leadStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  QUOTED: "Presupuestado",
  WON: "Ganado",
  LOST: "Perdido",
  CANCELLED: "Cancelado",
};

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function formatProviderCategory(category: string): string {
  return categoryLabels[category] || category;
}

export function formatLeadStatus(status: string): string {
  return leadStatusLabels[status] || status;
}

export function formatProviderStatus(status: string): string {
  return providerStatusLabels[status] || status;
}

export function calculateAttributionExpiry(months: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  result.setMonth(result.getMonth() + Math.max(0, months));
  return result;
}

export function safeCentsToEuros(cents?: number | null): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "0,00 EUR";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function scoreProviderMatch(provider: {
  categories: string[] | string;
  zones: string[] | string;
  status: string;
  verified: boolean;
  rating?: number | null;
}, input: { category?: string; zone?: string }) {
  const categories = Array.isArray(provider.categories) ? provider.categories : parseJsonArray(provider.categories);
  const zones = Array.isArray(provider.zones) ? provider.zones : parseJsonArray(provider.zones);
  let score = 0;
  if (input.category && categories.includes(input.category)) score += 40;
  if (input.zone && zones.some((zone) => zone.toLowerCase().includes(input.zone!.toLowerCase()) || input.zone!.toLowerCase().includes(zone.toLowerCase()))) score += 25;
  if (provider.status === 'EXCLUSIVE') score += 20;
  if (provider.status === 'PREFERRED') score += 15;
  if (provider.status === 'VERIFIED') score += 10;
  if (provider.verified) score += 10;
  score += Math.round((provider.rating || 0) * 2);
  return score;
}
