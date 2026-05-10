export type AppLanguage = "es" | "en" | "de";
export type ThemeMode = "dark" | "light" | "system";

export const languages: AppLanguage[] = ["es"];
export const themeModes: ThemeMode[] = ["dark", "light", "system"];

export function normalizeLanguage(value: unknown): AppLanguage {
  void value;
  return "es";
}

export function normalizeTheme(value: unknown): ThemeMode {
  return value === "light" || value === "system" ? value : "dark";
}
