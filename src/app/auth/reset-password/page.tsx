import Image from 'next/image';
import Link from 'next/link';
import { ResetPasswordForm } from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : '';

  return (
    <main className="min-h-screen app-shell px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 font-heading text-xl font-bold text-premium">
          <Image src="/brand/logo-anclora-energy-scan.png" alt="Anclora EnergyScan" width={44} height={44} className="rounded-xl" priority />
          Anclora EnergyScan
        </Link>
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
