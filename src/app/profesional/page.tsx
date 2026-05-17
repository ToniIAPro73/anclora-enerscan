import Link from 'next/link';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export default function ProfessionalPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).professional;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-muted">{copy.intro}</p>
        <p className="mt-4 font-heading text-2xl font-bold text-[#00DC82]">{copy.price}</p>
        <p className="mt-3 text-sm text-muted">{copy.legal}</p>
        <Link href="/profesional/solicitar" className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.cta}</Link>
      </main>
    </div>
  );
}
