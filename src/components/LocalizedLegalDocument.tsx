'use client';

import { usePreferences } from './AppPreferencesProvider';
import LegalDocumentLayout from './LegalDocumentLayout';
import { getLegalContent, LegalPageKind } from '@/lib/legal-content';

export function LocalizedLegalDocument({ kind }: { kind: LegalPageKind }) {
  const { language } = usePreferences();
  const content = getLegalContent(language, kind);
  return <LegalDocumentLayout {...content} language={language} />;
}
