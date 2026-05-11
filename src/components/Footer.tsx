'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';
import { getLegalDisclaimer } from '@/lib/i18n';

export default function Footer() {
  const { dictionary: t, language } = usePreferences();

  return (
    <footer className="border-t py-12 app-shell" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 font-heading font-bold text-lg text-premium mb-4">
              <Image
                src="/brand/logo-anclora-energy-scan.png"
                alt="Anclora EnergyScan"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span>Anclora EnergyScan</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t.footerCopy}
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-premium mb-3">{t.footerProduct}</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li><a href="/#como-funciona" className="hover:text-premium transition">{t.navHow}</a></li>
              <li><a href="/#normativa" className="hover:text-premium transition">{t.navRegulation}</a></li>
              <li><a href="/#mejoras" className="hover:text-premium transition">{t.navImprovements}</a></li>
              <li><a href="/#precios" className="hover:text-premium transition">{t.navPricing}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-premium mb-3">{t.footerLegal}</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link href="/terms" className="hover:text-premium transition">{t.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-premium transition">{t.privacy}</Link></li>
              <li><Link href="/legal" className="hover:text-premium transition">{t.legal}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-premium mb-3">{t.footerContact}</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2"><Mail className="w-3 h-3 text-[#00DC82]/60" /> hola@enerscan.app</li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] text-muted leading-relaxed">
            {getLegalDisclaimer(language)}
          </p>
          <p className="text-[11px] text-muted">&copy; 2026 Anclora EnergyScan.</p>
        </div>
      </div>
    </footer>
  );
}
