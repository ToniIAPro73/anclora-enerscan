'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 'v1';
};

const STORAGE_KEY = 'anclora-cookie-consent-v1';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: '',
  version: 'v1',
};

function readPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      version: 'v1',
    };
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const { dictionary: t } = usePreferences();
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const stored = readPreferences();
    if (stored) {
      setPreferences(stored);
      return;
    }
    setIsOpen(true);
  }, []);

  const persist = (next: CookiePreferences) => {
    const value = { ...next, necessary: true as const, updatedAt: new Date().toISOString(), version: 'v1' as const };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setPreferences(value);
    setIsOpen(false);
    setShowSettings(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t.cookiesButtonLabel}
        onClick={() => {
          setIsOpen(true);
          setShowSettings(true);
        }}
        className="cookie-floating-btn fixed bottom-5 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#00DC82]/40 text-[#00DC82] shadow-[0_18px_50px_rgba(0,220,130,0.22)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#00DC82]"
      >
        <Cookie className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
          <div className="cookie-panel w-full max-w-lg rounded-3xl border border-[#00DC82]/20 p-6 shadow-2xl">
            {!showSettings ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">Anclora Group</p>
                  <h2 id="cookie-consent-title" className="font-heading text-2xl font-semibold">{t.cookiesTitle}</h2>
                  <p className="cookie-text-secondary mt-3 text-sm leading-6 text-white/70">{t.cookiesDescription}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => persist({ ...defaultPreferences, analytics: true, marketing: true })} className="rounded-full bg-[#00DC82] px-5 py-3 text-sm font-semibold text-[#04100b] transition hover:bg-[#31f29f]">{t.cookiesAcceptAll}</button>
                  <button type="button" onClick={() => setShowSettings(true)} className="cookie-border-btn rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00DC82]/60">{t.cookiesSettings}</button>
                  <button type="button" onClick={() => persist(defaultPreferences)} className="cookie-muted-btn rounded-full px-5 py-3 text-sm font-semibold text-white/70 transition hover:text-white">{t.cookiesRejectOptional}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 id="cookie-consent-title" className="font-heading text-2xl font-semibold">{t.cookiesManageTitle}</h2>
                  <p className="cookie-text-secondary mt-3 text-sm leading-6 text-white/70">{t.cookiesDescription}</p>
                </div>
                <div className="space-y-3">
                  <CookieRow title={t.cookiesNecessaryTitle} description={t.cookiesNecessaryDescription} checked disabled onChange={() => {}} />
                  <CookieRow title={t.cookiesAnalyticsTitle} description={t.cookiesAnalyticsDescription} checked={preferences.analytics} onChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))} />
                  <CookieRow title={t.cookiesMarketingTitle} description={t.cookiesMarketingDescription} checked={preferences.marketing} onChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))} />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setShowSettings(false)} className="cookie-muted-btn rounded-full px-5 py-3 text-sm font-semibold text-white/70 transition hover:text-white">{t.cookiesBack}</button>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => persist(defaultPreferences)} className="cookie-border-btn rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00DC82]/60">{t.cookiesRejectOptional}</button>
                    <button type="button" onClick={() => persist(preferences)} className="rounded-full bg-[#00DC82] px-5 py-3 text-sm font-semibold text-[#04100b] transition hover:bg-[#31f29f]">{t.cookiesSave}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function CookieRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="cookie-row-label flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span>
        <span className="cookie-row-title block text-sm font-semibold text-white">{title}</span>
        <span className="cookie-row-desc mt-1 block text-xs leading-5 text-white/60">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 accent-[#00DC82]"
      />
    </label>
  );
}
