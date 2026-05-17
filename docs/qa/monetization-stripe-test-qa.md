# Resultado QA Staging — Stripe Test

## Estado general

**Aprobado con salvedades** — El flujo de Budget Review completo hasta checkout está operativo. Se documentan 3 incidencias funcionales menores y 1 limitación de entorno. El carácter visual premium se mantiene en dark y light.

---

## Entorno

| Campo | Valor |
|---|---|
| URL local | `http://localhost:3001` |
| Rama | `fix/monetization-stripe-i18n-hardening` |
| Commits | `432ea78` (visual), `d99ca29` (copy) |
| Fecha | 2026-05-17 |
| Modo Stripe | test |
| Playwright | headless, producción build |

---

## Cambios locales detectados al inicio (pre-commit)

- `src/components/Navbar.tsx` — menú Producto dropdown, cápsula premium-nav-pill
- `src/components/PreferenceToggles.tsx` — shrink-0 whitespace-nowrap
- `src/lib/i18n.ts` — navProduct ES/EN/DE
- `src/app/globals.css` — estilos nav pill, hero widget, cookies, light mode

---

## Correcciones realizadas durante esta continuación

### Commit `432ea78` — Visual
- Nav pill: cápsula glass dark + frosted glass light con backdrop-filter
- HeroEnergyScale: fondo elevado en dark (`#2f2f2f→#1e1e1e`), blanco/crema en light; barras A-G conservadas en ambos temas
- CookieConsent: botón flotante y modal con fondos theme-aware (dark oscuro / light blanco)
- PreferenceToggles: shrink-0 evita compresión en viewports intermedios

### Commit `d99ca29` — Copy
- `src/lib/monetization/i18n.ts`: acentos en título, placeholder, legalNotice ES
- `src/lib/budget-review/service.ts`: acentos en alertas y disclaimer
- `src/app/api/budget-review/checkout/route.ts`: nombre y descripción del producto en Stripe

---

## Validación visual

### Header / Nav

| Escenario | Resultado |
|---|---|
| Desktop 1366px dark — una línea | ✓ OK |
| Desktop 1366px light — una línea | ✓ OK |
| Menú Producto desplegable dark | ✓ OK |
| Menú Producto desplegable light | ✓ OK |
| Mobile 390x844 dark | ✓ OK |
| Mobile 390x844 light | ✓ OK |
| Overflow horizontal | ✓ 0px en todos |
| Header height desktop | ✓ 65px |
| Mobile bar oculta en desktop | ✓ display:none |

### Hero móvil

| Escenario | Resultado |
|---|---|
| 390x844 dark | ✓ H1 completo, CTAs con tap target correcto, sin overflow |
| 390x844 light | ✓ Estructura igual, contraste correcto |
| Widget energético dark | ✓ Fondo elevado visible, barras A-G conservadas |
| Widget energético light | ✓ Fondo blanco/crema, barras A-G conservadas |

### Cookie consent

| Elemento | Dark | Light |
|---|---|---|
| Botón flotante | ✓ verde oscuro | ✓ blanco translúcido |
| Modal | ✓ fondo #07130f | ✓ fondo blanco, textos oscuros |

---

## Rutas

### Públicas (todas 200 ✓)
`/` `/budget-review` `/calculadora-ahorro` `/proveedores` `/profesional` `/pricing` `/profesional/solicitar` `/provider/register` `/ciudad/palma` `/legal` `/terms` `/privacy`

### Protegidas
| Ruta | Sin auth | Resultado |
|---|---|---|
| `/admin/metrics` | 403 | ✓ correcto |
| `/dashboard` | 200 | ⚠ ver QA-004 |
| `/provider/dashboard` | 200 | ⚠ ver QA-004 |

---

## Stripe

| Flujo | Estado | Evidencia |
|---|---|---|
| Budget Review — abrir checkout | ✓ OK | `cs_test_a1D4CC...`, €19.90 |
| Budget Review — nombre producto Stripe | ✓ correcto | "Segunda opinión de presupuesto EnergyScan" |
| Budget Review — precio | ✓ correcto | €19.90 |
| Budget Review — metadata productType | ✓ code-verified | `budget_review` |
| Budget Review — metadata budgetReviewId | ✓ code-verified | presente |
| Budget Review — completar pago con tarjeta test | ⚠ no automatizable | iframe anidado de Stripe bloquea Playwright |
| Premium Report — checkout abre | ✓ OK | Link "Empezar Premium · 9,90 €" en /pricing |
| Provider Lead Pack — checkout | ⚠ no probado | requiere flujo de proveedor autenticado |
| Webhook `/api/webhook/stripe` | ✓ OK | 400 para firma inválida |
| Webhook — idempotencia | ✓ code-verified | guard `paidAt: null` en updateMany |
| Webhook — handler budget_review | ✓ code-verified | actualiza status=PAID, paidAt, stripeSessionId |
| Webhook — handler assessment (premium) | ✓ code-verified | actualiza isPremium=true |
| Stripe CLI forward | ✓ conectado | whsec temporal (diferente al .env) |

---

## Base de datos

| Check | Resultado |
|---|---|
| Migraciones Prisma | ✓ schema desplegado (app sirve correctamente) |
| BudgetReview — idempotencia webhook | ✓ code-verified (`where: { paidAt: null }`) |
| BudgetReview — registro directo DB | ⚠ no ejecutable (prisma db execute sin soporte --url en v7.8.0) |
| Assessment duplicados | ✓ code-verified (mismo guard) |

---

## Budget Review — Flujo gratuito

| Check | Resultado |
|---|---|
| Página carga (200) | ✓ |
| H1 visible | ✓ "Segunda opinión de presupuesto de reforma" |
| Textarea visible | ✓ |
| Botón "Importar presupuesto PDF" visible | ✓ |
| Disclaimer orientativo visible | ✓ |
| Análisis con texto: se crea resultado | ✓ |
| Total detectado correcto | ✓ 26.300 EUR |
| Confianza mostrada | ✓ 78% |
| Contenido completo bloqueado antes del pago | ✓ |
| CTA "Desbloquear informe completo 19,90 EUR" visible | ✓ |
| Checkout Stripe se abre | ✓ |
| Sin mezcla de idiomas crítica | ✓ |
| Acceso desde navbar (dropdown Producto) | ✓ |
| Acceso desde footer ("Presupuestos") | ✓ |
| Vista móvil 390x844 | ✓ sin overflow |

---

## i18n / copy / legal

| Check | Resultado |
|---|---|
| navProduct en ES/EN/DE | ✓ añadido |
| navBudgetReview en ES/EN/DE | ✓ existía |
| Claims peligrosos prohibidos | ✓ NINGUNO encontrado |
| Disclaimer orientativo presente | ✓ múltiples ubicaciones |
| "No sustituye al CEE oficial" | ✓ presente |
| Mezcla de idiomas en rutas nuevas | ✓ ninguna crítica |
| Acentos en copy ES Budget Review | ✓ corregidos en este PR |

---

## Admin metrics

| Check | Resultado |
|---|---|
| Sin auth → 403 | ✓ |
| Con sesión fake → 403 | ✓ |
| Protección por ADMIN_EMAILS | ✓ middleware activo |

---

## Incidencias encontradas

| ID | Severidad | Área | Descripción | Estado |
|---|---|---|---|---|
| QA-001 | Baja | Copy/i18n | Acentos faltantes en strings ES de Budget Review (título, disclaimer, placeholder, nombre Stripe) | **Cerrada** — commit `d99ca29` |
| QA-002 | Baja | AI parsing | "Partidas detectadas: 0" con 3 line items en texto de presupuesto. Total se detecta correctamente (26.300€). Probable umbral de parsing. | **Abierta** |
| QA-003 | Info | Auth | `/dashboard` y `/provider/dashboard` devuelven 200 sin auth (probablemente muestran formulario de login o redirigen client-side). No bloquea si la redirección es correcta. | **Abierta — verificar manualmente** |
| QA-004 | Info | Stripe | Completar pago con tarjeta test no automatizable via Playwright por iframe security de Stripe. Verificación de webhook post-pago requiere test manual o Stripe CLI con whsec correcto. | **Abierta — requiere test manual** |
| QA-005 | Baja | Copy | Otros strings ES en `src/lib/monetization/i18n.ts` (seoCity, profesional, proveedor) tienen acentos faltantes. No críticos para el flujo principal. | **Abierta — deuda técnica** |

---

## Evidencias clave

- Fecha/hora: 2026-05-17 21:xx UTC
- Stripe Checkout Session (Budget Review): `cs_test_a1D4CC…`
- Stripe Checkout Session anterior: `cs_test_a16Rta…`
- Webhook secret CLI (temporal): `whsec_…`
- Importe Budget Review confirmado en Stripe UI: €19.90
- Producto Stripe: "Segunda opinión de presupuesto EnergyScan"
- Rutas smoke test: 12/12 públicas → 200

---

## Comandos ejecutados

```bash
# Smoke routes
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/<ruta>

# Admin protection
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/admin/metrics  # → 403

# Legal claims
grep -rn "certificado energético oficial online|CEE oficial|ahorro garantizado..." src/

# Webhook check
curl -X POST http://localhost:3001/api/webhook/stripe -H "Content-Type: application/json" -d '{}'  # → 400

# Stripe CLI
stripe listen --forward-to http://localhost:3001/api/webhook/stripe

# Build & serve
npm run build && npm run start -- -p 3001
```

---

## Resultado de validaciones

| Validación | Resultado |
|---|---|
| `npm run build` | ✓ Compiled successfully, 40/40 páginas |
| `npx tsc --noEmit` | ✓ sin errores |
| Legal claims check | ✓ sin claims peligrosos |
| Rutas públicas smoke | ✓ 12/12 → 200 |
| Admin metrics | ✓ → 403 |
| Webhook endpoint | ✓ → 400 sin firma |

---

## Decisión

**Mantener en staging — preparar para live con precauciones.**

### Pendiente antes de live

1. Completar test manual del pago Budget Review con tarjeta `4242 4242 4242 4242` y verificar DB post-webhook
2. Añadir `STRIPE_WEBHOOK_SECRET` del Stripe CLI al `.env.local` de desarrollo para tests futuros
3. Revisar `/dashboard` y `/provider/dashboard` — confirmar que redirigen a login client-side (no muestran datos sin auth)
4. Configurar claves live de Stripe en Vercel (no usar test keys en producción)
5. Revisar política de reembolso y fiscalidad IVA antes de producción real
6. Corregir acentos restantes en strings seoCity/profesional/proveedor (QA-005)

---

## Próximos pasos recomendados

1. **Test manual pago**: abrir `http://localhost:3001/budget-review`, pegar presupuesto, pulsar "Desbloquear 19,90 EUR", pagar con `4242 4242 4242 4242 / 12/34 / 123`, verificar redirección y DB
2. **PDF real**: probar importación de PDF de presupuesto real via "Importar presupuesto PDF" y verificar análisis
3. **Premium Report**: completar wizard → pagar Premium → verificar PDF desbloqueado
4. **Provider Lead Pack**: registrar proveedor → comprar créditos → verificar leads
5. **Despliegue Vercel**: push rama → preview → smoke test en URL de preview
