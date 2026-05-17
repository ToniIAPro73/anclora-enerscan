import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    return <div className="min-h-screen app-shell"><Navbar /><main className="px-4 pt-28">Inicia sesion para ver tu historial.</main></div>;
  }
  const assessments = await prisma.assessment.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">Mi panel EnergyScan</h1>
        <div className="mt-8 grid gap-3">
          {assessments.map((assessment) => (
            <Link key={assessment.id} href={`/assessment/${assessment.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold">{assessment.estimatedLetter} · {assessment.area} m2 · {assessment.year}</p>
              <p className="text-sm text-muted">{assessment.createdAt.toLocaleDateString('es-ES')} · {assessment.paidAt ? 'Premium' : 'Gratis'}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
