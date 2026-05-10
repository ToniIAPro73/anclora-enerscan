import type { Metadata } from 'next';
import { LocalizedLegalDocument } from '@/components/LocalizedLegalDocument';

export const metadata: Metadata = {
  title: 'Política de privacidad | Anclora EnergyScan',
  description: 'Política de privacidad de Anclora EnergyScan.',
};

export default function PrivacyPage() {
  return <LocalizedLegalDocument kind="privacy" />;
}
