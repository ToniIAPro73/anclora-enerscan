import type { Metadata } from 'next';
import { LocalizedLegalDocument } from '@/components/LocalizedLegalDocument';

export const metadata: Metadata = {
  title: 'Términos del servicio | Anclora EnergyScan',
  description: 'Condiciones de uso de Anclora EnergyScan.',
};

export default function TermsPage() {
  return <LocalizedLegalDocument kind="terms" />;
}
