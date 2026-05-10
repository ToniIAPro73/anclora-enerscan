'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetPassword } from '../actions';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPassword, {});

  return (
    <div className="surface border rounded-3xl p-6 shadow-2xl sm:p-8">
      <form action={action} className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-premium">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-muted">Introduce una contraseña nueva para recuperar el acceso.</p>
        </div>
        <input type="hidden" name="token" value={token} />
        <input name="password" type="password" required minLength={8} placeholder="Nueva contraseña" className="w-full rounded-xl border border-[#262626] bg-[#131313] p-3 text-sm outline-none focus:border-[#00DC82]" />
        <SubmitButton />
        {state.error && <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">{state.error}</p>}
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="h-12 w-full rounded-full bg-[#00DC82] font-heading font-bold text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? 'Guardando...' : 'Actualizar contraseña'}
    </button>
  );
}
