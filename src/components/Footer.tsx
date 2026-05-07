import { Bolt, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] py-12 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 font-heading font-bold text-lg text-[#F0EDE8] mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#00DC82]/15 text-[#00DC82]">
                <Bolt className="w-3 h-3" />
              </span>
              EnerScan
            </div>
            <p className="text-xs text-[#7A7A7A] leading-relaxed">
              Plataforma de prediagnóstico energético, preparación regulatoria y activación de rehabilitación inmobiliaria.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#F0EDE8] mb-3">Producto</h4>
            <ul className="space-y-2 text-xs text-[#7A7A7A]">
              <li><a href="#como-funciona" className="hover:text-[#F0EDE8] transition">Cómo funciona</a></li>
              <li><a href="#normativa" className="hover:text-[#F0EDE8] transition">Normativa</a></li>
              <li><a href="#mejoras" className="hover:text-[#F0EDE8] transition">Mejoras</a></li>
              <li><a href="#precios" className="hover:text-[#F0EDE8] transition">Precios</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#F0EDE8] mb-3">Legal</h4>
            <ul className="space-y-2 text-xs text-[#7A7A7A]">
              <li><a href="#" className="hover:text-[#F0EDE8] transition">Términos de uso</a></li>
              <li><a href="#" className="hover:text-[#F0EDE8] transition">Política de privacidad</a></li>
              <li><a href="#" className="hover:text-[#F0EDE8] transition">Aviso legal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-[#F0EDE8] mb-3">Contacto</h4>
            <ul className="space-y-2 text-xs text-[#7A7A7A]">
              <li className="flex items-center gap-2"><Mail className="w-3 h-3 text-[#00DC82]/60" /> hola@enerscan.app</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#262626] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#7A7A7A]/60">
            EnerScan no es un certificador energético. Las estimaciones son orientativas y no sustituyen el Certificado de Eficiencia Energética oficial regulado por el R.D. 390/2021.
          </p>
          <p className="text-[11px] text-[#7A7A7A]/40">&copy; 2026 EnerScan. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
