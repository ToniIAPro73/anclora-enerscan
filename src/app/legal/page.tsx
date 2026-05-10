import type { Metadata } from 'next';
import { LocalizedLegalDocument } from '@/components/LocalizedLegalDocument';

export const metadata: Metadata = {
  title: 'Aviso legal | Anclora EnergyScan',
  description: 'Aviso legal de Anclora EnergyScan.',
};

export default function LegalNoticePage() {
  return <LocalizedLegalDocument kind="legal" />;
}
