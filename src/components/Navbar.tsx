import Link from 'next/link';
import { Bolt } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[8500] glass border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-[#F0EDE8]">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00DC82]/15 text-[#00DC82]">
            <Bolt className="w-4 h-4" />
          </span>
          EnerScan
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#7A7A7A]">
          <Link href="#como-funciona" className="hover:text-[#F0EDE8] transition">Cómo funciona</Link>
          <Link href="#normativa" className="hover:text-[#F0EDE8] transition">Normativa</Link>
          <Link href="#mejoras" className="hover:text-[#F0EDE8] transition">Mejoras</Link>
          <Link href="#precios" className="hover:text-[#F0EDE8] transition">Precios</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/wizard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-semibold text-sm hover:brightness-110 transition">
            Iniciar análisis
          </Link>
        </div>
      </nav>
    </header>
  );
}
