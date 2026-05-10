'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { GitBranch, Mail } from 'lucide-react';
import { requestPasswordReset, signInWithEmail, signInWithProvider, signUpWithEmail } from './actions';
import { usePreferences } from '@/components/AppPreferencesProvider';

type AuthFormProps = {
  googleEnabled: boolean;
  githubEnabled: boolean;
};

export function AuthForm({ googleEnabled, githubEnabled }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [providerStatus, setProviderStatus] = useState({ googleEnabled, githubEnabled });
  const { dictionary: t, language } = usePreferences();
  const authFields = {
    es: { name: 'Nombre', email: 'Email', password: 'Contraseña', emailPlaceholder: 'tu@email.com', resetOk: 'Si el email existe, recibirás instrucciones.', localReset: 'En local' },
    en: { name: 'Name', email: 'Email', password: 'Password', emailPlaceholder: 'you@email.com', resetOk: 'If the email exists, you will receive instructions.', localReset: 'Local' },
    de: { name: 'Name', email: 'E-Mail', password: 'Passwort', emailPlaceholder: 'du@email.com', resetOk: 'Falls die E-Mail existiert, erhalten Sie Anweisungen.', localReset: 'Lokal' },
  }[language];
  const [signInState, signInAction] = useFormState(signInWithEmail, {});
  const [signUpState, signUpAction] = useFormState(signUpWithEmail, {});
  const [resetState, resetAction] = useFormState(requestPasswordReset, {});
  const state = mode === 'signin' ? signInState : mode === 'signup' ? signUpState : resetState;

  useEffect(() => {
    let active = true;
    fetch('/api/auth/providers-status', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((status) => {
        if (!active || !status) return;
        setProviderStatus({
          googleEnabled: Boolean(status.google?.enabled),
          githubEnabled: Boolean(status.github?.enabled),
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="surface border rounded-3xl p-6 shadow-2xl sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`h-11 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          {t.signIn}
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`h-11 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          {t.signUp}
        </button>
      </div>

      {mode === 'forgot' ? (
        <form action={resetAction} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-premium">{t.recoverPassword}</h1>
            <p className="mt-2 text-sm text-muted">{t.recoverCopy}</p>
          </div>
          <input name="email" type="email" required placeholder={authFields.emailPlaceholder} className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          <SubmitButton label={t.sendLink} pendingLabel={t.sending} />
          {resetState.ok && <p className="text-sm text-[#00DC82]">{authFields.resetOk}</p>}
          {resetState.resetUrl && (
            <p className="break-words rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted">
              {authFields.localReset}: {resetState.resetUrl}
            </p>
          )}
          <button type="button" onClick={() => setMode('signin')} className="text-sm font-semibold text-muted hover:text-premium">{t.backToAccess}</button>
        </form>
      ) : (
        <form action={mode === 'signin' ? signInAction : signUpAction} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-premium">{mode === 'signin' ? t.accountTitleSignIn : t.accountTitleSignUp}</h1>
            <p className="mt-2 text-sm text-muted">{t.accountCopy}</p>
          </div>

          {mode === 'signup' && (
            <input name="name" type="text" required placeholder={authFields.name} className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          )}
          <input name="email" type="email" required placeholder={authFields.email} className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          <input name="password" type="password" required minLength={8} placeholder={authFields.password} className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />

          <SubmitButton label={mode === 'signin' ? t.signIn : t.signUp} pendingLabel={t.processing} />

          <button type="button" onClick={() => setMode('forgot')} className="text-sm font-semibold text-muted hover:text-premium">
            {t.forgotPassword}
          </button>
        </form>
      )}

      {state.error && <p className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">{state.error}</p>}

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase text-muted">{t.socialAccess}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SocialButton provider="google" label="Google/Gmail" icon={<Mail className="h-4 w-4" />} enabled={providerStatus.googleEnabled} />
        <SocialButton provider="github" label="GitHub" icon={<GitBranch className="h-4 w-4" />} enabled={providerStatus.githubEnabled} />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        {t.acceptTermsPrefix}{' '}
        <Link href="/terms" className="font-semibold text-premium hover:text-[#00DC82]">
          {t.terms}
        </Link>{' '}
        {t.andPrivacy}{' '}
        <Link href="/privacy" className="font-semibold text-premium hover:text-[#00DC82]">
          {t.privacy}
        </Link>
        .
      </p>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="h-12 w-full rounded-full bg-[#00DC82] font-heading font-bold text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? pendingLabel : label}
    </button>
  );
}

function SocialButton({ provider, label, icon, enabled }: { provider: string; label: string; icon: ReactNode; enabled: boolean }) {
  return (
    <form action={signInWithProvider}>
      <input type="hidden" name="provider" value={provider} />
      <button disabled={!enabled} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 text-sm font-bold text-premium hover:border-[#00DC82]/40 disabled:cursor-not-allowed disabled:opacity-50">
        {icon}
        {label}
      </button>
    </form>
  );
}
