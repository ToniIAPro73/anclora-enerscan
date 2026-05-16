'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function PricingCard({
  title,
  price,
  subtitle,
  features,
  cta,
  href,
  highlighted = false,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  href?: string;
  highlighted?: boolean;
}) {
  const className = highlighted
    ? 'surface border border-[#00DC82]/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#00DC82]/10'
    : 'surface-2 border rounded-2xl p-6 sm:p-8';

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="font-heading text-2xl font-bold text-premium">{title}</h3>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <p className="mt-5 font-heading text-3xl font-bold text-[#00DC82]">{price}</p>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00DC82]" />
            {feature}
          </li>
        ))}
      </ul>
      {href ? (
        <Link href={href} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00DC82] px-6 py-3 text-sm font-heading font-bold text-[#0A0A0A] transition hover:brightness-110">
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <button type="button" disabled className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-heading font-bold text-muted">
          {cta}
        </button>
      )}
    </div>
  );
}
