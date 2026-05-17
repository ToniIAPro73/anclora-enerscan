'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PreferenceToggles } from './PreferenceToggles';
import { usePreferences } from './AppPreferencesProvider';

export default function Navbar() {
  const { dictionary: t } = usePreferences();
  const [productOpen, setProductOpen] = useState(false);
  const productLinks = [
    { href: '/#como-funciona', label: t.navHow },
    { href: '/calculadora-ahorro', label: t.navCalculator },
    { href: '/budget-review', label: t.navBudgetReview },
    { href: '/proveedores', label: t.navProviders },
    { href: '/profesional', label: t.navProfessional },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[8500] glass border-b border-white/5">
      <nav className="mx-auto flex h-16 max-w-[96rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-heading font-bold text-lg text-premium xl:text-xl">
          <Image
            src="/brand/logo-anclora-energy-scan.png"
            alt="Anclora EnergyScan"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover"
            priority
          />
          <span className="hidden whitespace-nowrap min-[430px]:inline">Anclora EnergyScan</span>
        </Link>
        <div className="premium-nav-pill hidden items-center gap-1 rounded-full p-1 text-sm text-muted xl:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setProductOpen((value) => !value)}
              className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-full px-3 font-semibold transition hover:bg-white/5 hover:text-premium"
              aria-expanded={productOpen}
              aria-haspopup="menu"
            >
              {t.navProduct}
              <ChevronDown className={`h-4 w-4 transition ${productOpen ? 'rotate-180' : ''}`} />
            </button>
            {productOpen && (
              <div className="surface absolute left-0 top-[calc(100%+0.85rem)] z-[8600] w-60 rounded-2xl border p-2 shadow-2xl shadow-black/30">
                {productLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProductOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-premium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/#normativa" className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full px-3 font-semibold transition hover:bg-white/5 hover:text-premium">{t.navRegulation}</Link>
          <Link href="/pricing" className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full px-3 font-semibold transition hover:bg-white/5 hover:text-premium">{t.navPricing}</Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <PreferenceToggles compact variant="popover" />
          </div>
          <Link href="/auth" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-heading font-semibold text-premium transition hover:border-[#00DC82]/40 lg:inline-flex">
            {t.access}
          </Link>
          <Link href="/wizard" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#00DC82] px-4 py-2.5 text-sm font-heading font-semibold text-[#0A0A0A] transition hover:brightness-110 sm:px-5">
            {t.start}
          </Link>
        </div>
      </nav>
      <div className="flex justify-center border-t border-white/5 px-3 py-2 md:hidden">
        <PreferenceToggles compact variant="popover" />
      </div>
    </header>
  );
}
