'use client';

import { usePreferences } from '@/components/AppPreferencesProvider';

export function AuthIntro() {
  const { dictionary: t } = usePreferences();
  return (
    <div className="max-w-xl space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#00DC82]">{t.authPrivateAccess}</p>
      <h1 className="font-heading text-4xl font-bold text-premium sm:text-5xl">{t.authHero}</h1>
      <p className="text-muted leading-relaxed">{t.authCopy}</p>
      <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-muted">
        {t.importantLegalCopy}
      </p>
    </div>
  );
}
