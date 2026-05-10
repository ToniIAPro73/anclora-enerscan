import type { AppCurrency, AppLanguage, MeasurementSystem } from "./preferences";

export const SQFT_PER_M2 = 10.76391041671;
export const DEFAULT_EUR_GBP_RATE = 0.86;

export function getLocale(language: AppLanguage): string {
  if (language === "en") return "en-GB";
  if (language === "de") return "de-DE";
  return "es-ES";
}

export function getConfiguredEurGbpRate(): number {
  const raw = process.env.NEXT_PUBLIC_EUR_GBP_RATE || process.env.EUR_GBP_RATE;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EUR_GBP_RATE;
}

export function convertCurrencyFromEur(valueEur: number, currency: AppCurrency, rate = getConfiguredEurGbpRate()): number {
  return currency === "GBP" ? valueEur * rate : valueEur;
}

export function formatCurrency(
  valueEur: number,
  currency: AppCurrency,
  options: { language?: AppLanguage; rate?: number; maximumFractionDigits?: number } = {}
): string {
  const language = options.language || (currency === "GBP" ? "en" : "es");
  const value = convertCurrencyFromEur(valueEur, currency, options.rate);
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency,
    minimumFractionDigits: options.maximumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(value);
}

export function convertArea(valueM2: number, measurementSystem: MeasurementSystem): number {
  return measurementSystem === "imperial" ? valueM2 * SQFT_PER_M2 : valueM2;
}

export function formatNumber(value: number, locale: AppLanguage): string {
  return new Intl.NumberFormat(getLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

export function formatArea(valueM2: number, measurementSystem: MeasurementSystem, language: AppLanguage = "es"): string {
  const converted = convertArea(valueM2, measurementSystem);
  const unit = measurementSystem === "imperial" ? "sq ft" : "m²";
  const maximumFractionDigits = converted < 10 ? 1 : 0;
  const value = new Intl.NumberFormat(getLocale(language), { maximumFractionDigits }).format(converted);
  return `${value} ${unit}`;
}

export function formatCostRange(
  minEur: number,
  maxEur: number,
  currency: AppCurrency,
  language: AppLanguage,
  midEur?: number
): string {
  const min = formatCurrency(minEur, currency, { language, maximumFractionDigits: 0 });
  const max = formatCurrency(maxEur, currency, { language, maximumFractionDigits: 0 });
  if (midEur && midEur > minEur && midEur < maxEur) {
    const ref = formatCurrency(midEur, currency, { language, maximumFractionDigits: 0 });
    const refLabel = language === "en" ? "ref." : language === "de" ? "Ref." : "ref.";
    return `${min} - ${max} (${refLabel} ${ref})`;
  }
  return `${min} - ${max}`;
}
