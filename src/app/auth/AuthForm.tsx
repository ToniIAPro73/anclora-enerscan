'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { GitBranch, Mail } from 'lucide-react';
import { requestPasswordReset, signInWithEmail, signInWithProvider, signUpWithEmail } from './actions';

type AuthFormProps = {
  googleEnabled: boolean;
  githubEnabled: boolean;
};

export function AuthForm({ googleEnabled, githubEnabled }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [signInState, signInAction] = useFormState(signInWithEmail, {});
  const [signUpState, signUpAction] = useFormState(signUpWithEmail, {});
  const [resetState, resetAction] = useFormState(requestPasswordReset, {});
  const state = mode === 'signin' ? signInState : mode === 'signup' ? signUpState : resetState;

  return (
    <div className="surface border rounded-3xl p-6 shadow-2xl sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`h-11 rounded-xl text-sm font-bold transition ${mode === 'signin' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`h-11 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          Sign Up
        </button>
      </div>

      {mode === 'forgot' ? (
        <form action={resetAction} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-premium">Recuperar contraseña</h1>
            <p className="mt-2 text-sm text-muted">Te enviaremos un enlace para restablecer el acceso.</p>
          </div>
          <input name="email" type="email" required placeholder="tu@email.com" className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          <SubmitButton label="Enviar enlace" pendingLabel="Enviando..." />
          {resetState.ok && <p className="text-sm text-[#00DC82]">Si el email existe, recibirás instrucciones.</p>}
          {resetState.resetUrl && (
            <p className="break-words rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted">
              En local: {resetState.resetUrl}
            </p>
          )}
          <button type="button" onClick={() => setMode('signin')} className="text-sm font-semibold text-muted hover:text-premium">Volver a Sign In</button>
        </form>
      ) : (
        <form action={mode === 'signin' ? signInAction : signUpAction} className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-premium">{mode === 'signin' ? 'Accede a EnergyScan' : 'Crea tu cuenta'}</h1>
            <p className="mt-2 text-sm text-muted">Guarda valoraciones, adjuntos y solicitudes de contacto en tu espacio privado.</p>
          </div>

          {mode === 'signup' && (
            <input name="name" type="text" required placeholder="Nombre" className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          )}
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
          <input name="password" type="password" required minLength={8} placeholder="Contraseña" className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />

          <SubmitButton label={mode === 'signin' ? 'Sign In' : 'Sign Up'} pendingLabel="Procesando..." />

          <button type="button" onClick={() => setMode('forgot')} className="text-sm font-semibold text-muted hover:text-premium">
            ¿Olvidó su contraseña?
          </button>
        </form>
      )}

      {state.error && <p className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">{state.error}</p>}

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase text-muted">Social login</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SocialButton provider="google" label="Google/Gmail" icon={<Mail className="h-4 w-4" />} enabled={googleEnabled} />
        <SocialButton provider="github" label="GitHub" icon={<GitBranch className="h-4 w-4" />} enabled={githubEnabled} />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        Al continuar aceptas los{' '}
        <Link href="/terms" className="font-semibold text-premium hover:text-[#00DC82]">
          términos del servicio
        </Link>{' '}
        y la{' '}
        <Link href="/privacy" className="font-semibold text-premium hover:text-[#00DC82]">
          política de privacidad
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
