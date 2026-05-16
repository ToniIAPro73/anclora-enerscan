import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { citySeoData, getCityBySlug } from '@/lib/seo/city-data';

export function generateStaticParams() {
  return citySeoData.map((city) => ({ slug: city.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) return {};
  return {
    title: `Reforma energetica en ${city.name}: costes, ayudas y prediagnostico`,
    description: `Guia orientativa para reformar energeticamente una vivienda en ${city.name}. Costes, contexto normativo y prediagnostico EnergyScan.`,
  };
}

export default function CitySeoPage({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();
  const faq = [
    ['¿EnergyScan emite certificados oficiales?', 'No. EnergyScan ofrece un prediagnostico orientativo y no sustituye el CEE oficial ni tiene validez administrativa.'],
    ['¿Los costes son cerrados?', 'No. Son rangos orientativos que deben validarse con mediciones, calidades, proveedores y fuentes oficiales.'],
    ['¿Puedo pedir presupuesto despues?', 'Si, puedes solicitar contacto con proveedores seleccionados aceptando el consentimiento correspondiente.'],
  ];
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <p className="text-xs font-bold uppercase text-[#00DC82]">{city.region} · {city.province}</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-premium">Reforma energetica en {city.name}: costes, ayudas y prediagnostico</h1>
        <p className="mt-5 text-muted">EnergyScan ayuda a ordenar datos de vivienda, documentos y escenarios de mejora antes de pedir presupuestos. Es una estimacion orientativa basada en datos declarados o documentos aportados.</p>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {['Ventanas eficientes', 'Aislamiento termico', 'Aerotermia y renovables'].map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-heading text-lg font-bold">{item}</h2>
              <p className="mt-2 text-sm text-muted">Rangos de coste y ahorro variables segun superficie, estado inicial, calidades y clima. Consulta fuentes oficiales para ayudas activas.</p>
            </article>
          ))}
        </section>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/wizard?source=seo_city&city=${city.slug}`} className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Analizar mi vivienda gratis</Link>
          <Link href="/api/assessment/demo" className="rounded-full border border-white/10 px-6 py-3 font-bold">Ver ejemplo Premium</Link>
        </div>
        <section className="mt-10 space-y-4">
          <h2 className="font-heading text-2xl font-bold">Preguntas frecuentes</h2>
          {faq.map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-bold">{question}</h3>
              <p className="mt-1 text-sm text-muted">{answer}</p>
            </div>
          ))}
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([name, acceptedAnswer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: acceptedAnswer } })) }) }} />
        <p className="mt-8 rounded-2xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-4 text-sm text-[#FFB020]">Estimacion orientativa. No sustituye al Certificado de Eficiencia Energetica oficial ni a la revision de un tecnico cualificado.</p>
      </main>
      <Footer />
    </div>
  );
}
