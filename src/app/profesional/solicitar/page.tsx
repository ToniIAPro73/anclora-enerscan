'use client';

import { FormEvent, useState } from 'react';
import Navbar from '@/components/Navbar';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';

export default function ProfessionalRequestPage() {
  const { language } = usePreferences();
  const copy = getMonetizationCopy(language).professional;
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/professional-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setMessage(response.ok ? copy.requestOk : copy.requestError);
  }
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.requestTitle}</h1>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <input name="name" placeholder={copy.name} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="email" type="email" required placeholder={copy.email} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="company" placeholder={copy.company} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="role" placeholder={copy.role} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <textarea name="message" placeholder={copy.message} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <button className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.submit}</button>
        </form>
        {message && <p className="mt-4 text-sm text-[#00DC82]">{message}</p>}
      </main>
    </div>
  );
}
