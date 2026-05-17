import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function ProfessionalPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">EnergyScan Profesional beta</h1>
        <p className="mt-4 max-w-3xl text-muted">Para certificadores, arquitectos tecnicos, asesores energeticos e inmobiliarias que quieren preevaluar viviendas y generar informes orientativos para sus clientes.</p>
        <p className="mt-4 font-heading text-2xl font-bold text-[#00DC82]">Desde 49 EUR/mes · acceso beta limitado</p>
        <p className="mt-3 text-sm text-muted">No es una plataforma de emision de CEE oficial. Los informes son orientativos y requieren validacion profesional cuando proceda.</p>
        <Link href="/profesional/solicitar" className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Solicitar acceso profesional beta</Link>
      </main>
    </div>
  );
}
