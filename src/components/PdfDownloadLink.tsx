'use client';

import { Download } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';

export function PdfDownloadLink({ assessmentId, label }: { assessmentId: string; label?: string }) {
  const { language, currency, measurementSystem, dictionary: t } = usePreferences();
  const href = `/api/assessment/${assessmentId}/pdf?lang=${language}&currency=${currency}&units=${measurementSystem}`;

  return (
    <a
      href={href}
      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#00DC82] px-8 py-4 font-heading font-bold text-[#0A0A0A] shadow-xl shadow-[#00DC82]/20 transition hover:brightness-110"
      download
    >
      <Download className="h-5 w-5" /> {label || t.downloadPdf}
    </a>
  );
}
