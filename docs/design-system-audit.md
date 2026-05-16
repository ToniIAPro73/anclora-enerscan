# EnergyScan Design System audit

Estado global: PARTIAL.

EnergyScan se considera consumidor candidato de la familia Premium del Anclora Design System. Esta auditoria documental se basa en revision de superficies, componentes locales y contratos disponibles; no equivale a validacion visual completa en navegador ni a certificacion de cumplimiento.

| Superficie | Estado | Evidencia | Gap | Accion recomendada | Prioridad |
|---|---|---|---|---|---|
| Landing | Partial | `src/app/page.tsx`, tokens premium locales, copy legal visible | Validar contra patron `premium-hero-split` y responsive real | QA visual desktop/mobile y ajuste de jerarquia | Alta |
| Wizard | Partial | `src/app/wizard/page.tsx`, formularios tipados, preferencias ES/EN/DE | Riesgo de densidad y estados largos en mobile | Revisar controles, errores, unidades y motion | Alta |
| Results | Partial | `src/app/assessment/[id]/page.tsx`, scoring, escenarios y paywall | Falta matriz visual de estados vacio/error/premium | Auditoria por estados y contraste de componentes | Alta |
| Pricing | Partial | `src/app/pricing/page.tsx`, Stripe Checkout, precio Premium | Verificar consistencia con familia Premium utility | Validar CTA, legal copy y fallback de pago | Media |
| PDF Premium | Partial | `src/lib/pdf/`, `@react-pdf/renderer` | El PDF no hereda tokens web directamente | Definir perfil PDF Premium y disclaimer fijo | Alta |
| Provider Lead Section | Partial | `src/components/ProviderLeadSection.tsx`, consentimiento no premarcado | Handoff requiere QA de copy, accesibilidad y foco | Validar formulario, consentimiento e i18n | Alta |
| Navbar/Footer | Partial | Navegacion y enlaces legales existentes | Confirmar consistencia de footer legal por idioma | QA visual y de enlaces | Media |
| Legal/privacy/terms | Partial | Aviso de prediagnostico y no CEE oficial | Revisar trazabilidad entre UI, PDF y docs legales | Consolidar disclaimer unico por superficie | Alta |
| Preferencias ES/EN/DE + EUR/GBP + unidades | Partial | `src/lib/preferences.ts`, locales ES/EN/DE | Verificar que no se mezclan idiomas/unidades en vistas largas | QA cruzado por idioma, moneda y unidades | Alta |

## Backlog priorizado

1. QA visual desktop/mobile de landing, wizard, results y provider lead section.
2. Matriz de estados para results: draft, completed, premium locked, premium unlocked, provider requested y error.
3. Perfil PDF Premium con disclaimer fijo y criterios de consistencia visual fuera del DOM web.
4. Validacion i18n completa para ES/EN/DE, moneda EUR/GBP y unidades metric/imperial.
5. Revision de accesibilidad para consentimiento, paywall y formularios extensos.

## Limite legal

Anclora EnergyScan no emite Certificados de Eficiencia Energetica oficiales ni documentacion con validez administrativa. Es una herramienta de prediagnostico energetico orientativo.
