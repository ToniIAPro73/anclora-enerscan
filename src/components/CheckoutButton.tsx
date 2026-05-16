'use client';

import { useState } from 'react';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';
import { trackEvent } from '@/lib/analytics';

export function CheckoutButton({ assessmentId }: { assessmentId: string }) {
  const { dictionary: t } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    setError(null);
    trackEvent('checkout_initiated', { assessmentId });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || t.checkoutError);
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : t.checkoutError);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#00DC82] px-8 py-4 font-heading font-bold text-[#0A0A0A] shadow-xl shadow-[#00DC82]/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
        {loading ? t.checkoutLoading : t.checkoutButton}
      </button>
      {error && <p className="max-w-md text-center text-xs font-semibold text-[#EF4444]">{error}</p>}
    </div>
  );
}
