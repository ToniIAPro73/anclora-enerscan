'use client';

import { useState, useEffect, useCallback } from 'react';
import { MousePointer2, Calculator, Sparkles, Zap } from 'lucide-react';

const ENERGY_LEVELS = [
  { letter: 'A', color: '#008F5A', bg: 'bg-[#008F5A]', width: 'w-[100%]' },
  { letter: 'B', color: '#00DC82', bg: 'bg-[#00DC82]', width: 'w-[90%]' },
  { letter: 'C', color: '#8BC34A', bg: 'bg-[#8BC34A]', width: 'w-[80%]' },
  { letter: 'D', color: '#CDDC39', bg: 'bg-[#CDDC39]', width: 'w-[70%]' },
  { letter: 'E', color: '#FFB020', bg: 'bg-[#FFB020]', width: 'w-[60%]' },
  { letter: 'F', color: '#FF5722', bg: 'bg-[#FF5722]', width: 'w-[50%]' },
  { letter: 'G', color: '#D32F2F', bg: 'bg-[#D32F2F]', width: 'w-[40%]' },
];

export function HeroEnergyScale() {
  const [currentIndex, setCurrentIndex] = useState(6); // Start at G
  const [isCalculating, setIsCalculating] = useState(false);
  const targetIndex = 2; // Stop at C

  const startCalculation = useCallback(() => {
    if (isCalculating) return;
    setIsCalculating(true);
    setCurrentIndex(6); // Reset to G
  }, [isCalculating]);

  useEffect(() => {
    if (!isCalculating) return;

    if (currentIndex > targetIndex) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsCalculating(false);
    }
  }, [isCalculating, currentIndex, targetIndex]);

  return (
    <div className="flex justify-center lg:justify-end">
      <div 
        onClick={startCalculation}
        className="group relative cursor-pointer"
      >
        {/* PREMIUM CARD CONTAINER */}
        <div className="relative w-[340px] sm:w-[400px] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#131313] to-[#0A0A0A] shadow-2xl overflow-hidden group-hover:border-[#00DC82]/30 transition-all duration-500">
          
          {/* DECORATIVE ELEMENTS */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00DC82]/10 blur-[80px] rounded-full group-hover:bg-[#00DC82]/20 transition-colors duration-700" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FFB020]/5 blur-[80px] rounded-full" />
          
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00DC82]/10 flex items-center justify-center border border-[#00DC82]/20">
                {isCalculating ? (
                  <Calculator className="w-5 h-5 text-[#00DC82] animate-pulse" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#00DC82]" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00DC82] uppercase tracking-[0.2em]">Live Analysis</p>
                <p className="text-xs font-heading font-bold text-premium">ENERGY SCAN PRO</p>
              </div>
            </div>
            {!isCalculating && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 animate-bounce">
                <MousePointer2 className="w-3 h-3 text-muted" />
                <span className="text-[9px] font-bold text-muted uppercase">Simulate</span>
              </div>
            )}
          </div>

          {/* THE SCALE */}
          <div className="space-y-2.5">
            {ENERGY_LEVELS.map((level, index) => {
              const isActive = index === currentIndex;
              
              return (
                <div 
                  key={level.letter}
                  className={`relative flex items-center transition-all duration-500 ${isActive ? 'scale-[1.03] z-10' : 'opacity-40'}`}
                >
                  {/* BAR CONTAINER */}
                  <div className={`h-8 sm:h-9 ${level.width} rounded-r-full relative overflow-hidden flex items-center justify-end px-4 border border-white/5 shadow-lg group-hover:shadow-[#00DC82]/5`}>
                    {/* BASE COLOR */}
                    <div className={`absolute inset-0 ${level.bg} opacity-80`} />
                    
                    {/* GLOW EFFECT ON ACTIVE */}
                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                    
                    {/* GLASS OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                    
                    {/* LETTER */}
                    <span className="relative z-10 font-heading font-black text-white text-lg sm:text-xl drop-shadow-md">
                      {level.letter}
                    </span>
                  </div>

                  {/* ACTIVE INDICATOR ARROW */}
                  {isActive && (
                    <div className="ml-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-[#00DC82]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BOTTOM METER (DYNAMIC DATA) */}
          <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-none">Estimate Grade</p>
              <p className={`text-2xl font-heading font-black transition-colors duration-500 ${isCalculating ? 'text-muted' : 'text-premium'}`}>
                {isCalculating ? '...' : ENERGY_LEVELS[currentIndex].letter}
              </p>
            </div>
            <div className="space-y-1 text-right text-[#00DC82]">
              <p className="text-[9px] font-bold uppercase tracking-widest leading-none">Potential</p>
              <p className="text-2xl font-heading font-black">
                {isCalculating ? '??%' : 'High'}
              </p>
            </div>
          </div>

          {/* INTERACTIVE BACKGROUND OVERLAY */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors pointer-events-none" />
        </div>
        
        {/* EXTERNAL FLOATING SHAPES */}
        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00DC82] to-[#1B8C2F] rotate-12 flex items-center justify-center shadow-xl group-hover:-translate-y-2 transition-transform duration-500 pointer-events-none">
          <Zap className="w-6 h-6 text-[#0A0A0A] fill-current" />
        </div>
      </div>
    </div>
  );
}
