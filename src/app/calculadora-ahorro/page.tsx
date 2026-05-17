import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SavingsCalculator } from '@/components/monetization/SavingsCalculator';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { normalizeLanguage, PREFERENCE_COOKIE_NAMES } from '@/lib/preferences';

export const metadata = {
  title: getMonetizationCopy('es').calculator.metadataTitle,
  description: getMonetizationCopy('es').calculator.metadataDescription,
};

export default function SavingsCalculatorPage() {
  const language = normalizeLanguage(cookies().get(PREFERENCE_COOKIE_NAMES.language)?.value);
  const copy = getMonetizationCopy(language).calculator;
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-muted">{copy.intro}</p>
        <div className="mt-8"><SavingsCalculator /></div>
      </main>
      <Footer />
    </div>
  );
}
