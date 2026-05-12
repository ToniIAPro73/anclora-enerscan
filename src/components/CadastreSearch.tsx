'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, AlertCircle, ChevronRight, Check, X, Info } from 'lucide-react';
import { usePreferences } from './AppPreferencesProvider';
import type { CadastralMatch, CatastroResolveResponse, Province, Municipality } from '@/lib/catastro/types';
import type { CatastroStreetSuggestion } from '@/lib/catastro/client';

interface CadastreSearchProps {
  onConfirm: (match: CadastralMatch) => void;
  onLocationChange?: (province: string, municipality: string) => void;
  onMatchSelect?: (match: CadastralMatch | null) => void;
  onAddressChange?: (address: { province: string, municipality: string, street: string, number: string, sigla: string }) => void;
}

export function CadastreSearch({ onConfirm, onLocationChange, onMatchSelect, onAddressChange }: CadastreSearchProps) {
  const { dictionary: t, formatArea } = usePreferences();
  const [mode, setMode] = useState<'rc' | 'address'>('rc');
  const [rc, setRc] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CadastralMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Address search state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [streetSuggestions, setStreetSuggestions] = useState<CatastroStreetSuggestion[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<CatastroStreetSuggestion | null>(null);
  const [streetLoading, setStreetLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [number, setNumber] = useState('');

  // Internal address state
  const [block, setBlock] = useState('');
  const [staircase, setStaircase] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');

  // Detail view state
  const [detailMatch, setDetailMatch] = useState<CadastralMatch | null>(null);

  useEffect(() => {
    onMatchSelect?.(detailMatch);
  }, [detailMatch, onMatchSelect]);

  const fetchProvinces = useCallback(async () => {
    setProvincesLoading(true);
    try {
      const res = await fetch('/api/catastro/provinces');
      if (res.ok) {
        const data = await res.json();
        setProvinces(data);
      }
    } catch (err) {
      console.error('Failed to fetch provinces', err);
    } finally {
      setProvincesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'address' && provinces.length === 0) {
      fetchProvinces();
    }
  }, [mode, provinces.length, fetchProvinces]);

  const fetchMunicipalities = useCallback(async (province: string) => {
    setMunicipalitiesLoading(true);
    try {
      const res = await fetch(`/api/catastro/municipalities?province=${encodeURIComponent(province)}`);
      if (res.ok) {
        const data = await res.json();
        setMunicipalities(data);
      }
    } catch (err) {
      console.error('Failed to fetch municipalities', err);
    } finally {
      setMunicipalitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchMunicipalities(selectedProvince);
    } else {
      setMunicipalities([]);
    }
    setSelectedMunicipality('');
    setSelectedStreet(null);
    setStreetQuery('');
    onLocationChange?.(selectedProvince, '');
  }, [selectedProvince, onLocationChange, fetchMunicipalities]);

  useEffect(() => {
    setSelectedStreet(null);
    setStreetQuery('');
    // Only trigger location change if we actually have a selection or it's an intentional reset
    onLocationChange?.(selectedProvince, selectedMunicipality);
  }, [selectedMunicipality, selectedProvince, onLocationChange]);

  useEffect(() => {
    if (selectedProvince && selectedMunicipality && (selectedStreet || streetQuery.length >= 3) && number) {
      onAddressChange?.({
        province: selectedProvince,
        municipality: selectedMunicipality,
        street: selectedStreet ? selectedStreet.name : streetQuery,
        number,
        sigla: selectedStreet ? selectedStreet.type : '',
      });
    }
  }, [selectedProvince, selectedMunicipality, selectedStreet, streetQuery, number, onAddressChange]);

  // Street autocomplete debounce
  useEffect(() => {
    if (streetQuery.length < 3 || selectedStreet || !selectedProvince || !selectedMunicipality) {
      setStreetSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setStreetLoading(true);
      try {
        const res = await fetch(`/api/catastro/streets?province=${encodeURIComponent(selectedProvince)}&municipality=${encodeURIComponent(selectedMunicipality)}&query=${encodeURIComponent(streetQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setStreetSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Failed to fetch streets', err);
      } finally {
        setStreetLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [streetQuery, selectedStreet, selectedProvince, selectedMunicipality]);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResults([]);
    setDetailMatch(null);
    
    try {
      const body = mode === 'rc' 
        ? { mode: 'rc', rc }
        : { 
            mode: 'address', 
            province: selectedProvince, 
            municipality: selectedMunicipality, 
            street: selectedStreet ? selectedStreet.name : streetQuery,
            sigla: selectedStreet ? selectedStreet.type : '',
            number,
            block,
            staircase,
            floor,
            door
          };
        
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
        } else {
          if (data.data.matches.length === 1) {
            setDetailMatch(data.data.matches[0]);
          } else {
            // If multiple results, center map on the first one that has coordinates
            const firstWithCoords = data.data.matches.find(m => m.lat && m.lng);
            if (firstWithCoords) {
              onMatchSelect?.(firstWithCoords);
            }
          }
        }
      } else {
        setError(data.error?.message || t.wizardCatastroErrorService);
      }
    } catch (err) {
      console.error('Catastro search failed:', err);
      setError(t.wizardCatastroErrorService);
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmDetail = () => {
    if (detailMatch) {
      onConfirm(detailMatch);
    }
  };

  return (
    <div className="rounded-2xl border border-[#00DC82]/20 bg-[#00DC82]/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00DC82]/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-[#00DC82]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-premium">{t.wizardCatastroTitle}</h3>
            <p className="text-xs text-muted">{t.wizardCatastroDesc}</p>
          </div>
        </div>
        {detailMatch && (
          <button 
            onClick={() => setDetailMatch(null)}
            className="p-2 rounded-full hover:bg-white/5 text-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!detailMatch ? (
        <>
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
                <div className="relative">
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none"
                  >
                    <option value="">{provincesLoading ? 'Cargando provincias...' : 'Selecciona provincia'}</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {provincesLoading && (
                    <Loader2 className="absolute right-8 top-3 w-4 h-4 animate-spin text-[#00DC82]" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Municipio</label>
                <div className="relative">
                  <select
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    disabled={!selectedProvince || municipalitiesLoading}
                    className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none disabled:opacity-50"
                  >
                    <option value="">{municipalitiesLoading ? 'Cargando municipios...' : 'Selecciona municipio'}</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {municipalitiesLoading && (
                    <Loader2 className="absolute right-8 top-3 w-4 h-4 animate-spin text-[#00DC82]" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2 relative">
                <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Calle / Vía</label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedStreet ? `${selectedStreet.name} (${selectedStreet.type})` : streetQuery}
                    onChange={(e) => {
                      setStreetQuery(e.target.value);
                      setSelectedStreet(null);
                    }}
                    placeholder={t.wizardCatastroStreetPlaceholder}
                    disabled={!selectedMunicipality}
                    className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none disabled:opacity-50"
                  />
                  {selectedStreet && (
                    <button 
                      onClick={() => setSelectedStreet(null)}
                      className="absolute right-3 top-3 text-muted hover:text-premium"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {streetLoading && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-[#00DC82]" />
                  )}
                </div>
                
                {showSuggestions && streetSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#1A1A1A] border border-[#262626] rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {streetSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStreet(s);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#00DC82]/10 hover:text-[#00DC82] transition border-b border-white/5 last:border-0"
                      >
                        <span className="font-bold">{s.name}</span>
                        <span className="ml-2 text-[10px] opacity-60">({s.type})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-[#7A7A7A] ml-1">Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ej. 1"
                  disabled={!selectedMunicipality}
                  className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#00DC82] outline-none disabled:opacity-50"
                />
              </div>

              {/* Internal Address Section */}
              <div className="sm:col-span-2 space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold uppercase text-[#7A7A7A]">{t.cadastralInternalAddressTitle}</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-[#555] ml-1">{t.cadastralInternalAddressBlock}</label>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value.toUpperCase())}
                      placeholder="---"
                      className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-2.5 text-xs focus:border-[#00DC82] outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-[#555] ml-1">{t.cadastralInternalAddressStaircase}</label>
                    <input
                      type="text"
                      value={staircase}
                      onChange={(e) => setStaircase(e.target.value.toUpperCase())}
                      placeholder="---"
                      className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-2.5 text-xs focus:border-[#00DC82] outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-[#555] ml-1">{t.cadastralInternalAddressFloor}</label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value.toUpperCase())}
                      placeholder="---"
                      className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-2.5 text-xs focus:border-[#00DC82] outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-[#555] ml-1">{t.cadastralInternalAddressDoor}</label>
                    <input
                      type="text"
                      value={door}
                      onChange={(e) => setDoor(e.target.value.toUpperCase())}
                      placeholder="---"
                      className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl p-2.5 text-xs focus:border-[#00DC82] outline-none uppercase"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-muted italic ml-1">{t.cadastralInternalAddressHelp}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || (mode === 'rc' ? !rc : (!selectedProvince || !selectedMunicipality || (!selectedStreet && streetQuery.length < 3)))}
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

          {results.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-[10px] font-bold text-muted uppercase px-1">{t.cadastralResultsCount} ({results.length})</p>
              {results.map((match) => (
                <button
                  key={match.cadastralReference}
                  type="button"
                  onClick={() => setDetailMatch(match)}
                  className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-[#00DC82]/50 hover:bg-[#00DC82]/5 transition group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#00DC82]">{match.cadastralReference}</p>
                      <p className="text-sm font-bold text-premium mt-1 line-clamp-1">
                        {match.address}
                        {(match.floor || match.door) && (
                          <span className="text-muted font-normal ml-2">
                            {match.floor && `${t.cadastralResultsFloor} ${match.floor}`}
                            {match.door && ` · ${t.cadastralResultsDoor} ${match.door}`}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {match.surfaceBuiltM2 && (
                          <span className="text-[10px] text-muted font-semibold">🏠 {match.surfaceBuiltM2} m²</span>
                        )}
                        {match.yearBuilt && (
                          <span className="text-[10px] text-muted font-semibold">📅 {match.yearBuilt}</span>
                        )}
                        {match.propertyUse && (
                          <span className="text-[10px] text-muted font-semibold uppercase">🏢 {match.propertyUse}</span>
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
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#00DC82] uppercase tracking-wider">{t.wizardCatastroDetailTitle}</p>
                <h4 className="font-heading font-bold text-xl text-premium">
                  {detailMatch.address}
                  {(detailMatch.floor || detailMatch.door) && (
                    <span className="text-[#00DC82] block text-sm mt-1">
                      {detailMatch.floor && `${t.cadastralInternalAddressFloor} ${detailMatch.floor}`}
                      {detailMatch.door && ` · ${t.cadastralInternalAddressDoor} ${detailMatch.door}`}
                      {detailMatch.block && ` · ${t.cadastralInternalAddressBlock} ${detailMatch.block}`}
                      {detailMatch.staircase && ` · ${t.cadastralInternalAddressStaircase} ${detailMatch.staircase}`}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-muted uppercase">{detailMatch.municipality}, {detailMatch.province}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <p className="text-[9px] font-bold text-muted uppercase">{t.wizardCatastroDetailBuiltArea}</p>
                <p className="text-sm font-bold text-premium">
                  {detailMatch.surfaceBuiltM2 ? formatArea(detailMatch.surfaceBuiltM2) : '---'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <p className="text-[9px] font-bold text-muted uppercase">{t.wizardCatastroDetailYear}</p>
                <p className="text-sm font-bold text-premium">{detailMatch.yearBuilt || '---'}</p>
              </div>
              {detailMatch.participationCoefficient && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[9px] font-bold text-muted uppercase">% {t.cadastralDetailParticipationCoefficient}</p>
                  <p className="text-sm font-bold text-premium">{detailMatch.participationCoefficient} %</p>
                </div>
              )}
              {detailMatch.surfacePlotM2 && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="text-[9px] font-bold text-muted uppercase">{t.wizardCatastroDetailPlotArea}</p>
                  <p className="text-sm font-bold text-premium">{formatArea(detailMatch.surfacePlotM2)}</p>
                </div>
              )}
              {detailMatch.propertyUse && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1 col-span-2">
                  <p className="text-[9px] font-bold text-muted uppercase">{t.cadastralDetailPropertyUse}</p>
                  <p className="text-sm font-bold text-premium uppercase">{detailMatch.propertyUse}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Info className="w-3 h-3 text-[#00DC82]" />
                <p>{t.cadastralDetailFullReference}: <span className="font-mono text-premium">{detailMatch.cadastralReference}</span></p>
              </div>
              {detailMatch.parcelReference && (
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <div className="w-3 h-3" />
                  <p>{t.cadastralDetailParcelReference}: <span className="font-mono text-premium">{detailMatch.parcelReference}</span></p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDetailMatch(null)}
              className="flex-1 py-3 rounded-full border border-white/10 font-heading font-bold text-sm hover:bg-white/5 transition"
            >
              {t.previous}
            </button>
            <button
              type="button"
              onClick={handleConfirmDetail}
              className="flex-[2] py-3 rounded-full bg-[#00DC82] text-[#0A0A0A] font-heading font-bold text-sm hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {t.wizardCatastroDetailUseThis}
            </button>
          </div>
        </div>
      )}
      
      <p className="text-[10px] text-center text-muted italic">
        {t.wizardCatastroSourceNotice}
      </p>
    </div>
  );
}
