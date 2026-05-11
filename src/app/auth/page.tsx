import Image from 'next/image';
import Link from 'next/link';
import { AuthForm } from './AuthForm';
import { getOAuthEnv } from '@/lib/auth-env';
import { AuthIntro } from './AuthIntro';

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const oauth = getOAuthEnv();

  return (
    <main className="min-h-screen app-shell px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:min-h-[calc(100vh-4rem)] lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6">
          <Link href="/" className="inline-flex items-center gap-3 font-heading text-xl font-bold text-premium">
            <Image src="/brand/logo-anclora-energy-scan.png" alt="Anclora EnergyScan" width={44} height={44} className="rounded-xl" priority />
            Anclora EnergyScan
          </Link>
          <AuthIntro />
        </section>

        <section className="w-full max-w-md">
          <AuthForm
            googleEnabled={oauth.google.enabled}
            githubEnabled={oauth.github.enabled}
          />
        </section>
      </div>
    </main>
  );
}
