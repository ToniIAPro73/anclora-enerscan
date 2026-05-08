'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppLanguage, normalizeLanguage, normalizeTheme, ThemeMode } from '@/lib/preferences';
import { dictionaries, Dictionary } from '@/lib/i18n';

type PreferencesContextValue = {
  language: AppLanguage;
  theme: ThemeMode;
  dictionary: Dictionary;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemeMode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function persistCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  root.dataset.theme = theme;
  root.classList.toggle('light', resolved === 'light');
  root.classList.toggle('dark', resolved === 'dark');
}

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('es');
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const storedLanguage = normalizeLanguage(localStorage.getItem('enerscan-language'));
    const storedTheme = normalizeTheme(localStorage.getItem('enerscan-theme'));
    setLanguageState(storedLanguage);
    setThemeState(storedTheme);
    document.documentElement.lang = storedLanguage;
    applyTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    theme,
    dictionary: dictionaries[language],
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage);
      localStorage.setItem('enerscan-language', nextLanguage);
      persistCookie('enerscan-language', nextLanguage);
      document.documentElement.lang = nextLanguage;
    },
    setTheme(nextTheme) {
      setThemeState(nextTheme);
      localStorage.setItem('enerscan-theme', nextTheme);
      persistCookie('enerscan-theme', nextTheme);
      applyTheme(nextTheme);
    },
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within AppPreferencesProvider');
  }
  return context;
}
