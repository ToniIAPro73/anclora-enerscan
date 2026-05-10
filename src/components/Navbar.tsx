'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PreferenceToggles } from './PreferenceToggles';
import { usePreferences } from './AppPreferencesProvider';

export default function Navbar() {
  const { dictionary: t } = usePreferences();

  return (
    <header className="fixed top-0 left-0 right-0 z-[8500] glass border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-premium">
          <Image
            src="/brand/logo-anclora-energy-scan.png"
            alt="Anclora EnergyScan"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover"
            priority
          />
          <span className="hidden min-[430px]:inline">Anclora EnergyScan</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8 text-sm text-muted">
          <Link href="/#como-funciona" className="hover:text-premium transition">{t.navHow}</Link>
          <Link href="/#normativa" className="hover:text-premium transition">{t.navRegulation}</Link>
          <Link href="/#mejoras" className="hover:text-premium transition">{t.navImprovements}</Link>
          <Link href="/#precios" className="hover:text-premium transition">{t.navPricing}</Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <PreferenceToggles compact />
          </div>
          <Link href="/auth" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-heading font-semibold text-premium transition hover:border-[#00DC82]/40 lg:inline-flex">
            {t.access}
          </Link>
          <Link href="/wizard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-semibold text-sm hover:brightness-110 transition">
            {t.start}
          </Link>
        </div>
      </nav>
      <div className="flex justify-center border-t border-white/5 px-3 py-2 md:hidden">
        <PreferenceToggles compact />
      </div>
    </header>
  );
}
