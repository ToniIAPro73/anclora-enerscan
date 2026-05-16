import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BudgetReviewUploader } from '@/components/monetization/BudgetReviewUploader';

export const metadata = {
  title: 'Segunda opinion de presupuesto de reforma | Anclora EnergyScan',
  description: 'Analisis automatico orientativo de presupuestos de reforma antes de aceptar.',
};

export default function BudgetReviewPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">Segunda opinion de presupuesto de reforma</h1>
        <p className="mt-4 max-w-3xl text-muted">Pega el contenido de un presupuesto para detectar partidas, importes y alertas generales. El resultado completo es un producto independiente del informe Premium.</p>
        <div className="mt-8"><BudgetReviewUploader /></div>
      </main>
      <Footer />
    </div>
  );
}
