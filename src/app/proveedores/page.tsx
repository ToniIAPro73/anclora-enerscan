import { cookies } from 'next/headers';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default function ProvidersLandingPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).provider;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.landingTitle}</h1>
        <p className="mt-4 max-w-3xl text-muted">{copy.landingIntro}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.cards.map((title) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-muted">{copy.cardCopy}</p></div>
          ))}
        </div>
        <Link href="/provider/register" className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.registerCta}</Link>
      </main>
      <Footer />
    </div>
  );
}
