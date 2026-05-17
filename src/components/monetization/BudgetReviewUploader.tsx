'use client';

import { FormEvent, useState } from 'react';

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
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo analizar');
      setReview(data.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar');
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
      setError(data.error || 'No se pudo iniciar el pago');
      setLoading(false);
    }
  }

  return (
    <section className="surface border rounded-3xl p-6 lg:p-8">
      <form onSubmit={analyze} className="space-y-4">
        <textarea name="text" rows={10} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm" placeholder="Pega aqui el texto de tu presupuesto de reforma..." />
        <button disabled={loading} className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f] disabled:opacity-60">{loading ? 'Analizando...' : 'Analizar presupuesto'}</button>
      </form>
      {error && <p className="mt-4 text-sm text-[#EF4444]">{error}</p>}
      {review && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-heading text-xl font-bold">Resultado gratuito</h2>
          <p className="mt-2 text-sm text-muted">Partidas detectadas: {review.summary?.detectedItems || 0}</p>
          <p className="text-sm text-muted">Total detectado: {review.summary?.totalAmount || '---'} EUR</p>
          <p className="text-sm text-muted">Confianza: {Math.round((review.summary?.confidence || 0) * 100)}%</p>
          <p className="mt-3 text-sm text-[#FFB020]">{review.summary?.alert}</p>
          <button onClick={checkout} disabled={loading} className="mt-4 rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Desbloquear informe completo 19,90 EUR</button>
          <p className="mt-3 text-xs text-muted">Analisis automatico orientativo. No sustituye la revision de un tecnico, arquitecto, aparejador ni asesor legal.</p>
        </div>
      )}
    </section>
  );
}
