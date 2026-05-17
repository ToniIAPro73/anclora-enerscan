import Navbar from '@/components/Navbar';
import { PROVIDER_LEAD_PACK_CREDITS } from '@/lib/monetization/products';
import { ProviderCreditsCheckoutButton } from '@/components/monetization/ProviderCreditsCheckoutButton';

export default function ProviderBillingPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">Creditos de leads</h1>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-heading text-2xl font-bold">Pack {PROVIDER_LEAD_PACK_CREDITS} leads</h2>
          <p className="mt-2 text-muted">300 EUR. Los creditos preparan el desbloqueo trazable de solicitudes con consentimiento.</p>
          <ProviderCreditsCheckoutButton />
        </div>
      </main>
    </div>
  );
}
