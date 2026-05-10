export type AppTheme = "dark" | "light" | "system";
export type ThemeMode = AppTheme;
export type AppLanguage = "es" | "en" | "de";
export type AppCurrency = "EUR" | "GBP";
export type MeasurementSystem = "metric" | "imperial";

export type AppPreferences = {
  theme: AppTheme;
  language: AppLanguage;
  currency: AppCurrency;
  measurementSystem: MeasurementSystem;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "dark",
  language: "es",
  currency: "EUR",
  measurementSystem: "metric",
};

export const themeModes: AppTheme[] = ["dark", "light", "system"];
export const languages: AppLanguage[] = ["es", "en", "de"];
export const currencies: AppCurrency[] = ["EUR", "GBP"];
export const measurementSystems: MeasurementSystem[] = ["metric", "imperial"];

export const PREFERENCE_COOKIE_NAMES = {
  theme: "enerscan-theme",
  language: "enerscan-language",
  currency: "enerscan-currency",
  measurementSystem: "enerscan-measurement-system",
} as const;

export function getPreferencesForLanguage(language: AppLanguage): Pick<AppPreferences, "currency" | "measurementSystem"> {
  if (language === "en") return { currency: "GBP", measurementSystem: "imperial" };
  return { currency: "EUR", measurementSystem: "metric" };
}

export function normalizeTheme(value: unknown): AppTheme {
  return value === "light" || value === "system" ? value : DEFAULT_PREFERENCES.theme;
}

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === "en" || value === "de" ? value : DEFAULT_PREFERENCES.language;
}

export function normalizeCurrency(value: unknown): AppCurrency {
  return value === "GBP" ? "GBP" : DEFAULT_PREFERENCES.currency;
}

export function normalizeMeasurementSystem(value: unknown): MeasurementSystem {
  return value === "imperial" ? "imperial" : DEFAULT_PREFERENCES.measurementSystem;
}

export function normalizePreferences(value: Partial<Record<keyof AppPreferences, unknown>>): AppPreferences {
  return {
    theme: normalizeTheme(value.theme),
    language: normalizeLanguage(value.language),
    currency: normalizeCurrency(value.currency),
    measurementSystem: normalizeMeasurementSystem(value.measurementSystem),
  };
}
