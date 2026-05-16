import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProvidersLandingPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">Marketplace de proveedores EnergyScan</h1>
        <p className="mt-4 max-w-3xl text-muted">Recibe solicitudes de contacto de usuarios que han realizado un prediagnostico orientativo. EnergyScan no emite CEE oficial ni garantiza obras, ahorros o cierres comerciales.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Leads cualificados', 'Panel proveedor', 'Creditos trazables'].map((title) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-muted">MVP operativo para registrar proveedores, asignar leads y preparar monetizacion por packs.</p></div>
          ))}
        </div>
        <Link href="/provider/register" className="mt-8 inline-flex rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Registrar proveedor</Link>
      </main>
      <Footer />
    </div>
  );
}
