'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppCurrency,
  AppLanguage,
  AppPreferences,
  AppTheme,
  DEFAULT_PREFERENCES,
  getPreferencesForLanguage,
  MeasurementSystem,
  normalizeCurrency,
  normalizeLanguage,
  normalizeMeasurementSystem,
  normalizePreferences,
  normalizeTheme,
  PREFERENCE_COOKIE_NAMES,
} from '@/lib/preferences';
import { convertArea, convertCurrencyFromEur, formatArea, formatCurrency, formatNumber } from '@/lib/formatters';
import { dictionaries, Dictionary } from '@/lib/i18n';

type PreferencesContextValue = AppPreferences & {
  preferences: AppPreferences;
  theme: AppTheme;
  language: AppLanguage;
  currency: AppCurrency;
  measurementSystem: MeasurementSystem;
  dictionary: Dictionary;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  setMeasurementSystem: (measurementSystem: MeasurementSystem) => void;
  setPreferences: (preferences: Partial<AppPreferences>) => void;
  formatCurrency: (valueEur: number, options?: { maximumFractionDigits?: number }) => string;
  formatArea: (valueM2: number) => string;
  formatNumber: (value: number) => string;
  convertArea: (valueM2: number) => number;
  convertCurrency: (valueEur: number) => number;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function persistCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function persistPreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
  const storageKey = PREFERENCE_COOKIE_NAMES[key];
  localStorage.setItem(storageKey, value);
  persistCookie(storageKey, value);
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  root.dataset.theme = theme;
  root.classList.toggle('light', resolved === 'light');
  root.classList.toggle('dark', resolved === 'dark');
}

function readStoredPreferences(): AppPreferences {
  const language = normalizeLanguage(localStorage.getItem(PREFERENCE_COOKIE_NAMES.language));
  const languagePreset = getPreferencesForLanguage(language);
  return normalizePreferences({
    theme: localStorage.getItem(PREFERENCE_COOKIE_NAMES.theme),
    language,
    currency: localStorage.getItem(PREFERENCE_COOKIE_NAMES.currency) || languagePreset.currency,
    measurementSystem: localStorage.getItem(PREFERENCE_COOKIE_NAMES.measurementSystem) || languagePreset.measurementSystem,
  });
}

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<AppPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = readStoredPreferences();
    setPreferencesState(stored);
    document.documentElement.lang = stored.language;
    applyTheme(stored.theme);
  }, []);

  useEffect(() => {
    if (preferences.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [preferences.theme]);

  const value = useMemo<PreferencesContextValue>(() => {
    const persistAll = (next: AppPreferences) => {
      persistPreference('theme', next.theme);
      persistPreference('language', next.language);
      persistPreference('currency', next.currency);
      persistPreference('measurementSystem', next.measurementSystem);
      document.documentElement.lang = next.language;
      applyTheme(next.theme);
    };

    const updatePreferences = (partial: Partial<AppPreferences>) => {
      setPreferencesState((current) => {
        const next = normalizePreferences({ ...current, ...partial });
        persistAll(next);
        return next;
      });
    };

    return {
      ...preferences,
      preferences,
      dictionary: dictionaries[preferences.language],
      setTheme(nextTheme) {
        updatePreferences({ theme: normalizeTheme(nextTheme) });
      },
      setLanguage(nextLanguage) {
        const language = normalizeLanguage(nextLanguage);
        updatePreferences({ language, ...getPreferencesForLanguage(language) });
      },
      setCurrency(nextCurrency) {
        updatePreferences({ currency: normalizeCurrency(nextCurrency) });
      },
      setMeasurementSystem(nextMeasurementSystem) {
        updatePreferences({ measurementSystem: normalizeMeasurementSystem(nextMeasurementSystem) });
      },
      setPreferences(nextPreferences) {
        updatePreferences(nextPreferences);
      },
      formatCurrency(valueEur, options) {
        return formatCurrency(valueEur, preferences.currency, {
          language: preferences.language,
          maximumFractionDigits: options?.maximumFractionDigits,
        });
      },
      formatArea(valueM2) {
        return formatArea(valueM2, preferences.measurementSystem, preferences.language);
      },
      formatNumber(valueNumber) {
        return formatNumber(valueNumber, preferences.language);
      },
      convertArea(valueM2) {
        return convertArea(valueM2, preferences.measurementSystem);
      },
      convertCurrency(valueEur) {
        return convertCurrencyFromEur(valueEur, preferences.currency);
      },
    };
  }, [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within AppPreferencesProvider');
  }
  return context;
}
