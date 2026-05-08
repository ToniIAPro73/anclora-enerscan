'use client';

import Link from 'next/link';
import { Bolt } from 'lucide-react';
import { PreferenceToggles } from './PreferenceToggles';
import { usePreferences } from './AppPreferencesProvider';

export default function Navbar() {
  const { dictionary: t } = usePreferences();

  return (
    <header className="fixed top-0 left-0 right-0 z-[8500] glass border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-premium">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00DC82]/15 text-[#00DC82]">
            <Bolt className="w-4 h-4" />
          </span>
          EnerScan
        </Link>
        <div className="hidden lg:flex items-center gap-8 text-sm text-muted">
          <Link href="/#como-funciona" className="hover:text-premium transition">{t.navHow}</Link>
          <Link href="/#normativa" className="hover:text-premium transition">{t.navRegulation}</Link>
          <Link href="/#mejoras" className="hover:text-premium transition">{t.navImprovements}</Link>
          <Link href="/#precios" className="hover:text-premium transition">{t.navPricing}</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <PreferenceToggles compact />
          </div>
          <Link href="/wizard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-semibold text-sm hover:brightness-110 transition">
            {t.start}
          </Link>
        </div>
      </nav>
    </header>
  );
}
