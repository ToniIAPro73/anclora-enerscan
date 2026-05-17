'use client';

import { FormEvent, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ProviderRegisterPage() {
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
    setMessage(response.ok ? 'Registro recibido. Revisaremos la informacion antes de activar el proveedor.' : 'No se pudo registrar el proveedor.');
  }
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <h1 className="font-heading text-4xl font-bold">Registro de proveedor</h1>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <input name="name" required placeholder="Empresa" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="phone" placeholder="Telefono" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="website" placeholder="Web" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="categories" required placeholder="Categorias separadas por coma: HVAC,SOLAR,WINDOWS" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <input name="zones" required placeholder="Zonas separadas por coma: Mallorca, Palma" className="rounded-xl border border-white/10 bg-black/20 p-3" />
          <button className="rounded-full bg-[#00DC82] px-6 py-3 font-bold text-[#07140f]">Enviar registro</button>
        </form>
        {message && <p className="mt-4 text-sm text-[#00DC82]">{message}</p>}
      </main>
    </div>
  );
}
