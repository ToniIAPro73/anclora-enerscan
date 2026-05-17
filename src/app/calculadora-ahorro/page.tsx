import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SavingsCalculator } from '@/components/monetization/SavingsCalculator';

export const metadata = {
  title: 'Calculadora de ahorro energetico orientativo | Anclora EnergyScan',
  description: 'Calcula rangos orientativos de ahorro y coste antes de iniciar un prediagnostico energetico.',
};

export default function SavingsCalculatorPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold text-premium">Calculadora publica de ahorro energetico</h1>
        <p className="mt-4 max-w-3xl text-muted">Herramienta orientativa para estimar rangos de ahorro, coste y retorno. No garantiza ahorros ni sustituye un CEE oficial o una revision tecnica.</p>
        <div className="mt-8"><SavingsCalculator /></div>
      </main>
      <Footer />
    </div>
  );
}
