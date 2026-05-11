'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Check, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';
import type { CadastralMatch, CatastroResolveResponse, Province, Municipality } from '@/lib/catastro/types';

interface CadastreSearchProps {
  onConfirm: (match: CadastralMatch) => void;
}

export function CadastreSearch({ onConfirm }: CadastreSearchProps) {
  const { dictionary: t } = usePreferences();
  const [mode, setMode] = useState<'rc' | 'address'>('rc');
  const [rc, setRc] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CadastralMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Address search state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');

  useEffect(() => {
    if (mode === 'address' && provinces.length === 0) {
      fetchProvinces();
    }
  }, [mode]);

  useEffect(() => {
    if (selectedProvince) {
      fetchMunicipalities(selectedProvince);
    } else {
      setMunicipalities([]);
    }
  }, [selectedProvince]);

  async function fetchProvinces() {
    try {
      const res = await fetch('/api/catastro/provinces');
      if (res.ok) {
        const data = await res.json();
        setProvinces(data);
      }
    } catch (err) {
      console.error('Failed to fetch provinces', err);
    }
  }

  async function fetchMunicipalities(province: string) {
    try {
      const res = await fetch(`/api/catastro/municipalities?province=${encodeURIComponent(province)}`);
      if (res.ok) {
        const data = await res.json();
        setMunicipalities(data);
      }
    } catch (err) {
      console.error('Failed to fetch municipalities', err);
    }
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const body = mode === 'rc' 
        ? { mode: 'rc', rc }
        : { mode: 'address', province: selectedProvince, municipality: selectedMunicipality, street, number };
        
      const res = await fetch('/api/catastro/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data: CatastroResolveResponse = await res.json();
      
      if (data.ok && data.data) {
        setResults(data.data.matches);
        if (data.data.matches.length === 0) {
          setError(t.wizardCatastroNoResults);
        }
      } else {
        setError(data.error?.message || t.wizardCatastroErrorService);
      }
    } catch (err) {
      setError(t.wizardCatastroErrorService);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#00DC82]/20 bg-[#00DC82]/5 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#00DC82]/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-[#00DC82]" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-premium">{t.wizardCatastroTitle}</h3>
          <p className="text-xs text-muted">{t.wizardCatastroDesc}</p>
        </div>
      </div>

      <div className="flex p-1 rounded-xl bg-black/20 border border-white/5">
        <button
          type="button"
          onClick={() => setMode('rc')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mode === 'rc' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          Referencia Catastral
        </button>
        <button
          type="button"
          onClick={() => setMode('address')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mode === 'address' ? 'bg-[#00DC82] text-[#0A0A0A]' : 'text-muted hover:text-premium'}`}
        >
          Dirección
        </button>
      </div>

      {mode === 'rc' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">{t.wizardCatastroRefLabel}</label>
            <div className="relative">
              <input
                type="text"
                value={rc}
                onChange={(e) => setRc(e.target.value.toUpperCase())}
                placeholder={t.wizardCatastroRefPlaceholder}
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 pl-10 text-sm focus:border-[#00DC82] outline-none uppercase"
              />
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Provincia</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none"
            >
              <option value="">Selecciona provincia</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Municipio</label>
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              disabled={!selectedProvince}
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none disabled:opacity-50"
            >
              <option value="">Selecciona municipio</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Calle / Vía</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ej. Calle Mayor"
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Número</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ej. 1"
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSearch}
        disabled={loading || (mode === 'rc' ? !rc : (!selectedProvince || !selectedMunicipality || !street))}
        className="w-full py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.wizardCatastroSearching}
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {t.wizardCatastroSearchBtn}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          {results.map((match) => (
            <button
              key={match.cadastralReference}
              type="button"
              onClick={() => onConfirm(match)}
              className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-[#00DC82]/50 hover:bg-[#00DC82]/5 transition group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#00DC82]">{match.cadastralReference}</p>
                  <p className="text-sm font-bold text-premium mt-1 line-clamp-1">{match.address}</p>
                  <p className="text-[10px] text-muted uppercase mt-0.5">{match.municipality}, {match.province}</p>
                  <div className="flex gap-3 mt-2">
                    {match.surfaceBuiltM2 && (
                      <span className="text-[10px] text-muted font-semibold">🏠 {match.surfaceBuiltM2} m²</span>
                    )}
                    {match.yearBuilt && (
                      <span className="text-[10px] text-muted font-semibold">📅 {match.yearBuilt}</span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#00DC82] group-hover:border-[#00DC82] transition">
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-[#0A0A0A]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      <p className="text-[10px] text-center text-muted italic">
        {t.wizardCatastroSourceNotice}
      </p>
    </div>
  );
}
