'use client';

import { FormEvent, useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';

type ReviewSummary = {
  id: string;
  summary?: {
    detectedItems?: number;
    totalAmount?: number;
    confidence?: number;
    alert?: string;
  };
};

export function BudgetReviewUploader() {
  const { language } = usePreferences();
  const copy = getMonetizationCopy(language).budgetReview;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const text = String(new FormData(event.currentTarget).get('text') || '');
    try {
      const response = await fetch('/api/budget-review/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || copy.analyzeFailed);
      setReview(data.review);
      setSourceFileName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.analyzeFailed);
    } finally {
      setLoading(false);
    }
  }

  async function analyzePdf(file: File) {
    setLoading(true);
    setError('');
    setSourceFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/budget-review/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || copy.analyzeFailed);
      setReview(data.review);
    } catch (err) {
      setReview(null);
      setError(err instanceof Error ? err.message : copy.analyzeFailed);
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    if (!review) return;
    setLoading(true);
    const response = await fetch('/api/budget-review/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetReviewId: review.id }),
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
    else {
      setError(data.error || copy.checkoutFailed);
      setLoading(false);
    }
  }

  return (
    <section className="surface border rounded-3xl p-6 lg:p-8">
      <form onSubmit={analyze} className="space-y-4">
        <textarea name="text" rows={10} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm" placeholder={copy.placeholder} />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) analyzePdf(file);
            event.currentTarget.value = '';
          }}
        />
        <div className="flex flex-wrap gap-3">
          <button disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f] disabled:opacity-60">
            <FileText className="h-4 w-4" />
            {loading ? copy.analyzing : copy.analyze}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-[#00DC82]/30 px-6 py-3 font-bold text-[#00DC82] hover:bg-[#00DC82]/10 disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            {loading ? copy.analyzing : copy.uploadPdf}
          </button>
        </div>
      </form>
      {error && <p className="mt-4 text-sm text-[#EF4444]">{error}</p>}
      {review && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-heading text-xl font-bold">{copy.freeResult}</h2>
          {sourceFileName && <p className="mt-2 text-xs text-muted">{copy.pdfImported}: {sourceFileName}</p>}
          <p className="mt-2 text-sm text-muted">{copy.detectedItems}: {review.summary?.detectedItems || 0}</p>
          <p className="text-sm text-muted">{copy.detectedTotal}: {review.summary?.totalAmount || '---'} EUR</p>
          <p className="text-sm text-muted">{copy.confidence}: {Math.round((review.summary?.confidence || 0) * 100)}%</p>
          <p className="mt-3 text-sm text-[#FFB020]">{review.summary?.alert}</p>
          <button onClick={checkout} disabled={loading} className="mt-4 rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.unlock}</button>
          <p className="mt-3 text-xs text-muted">{copy.legal}</p>
        </div>
      )}
    </section>
  );
}
