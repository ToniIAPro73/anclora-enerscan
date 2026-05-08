export type AppLanguage = "es" | "en" | "de";
export type ThemeMode = "dark" | "light" | "system";

export const languages: AppLanguage[] = ["es", "en", "de"];
export const themeModes: ThemeMode[] = ["dark", "light", "system"];

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === "en" || value === "de" ? value : "es";
}

export function normalizeTheme(value: unknown): ThemeMode {
  return value === "light" || value === "system" ? value : "dark";
}
