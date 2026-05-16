'use client';

import { FileText, LockKeyhole } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';

export function PdfPreview() {
  const { dictionary: t } = usePreferences();

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0F0F0F] p-4 text-left shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-premium">
          <FileText className="h-5 w-5 text-[#00DC82]" />
          <span className="font-heading text-sm font-bold">{t.premiumPreviewTitle}</span>
        </div>
        <LockKeyhole className="h-4 w-4 text-[#FFB020]" />
      </div>
      <div className="space-y-3">
        {[t.paywallFeatureScenarios, t.paywallFeatureCosts, t.paywallFeatureRegulation, t.paywallFeatureAnnex].map((item, index) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 h-2 w-20 rounded bg-[#00DC82]/40" />
            <p className="text-xs font-semibold text-premium">{item}</p>
            <div className="mt-2 h-2 w-full rounded bg-white/10" />
            <div className="mt-1 h-2 w-2/3 rounded bg-white/10" />
            {index > 0 && <div className="mt-2 h-px bg-white/10" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">{t.premiumPreviewCopy}</p>
    </div>
  );
}
