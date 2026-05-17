import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { citySeoData, getCityBySlug } from '@/lib/seo/city-data';

export function generateStaticParams() {
  return citySeoData.map((city) => ({ slug: city.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) return {};
  const copy = getMonetizationCopy('es').seoCity;
  return {
    title: copy.metadataTitle(city.name),
    description: copy.metadataDescription(city.name),
  };
}

export default function CitySeoPage({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language);
  const defaults = language === 'en' ? { currency: 'GBP', units: 'imperial' } : { currency: 'EUR', units: 'metric' };
  const faq = copy.seoCity.faq;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <p className="text-xs font-bold uppercase text-[#00DC82]">{city.region} · {city.province}</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-premium">{copy.seoCity.h1(city.name)}</h1>
        <p className="mt-5 text-muted">{copy.seoCity.intro}</p>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.seoCity.measures.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-heading text-lg font-bold">{item}</h2>
              <p className="mt-2 text-sm text-muted">{copy.seoCity.measureCopy}</p>
            </article>
          ))}
        </section>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/wizard?source=seo_city&city=${city.slug}`} className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.common.analyzeFree}</Link>
          <a href={`/api/assessment/demo/pdf?lang=${language}&currency=${defaults.currency}&units=${defaults.units}`} className="rounded-full border border-white/10 px-6 py-3 font-bold">{copy.seoCity.premiumExample}</a>
        </div>
        <section className="mt-10 space-y-4">
          <h2 className="font-heading text-2xl font-bold">{copy.seoCity.faqTitle}</h2>
          {faq.map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-bold">{question}</h3>
              <p className="mt-1 text-sm text-muted">{answer}</p>
            </div>
          ))}
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([name, acceptedAnswer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: acceptedAnswer } })) }) }} />
        <p className="mt-8 rounded-2xl border border-[#FFB020]/30 bg-[#FFB020]/10 p-4 text-sm text-[#FFB020]">{copy.common.legalNotice}</p>
      </main>
      <Footer />
    </div>
  );
}
