'use client';

import type React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { AppLanguage, languages, themeModes, ThemeMode } from '@/lib/preferences';
import { usePreferences } from './AppPreferencesProvider';

const themeLabels: Record<ThemeMode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  dark: { label: 'Luna', icon: Moon },
  light: { label: 'Sol', icon: Sun },
  system: { label: 'Ordenador', icon: Monitor },
};

export function PreferenceToggles({ compact = false }: { compact?: boolean }) {
  const { theme, language, setTheme, setLanguage } = usePreferences();

  return (
    <div className={`flex ${compact ? 'items-center gap-2' : 'flex-wrap items-center gap-3'}`}>
      <div className="premium-toggle" role="group" aria-label="Selector de tema">
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
              {!compact && <span className="sr-only">{themeLabels[mode].label}</span>}
            </button>
          );
        })}
      </div>

      <div className="premium-toggle" role="group" aria-label="Selector de idioma">
        {languages.map((item: AppLanguage) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={`premium-toggle-option text-[11px] font-bold ${language === item ? 'is-active' : ''}`}
            aria-pressed={language === item}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
