'use client';

import { useState } from 'react';
import { Eye, Loader2, LockKeyhole, PhoneCall } from 'lucide-react';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { PROVIDER_LEAD_STATUSES, type ProviderLeadStatus } from '@/lib/provider-leads';

type Contact = {
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
};

export function ProviderLeadActions({
  leadId,
  initialStatus,
  initiallyUnlocked,
  initialContact,
  credits,
}: {
  leadId: string;
  initialStatus: string;
  initiallyUnlocked: boolean;
  initialContact: Contact;
  credits: number;
}) {
  const { language } = usePreferences();
  const copy = getMonetizationCopy(language).provider;
  const [status, setStatus] = useState(initialStatus);
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [contact, setContact] = useState<Contact>(initialContact);
  const [loading, setLoading] = useState<'unlock' | 'status' | null>(null);
  const [error, setError] = useState('');

  async function unlock() {
    if (loading || unlocked) return;
    setLoading('unlock');
    setError('');
    const response = await fetch(`/api/provider/leads/${leadId}/unlock`, { method: 'POST' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error === 'no_credits' ? copy.noCredits : copy.actionError);
      setLoading(null);
      return;
    }
    setUnlocked(true);
    setContact({
      userName: payload.lead?.userName,
      userEmail: payload.lead?.userEmail,
      userPhone: payload.lead?.userPhone,
    });
    setLoading(null);
  }

  async function changeStatus(nextStatus: ProviderLeadStatus) {
    setLoading('status');
    setError('');
    const response = await fetch(`/api/provider/leads/${leadId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || copy.actionError);
    } else {
      setStatus(payload.lead?.status || nextStatus);
    }
    setLoading(null);
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
      {unlocked ? (
        <div className="rounded-2xl border border-[#00DC82]/20 bg-[#00DC82]/10 p-4 text-sm">
          <p className="mb-2 flex items-center gap-2 font-heading font-bold text-[#00DC82]">
            <PhoneCall className="h-4 w-4" /> {copy.contactUnlocked}
          </p>
          <div className="grid gap-1 text-premium">
            <span>{contact.userName || copy.contactNameFallback}</span>
            {contact.userEmail && <a href={`mailto:${contact.userEmail}`} className="break-all text-[#00DC82]">{contact.userEmail}</a>}
            {contact.userPhone && <a href={`tel:${contact.userPhone}`} className="text-[#00DC82]">{contact.userPhone}</a>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted">
            <LockKeyhole className="h-4 w-4" /> {copy.contactLocked}
          </p>
          {credits > 0 ? (
            <button
              type="button"
              onClick={unlock}
              disabled={loading === 'unlock'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#00DC82] px-5 py-2 font-heading text-sm font-bold text-[#07140f] disabled:opacity-70"
            >
              {loading === 'unlock' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {copy.unlockContact}
            </button>
          ) : (
            <a href="/provider/billing" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#00DC82]/30 px-5 py-2 font-heading text-sm font-bold text-[#00DC82]">
              {copy.buyCreditsCta}
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-bold uppercase text-muted" htmlFor={`status-${leadId}`}>{copy.commercialStatus}</label>
        <select
          id={`status-${leadId}`}
          value={status}
          disabled={loading === 'status'}
          onChange={(event) => changeStatus(event.target.value as ProviderLeadStatus)}
          className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-premium"
        >
          {PROVIDER_LEAD_STATUSES.map((item) => (
            <option key={item} value={item}>{copy.statusLabel[item]}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs font-semibold text-[#EF4444]">{error}</p>}
    </div>
  );
}
