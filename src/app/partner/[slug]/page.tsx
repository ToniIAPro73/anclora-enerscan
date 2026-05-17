import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getPartnerLanding, partnerLandings } from '@/lib/partners/partner-landing';

export function generateStaticParams() {
  return partnerLandings.map((partner) => ({ slug: partner.slug }));
}

export default function PartnerLandingPage({ params }: { params: { slug: string } }) {
  const partner = getPartnerLanding(params.slug);
  if (!partner) notFound();
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <p className="text-xs font-bold uppercase text-[#00DC82]">Partner EnergyScan</p>
        <h1 className="mt-3 font-heading text-4xl font-bold">{partner.name}</h1>
        <p className="mt-4 max-w-3xl text-muted">Realiza un preanalisis orientativo con Anclora EnergyScan antes de solicitar presupuesto. El analisis no sustituye el Certificado de Eficiencia Energetica oficial ni una revision tecnica cualificada.</p>
        <Link href={`/wizard?source=partner&partner=${partner.slug}&provider=${partner.providerId || ''}`} className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Iniciar preanalisis</Link>
      </main>
    </div>
  );
}
