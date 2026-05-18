'use client';

import { useState } from 'react';

const STATUSES = ['PENDING', 'VERIFIED', 'PREFERRED', 'SUSPENDED', 'EXCLUSIVE'] as const;
type ProviderStatus = typeof STATUSES[number];

const statusColors: Record<ProviderStatus, string> = {
  PENDING: 'bg-[#FFB020]/20 text-[#FFB020]',
  VERIFIED: 'bg-[#00DC82]/20 text-[#00DC82]',
  PREFERRED: 'bg-blue-500/20 text-blue-400',
  SUSPENDED: 'bg-[#EF4444]/20 text-[#EF4444]',
  EXCLUSIVE: 'bg-purple-500/20 text-purple-400',
};

export function ProviderStatusChanger({ providerId, currentStatus, statusLabel, labels }: {
  providerId: string;
  currentStatus: string;
  statusLabel: (s: string) => string;
  labels: { save: string; saving: string; saved: string; saveError: string };
}) {
  const [selected, setSelected] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (selected === currentStatus) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || labels.saveError);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
        disabled={saving}
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-premium"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{statusLabel(s)}</option>
        ))}
      </select>
      {selected !== currentStatus && (
        <button
          onClick={save}
          disabled={saving}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusColors[selected as ProviderStatus] ?? 'bg-white/5 text-muted'} disabled:opacity-50`}
        >
          {saving ? labels.saving : `✓ ${labels.save}`}
        </button>
      )}
      {saved && <span className="text-xs text-[#00DC82]">{labels.saved}</span>}
      {error && <span className="text-xs text-[#EF4444]">{error}</span>}
    </div>
  );
}
