# Auditoría Estado Actual — EnergyScan 360 Product Differentiation

**Fecha:** 2026-05-18  
**Rama base:** main (ab05c2e — merged feat/connected-dashboard-professional-provider)  
**Rama trabajo:** feat/energyscan-360-product-differentiation  
**Tests baseline:** 42 suites, 170 tests — PASS  

---

## 1. Ya implementado y validado

### Core
- Next.js 14.2.35, TypeScript estricto, Prisma 7.8.0, Neon/Postgres
- Auth.js / NextAuth con OAuth + credenciales + reset-password
- Stripe Checkout (premium report) + Stripe webhook
- PDF Premium con gate por `paidAt` / demo (`src/lib/pdf/EnerScanReport.tsx`)
- Wizard energético completo (`src/app/wizard/page.tsx`)
- Catastro por RC, dirección, mapa WMS, autofill (`src/lib/catastro/`)
- OCR/parsers CEE + presupuestos (`src/lib/ocr/`)
- Budget Review con checkout propio, texto y PDF upload
- Dashboard residencial conectado con assessments, budget reviews, profesional
- Dashboard proveedor con leads, créditos, billing
- Dashboard profesional beta con estado de acceso
- Provider leads: assign, unlock con créditos idempotentes, status update
- Leads con consentimiento y bloqueo de datos personales antes de unlock
- ProviderLeadCreditLedger idempotente
- Admin metrics (`/admin/metrics`)
- i18n ES/EN/DE completo en `src/lib/i18n.ts` y `src/lib/monetization/i18n.ts`
- Preferencias tema/moneda/unidades
- SEO ciudad (`/ciudad/[slug]`)
- Calculadora pública (`/calculadora-ahorro`)
- Analytics PostHog + AnalyticsEventLog (`src/lib/analytics.ts`)
- Email Resend opcional (`src/lib/email.ts`)
- Cost engine con catálogo de precios (`src/lib/costs/`)
- Score V2 + regulatory + subsidies + scenarios

### Normalizers de dominio
- `src/lib/domain/normalizers.ts`: normaliza strings a tipos tipados de dominio (PropertyType, HeatingSystem, etc.)
- `src/lib/domain/energy-assessment.ts`: tipos de dominio completos

### Monetización i18n
- Lead `statusLabel` ES/EN/DE: PENDING, CONTACTED, QUOTED, WON, LOST, CANCELLED
- Professional access `statusLabel` ES/EN/DE: NONE, PENDING, APPROVED, REJECTED
- Pero **NO** existen labels para: propertyType, provider.status, budgetReview.status

---

## 2. Implementado pero necesita polish

### Valores crudos en UI (prioridad alta)
- **Dashboard** (`/dashboard`, line 130): `{assessment.propertyType}` — muestra `house`, `flat` crudo
- **Dashboard** (line 168): `{review.status}` — puede mostrar `DRAFT`, `ANALYZED` crudo
- **Provider dashboard** (`/provider/dashboard`, line 44): `{account.provider.status}` — muestra `PENDING`, `VERIFIED` crudo
- **Provider leads** (`/provider/leads`, line 50): `{lead.assessment?.propertyType}` — crudo
- No existen helpers `getPropertyTypeLabel()`, `getProviderStatusLabel()`, `getBudgetReviewStatusLabel()`

### Budget Review service
- Tiene detección básica HIGH_REVIEW / LOW_REVIEW / IN_RANGE
- El mensaje está en español hardcodeado (no i18n)
- Falta: semáforo por partida, desviación orientativa, omisiones frecuentes por categoría, preguntas sugeridas, PDF de Budget Review, i18n de findings

### PDF Premium
- Ya tiene: rating, confidence, data sources, scenarios, costs, subsidies, attachments, Catastro, CEE, budget impact
- Falta: Evidence Matrix section, checklist técnico/proveedor, sección "qué no sabemos sin visita", advanced scenarios cta, mejor resumen ejecutivo

### Assessment detail (`/assessment/[id]`)
- Ya tiene: PaywallSection, scenarios, costs, subsidies, regulatory, attachments, provider leads section, PDF download
- Es una sola página vertical sin tabs/secciones navegables
- Falta: sección Evidence (Fase 2), sección Estado & Riesgo (Fase 7), mejor estructura de decisión

---

## 3. Qué falta realmente

| Feature | Módulo | Prioridad |
|---------|--------|-----------|
| Labels traducibles para enums (propertyType, provider.status, budgetReview.status) | `src/lib/enum-labels.ts` nuevo | ALTA |
| Evidence Matrix módulo + UI en assessment | `src/lib/evidence/` + assessment tab | ALTA |
| Evidence Matrix en PDF Premium | EnerScanReport.tsx | ALTA |
| Budget Review: semáforo, omisiones, preguntas sugeridas, i18n | budget-review/service.ts + UI | ALTA |
| Condition & Risk Light módulo | `src/lib/condition-risk/` nuevo | MEDIA |
| Condition & Risk UI en assessment + PDF | assessment page + PDF | MEDIA |
| Admin panel proveedores `/admin/providers` | nueva ruta | MEDIA |
| Provider matching mejorado por zona/categoría | provider-leads.ts | MEDIA |
| Notificación email a proveedor al asignar lead | email.ts + leads/route.ts | MEDIA |
| Packaging Level 1-3 visible en pricing | pricing page | MEDIA |
| Assessment detail por secciones | assessment page reestructuración | MEDIA |
| Budget Review PDF endpoint | nueva ruta API | BAJA |
| Professional branding/plan beta mínimo | profesional/dashboard | BAJA |
| Analytics eventos nuevos (condition_risk_viewed, etc.) | analytics.ts | BAJA |
| Upsell CTA en calculadora | calculadora-ahorro/page.tsx | BAJA |

---

## 4. Qué NO debe tocarse

- Wizard flow completo (cualquier cambio requiere regresión completa)
- Catastro integration (muy estable)
- Stripe webhook handler (crítico, idempotente)
- PDF gate logic (paidAt / demo)
- Provider credits idempotency (ProviderLeadCreditLedger + stripeSessionId unique)
- Lead personal data bloqueo (contactUnlockedAt logic)
- Tests existentes (42 suites, 170 tests)
- Disclaimers legales actuales
- Schema de BD (migrar solo si hay valor claro + test cubierto)

---

## 5. Riesgos técnicos detectados

1. **Assessment page size**: ya tiene ~400+ líneas. Añadir tabs/secciones puede crecer mucho. Solución: componentizar por sección.
2. **PDF renderer (react-pdf)**: las secciones nuevas deben seguir el patrón `<View>` estricto de react-pdf. No usar componentes HTML.
3. **Budget Review findings hardcoded ES**: los mensajes están en español en el servicio, no en i18n. Hay que moverlos al sistema de labels.
4. **DataFieldSource table**: ya existe en schema para trazabilidad por campo. Evidence Matrix puede usar este modelo como fuente de verdad, pero solo si el assessment tiene campos en esta tabla. Para assessments sin DataFieldSource hay que inferir de los campos propios.
5. **Admin providers**: proteger igual que admin/metrics con ADMIN_EMAILS env var.
6. **Sin migración de schema**: la Evidence Matrix puede construirse 100% desde datos existentes (Assessment, CadastralRecord, EnergyCertificate, RehabBudget, AssessmentAttachment, DataFieldSource). No requiere nueva tabla.

---

## 6. Propuesta de alcance final para esta rama

### Implementar (por orden de valor)

**Alta prioridad (entregar siempre):**
1. `src/lib/enum-labels.ts` — helpers traducibles para propertyType, provider.status, budgetReview.status, assessment.paymentStatus
2. Polish de valores crudos en dashboard, provider/dashboard, provider/leads
3. `src/lib/evidence/evidence-matrix.ts` — módulo puro derivado de datos existentes
4. Sección "Evidencias" en `/assessment/[id]`
5. Sección Evidence Matrix resumida en PDF Premium
6. Budget Review: semáforo i18n + omisiones + preguntas sugeridas
7. `src/lib/condition-risk/` — módulo base con reglas derivadas de datos existentes
8. Sección "Estado & Riesgo" en `/assessment/[id]` (con disclaimer)

**Media prioridad (implementar si no hay bloqueo):**
9. `/admin/providers` — panel admin básico de proveedores
10. Provider matching mejorado + notificación email al proveedor
11. Packaging Level 1-3 en `/pricing`
12. Assessment detail: reestructurar en secciones/anclas

**Baja prioridad (documentar si no hay tiempo):**
13. Budget Review PDF endpoint
14. Professional branding/plan beta mínimo
15. Analytics eventos nuevos
16. Upsell CTA en calculadora

### Tests esperados
- `tests/enum-labels.test.ts`
- `tests/evidence-matrix.test.ts`
- `tests/condition-risk.test.ts`
- `tests/budget-review-advanced.test.ts`
- `tests/provider-matching.test.ts`
- `tests/admin-providers.test.ts`

### Fuera de alcance (documentado)
- Stripe Billing recurrente (suscripción profesional)
- Multi-presupuesto comparativo con checkout nuevo
- Accesibilidad completa (WCAG AA)
- Multi-tenant enterprise
- Branding white-label completo
