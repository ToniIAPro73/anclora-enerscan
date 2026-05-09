import Image from 'next/image';
import Link from 'next/link';
import { AuthForm } from './AuthForm';

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  return (
    <main className="min-h-screen app-shell px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:min-h-[calc(100vh-4rem)] lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6">
          <Link href="/" className="inline-flex items-center gap-3 font-heading text-xl font-bold text-premium">
            <Image src="/brand/logo-anclora-energy-scan.png" alt="Anclora EnergyScan" width={44} height={44} className="rounded-xl" priority />
            Anclora EnergyScan
          </Link>
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#00DC82]">Acceso privado</p>
            <h1 className="font-heading text-4xl font-bold text-premium sm:text-5xl">Gestiona tus diagnósticos energéticos y documentación.</h1>
            <p className="text-muted leading-relaxed">
              La cuenta usa Auth.js con Prisma sobre Neon Postgres. Permite conservar valoraciones, adjuntos pesados en Vercel Blob y solicitudes de contacto vinculadas a proveedores o partners.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-muted">
              EnergyScan sigue siendo un prediagnóstico orientativo. No sustituye al Certificado de Eficiencia Energética oficial ni tiene validez administrativa.
            </p>
          </div>
        </section>

        <section className="w-full max-w-md">
          <AuthForm
            googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
            githubEnabled={Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)}
          />
        </section>
      </div>
    </main>
  );
}
