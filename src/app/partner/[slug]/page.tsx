import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { getPartnerLanding, partnerLandings } from '@/lib/partners/partner-landing';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export function generateStaticParams() {
  return partnerLandings.map((partner) => ({ slug: partner.slug }));
}

export default function PartnerLandingPage({ params }: { params: { slug: string } }) {
  const partner = getPartnerLanding(params.slug);
  if (!partner) notFound();
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).partnerLanding;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <p className="text-xs font-bold uppercase text-[#00DC82]">{copy.badge}</p>
        <h1 className="mt-3 font-heading text-4xl font-bold">{partner.name}</h1>
        <p className="mt-4 max-w-3xl text-muted">{copy.intro}</p>
        <Link href={`/wizard?source=partner&partner=${partner.slug}&provider=${partner.providerId || ''}`} className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.cta}</Link>
      </main>
    </div>
  );
}
