'use client';

import type React from 'react';
import { Coins, Languages, Monitor, Moon, Ruler, Settings2, Sun } from 'lucide-react';
import { useState } from 'react';
import {
  AppCurrency,
  AppLanguage,
  AppTheme,
  currencies,
  languages,
  MeasurementSystem,
  measurementSystems,
  themeModes,
} from '@/lib/preferences';
import { usePreferences } from './AppPreferencesProvider';

const themeLabels: Record<AppTheme, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  dark: { label: 'Dark', icon: Moon },
  light: { label: 'Light', icon: Sun },
  system: { label: 'System', icon: Monitor },
};

const languageLabels: Record<AppLanguage, string> = {
  es: 'ES',
  en: 'EN',
  de: 'DE',
};

const currencyLabels: Record<AppCurrency, string> = {
  EUR: '€',
  GBP: '£',
};

const measurementLabels: Record<MeasurementSystem, string> = {
  metric: 'm²',
  imperial: 'sq ft',
};

export function PreferenceToggles({ compact = false, variant = 'inline' }: { compact?: boolean; variant?: 'inline' | 'popover' }) {
  const {
    theme,
    language,
    currency,
    measurementSystem,
    setTheme,
    setLanguage,
    setCurrency,
    setMeasurementSystem,
  } = usePreferences();
  const [open, setOpen] = useState(false);

  const groups = (
    <div className={`flex ${compact ? 'items-center gap-1.5' : 'flex-wrap items-center gap-3'}`}>
      <div className="premium-toggle" role="group" aria-label="Theme selector">
        {themeModes.map((mode) => {
          const Icon = themeLabels[mode].icon;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={`premium-toggle-option ${theme === mode ? 'is-active' : ''}`}
              aria-pressed={theme === mode}
              title={themeLabels[mode].label}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{themeLabels[mode].label}</span>
            </button>
          );
        })}
      </div>

      <PreferenceGroup icon={Languages} label="Language selector" compact={compact}>
        {languages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={`premium-toggle-option text-[11px] font-bold ${language === item ? 'is-active' : ''}`}
            aria-pressed={language === item}
            title={languageLabels[item]}
          >
            {languageLabels[item]}
          </button>
        ))}
      </PreferenceGroup>

      <PreferenceGroup icon={Coins} label="Currency selector" compact={compact}>
        {currencies.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCurrency(item)}
            className={`premium-toggle-option text-sm font-bold ${currency === item ? 'is-active' : ''}`}
            aria-pressed={currency === item}
            title={item}
          >
            {currencyLabels[item]}
          </button>
        ))}
      </PreferenceGroup>

      <PreferenceGroup icon={Ruler} label="Measurement selector" compact={compact}>
        {measurementSystems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMeasurementSystem(item)}
            className={`premium-toggle-option px-2 text-[11px] font-bold ${measurementSystem === item ? 'is-active' : ''}`}
            aria-pressed={measurementSystem === item}
            title={measurementLabels[item]}
          >
            {measurementLabels[item]}
          </button>
        ))}
      </PreferenceGroup>
    </div>
  );

  if (variant === 'popover') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-premium transition hover:border-[#00DC82]/40"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Settings2 className="h-4 w-4 text-[#00DC82]" />
          <span>{languageLabels[language]} · {currencyLabels[currency]} · {measurementLabels[measurementSystem]}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[8600] rounded-3xl border border-white/10 bg-[#101010]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {groups}
          </div>
        )}
      </div>
    );
  }

  return groups;
}

function PreferenceGroup({
  icon: Icon,
  label,
  compact,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-toggle" role="group" aria-label={label}>
      {!compact && (
        <span className="flex h-7 w-7 items-center justify-center text-muted" aria-hidden="true">
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      {children}
    </div>
  );
}
