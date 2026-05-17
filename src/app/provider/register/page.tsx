'use client';

import { FormEvent, useState } from 'react';
import Navbar from '@/components/Navbar';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getMonetizationCopy } from '@/lib/monetization/i18n';

export default function ProviderRegisterPage() {
  const { language } = usePreferences();
  const copy = getMonetizationCopy(language).provider;
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/provider/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        website: form.get('website'),
        categories: String(form.get('categories') || '').split(',').map((item) => item.trim()).filter(Boolean),
        zones: String(form.get('zones') || '').split(',').map((item) => item.trim()).filter(Boolean),
      }),
    });
    setMessage(response.ok ? copy.registerOk : copy.registerError);
  }
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">{copy.registerTitle}</h1>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <input name="name" required placeholder={copy.company} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="email" required type="email" placeholder={copy.email} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="phone" placeholder={copy.phone} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="website" placeholder={copy.website} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="categories" required placeholder={copy.categories} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="zones" required placeholder={copy.zones} className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <button className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">{copy.submitRegister}</button>
        </form>
        {message && <p className="mt-4 text-sm text-[#00DC82]">{message}</p>}
      </main>
    </div>
  );
}
