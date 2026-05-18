'use client';

import { FormEvent, useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';

type FindingStatus = 'IN_RANGE' | 'HIGH_REVIEW' | 'LOW_REVIEW' | 'INCOMPLETE' | 'REQUIRES_CLARIFICATION';

type AdvancedFinding = {
  description: string;
  total?: number | null;
  unitPrice?: number | null;
  status: FindingStatus;
};

type ReviewSummary = {
  id: string;
  summary?: {
    detectedItems?: number;
    totalAmount?: number;
    confidence?: number;
    alert?: string;
  };
  advancedAnalysis?: {
    category: string;
    findings: AdvancedFinding[];
    omissions: { item: string }[];
    suggestedQuestions: string[];
    legalNotice: string;
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
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-heading text-xl font-bold">{copy.freeResult}</h2>
          {sourceFileName && <p className="text-xs text-muted">{copy.pdfImported}: {sourceFileName}</p>}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span>{copy.detectedItems}: <strong className="text-foreground">{review.summary?.detectedItems || 0}</strong></span>
            <span>{copy.detectedTotal}: <strong className="text-foreground">{review.summary?.totalAmount ?? '---'} EUR</strong></span>
            <span>{copy.confidence}: <strong className="text-foreground">{Math.round((review.summary?.confidence || 0) * 100)}%</strong></span>
          </div>
          {review.summary?.alert && <p className="text-sm text-[#FFB020]">{review.summary.alert}</p>}

          {review.advancedAnalysis && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
              <h3 className="font-semibold text-sm">{copy.advancedTitle}</h3>
              <p className="text-xs text-muted">{copy.categoryLabel}: <strong className="text-foreground">{review.advancedAnalysis.category}</strong></p>

              {review.advancedAnalysis.findings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2">{copy.findingsLabel}</p>
                  <div className="space-y-1">
                    {review.advancedAnalysis.findings.slice(0, 8).map((f, i) => {
                      const colorMap: Record<FindingStatus, string> = {
                        IN_RANGE: 'text-[#00DC82]',
                        HIGH_REVIEW: 'text-[#EF4444]',
                        LOW_REVIEW: 'text-[#FFB020]',
                        INCOMPLETE: 'text-[#FFB020]',
                        REQUIRES_CLARIFICATION: 'text-[#FFB020]',
                      };
                      const statusKey = `status${f.status}` as keyof typeof copy;
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`shrink-0 font-bold ${colorMap[f.status]}`}>●</span>
                          <span className="text-muted flex-1 truncate">{f.description}</span>
                          <span className={`shrink-0 ${colorMap[f.status]}`}>{copy[statusKey] as string}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {review.advancedAnalysis.omissions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1">{copy.omissionsLabel}</p>
                  <ul className="list-disc list-inside text-xs text-muted space-y-0.5">
                    {review.advancedAnalysis.omissions.slice(0, 4).map((o, i) => (
                      <li key={i}>{o.item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.advancedAnalysis.suggestedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1">{copy.questionsLabel}</p>
                  <ol className="list-decimal list-inside text-xs text-muted space-y-0.5">
                    {review.advancedAnalysis.suggestedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <button onClick={checkout} disabled={loading} className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.unlock}</button>
            <a href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 py-3 font-bold text-premium">{copy.dashboardCta}</a>
          </div>
          <p className="text-xs text-muted">{copy.legal}</p>
        </div>
      )}
    </section>
  );
}
