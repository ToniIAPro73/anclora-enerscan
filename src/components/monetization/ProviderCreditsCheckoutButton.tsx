'use client';

import { useState } from 'react';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';

export function ProviderCreditsCheckoutButton() {
  const { language } = usePreferences();
  const copy = getMonetizationCopy(language).provider;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startCheckout() {
    setLoading(true);
    setError('');
    const response = await fetch('/api/provider/credits/checkout', { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error || copy.buyError);
    setLoading(false);
  }

  return (
    <div>
      <button type="button" onClick={startCheckout} disabled={loading} className="mt-4 rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f] disabled:opacity-60">
        {loading ? copy.buying : copy.buyPack}
      </button>
      {error && <p className="mt-2 text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
