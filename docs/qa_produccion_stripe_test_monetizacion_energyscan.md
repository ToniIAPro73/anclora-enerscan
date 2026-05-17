# Guía de QA en producción — Anclora EnergyScan monetización con Stripe en modo test

## 1. Objetivo

Validar en el entorno desplegado de producción/staging de **Anclora EnergyScan** las nuevas vías de monetización implementadas, usando todavía **Stripe en modo test**.

La validación debe confirmar que:

1. La aplicación desplegada arranca y sirve todas las rutas nuevas.
2. La base de datos de producción/staging tiene las migraciones aplicadas.
3. Los tres flujos de Stripe funcionan en modo test:
   - Premium report.
   - Budget Review.
   - Provider Lead Pack.
4. El webhook de Stripe actualiza únicamente el modelo correcto.
5. No hay duplicidad de pagos, créditos ni emails.
6. Las rutas protegidas devuelven 401/403 cuando corresponde.
7. El PDF Premium sigue bloqueado hasta pago.
8. Las páginas nuevas son navegables y no rompen i18n básico.
9. No se publican claims incorrectos sobre CEE oficial.

---

## 2. Alcance de esta QA

### Incluido

- Pruebas manuales en URL desplegada.
- Stripe Checkout en modo test.
- Webhook real de Stripe test hacia el dominio desplegado.
- Verificación básica en base de datos.
- Verificación de rutas públicas y protegidas.
- Verificación de emails si `RESEND_API_KEY` está configurada en test.
- Verificación de logs de Vercel/Render/hosting.

### No incluido

- Pagos reales en modo live.
- Stripe Billing profesional recurrente.
- White-label enterprise.
- API pública enterprise.
- Subasta inversa de proveedores.
- Validación legal exhaustiva.
- QA visual completa pixel-perfect.

---

## 3. Precondiciones

Antes de empezar, confirma que la rama correcta está desplegada.

Rama esperada:

```bash
fix/monetization-stripe-i18n-hardening
```

Commits esperados:

```txt
a4cbdf5 feat: implement pending EnergyScan monetization flows
<commit-hardening> fix: harden monetization stripe i18n and admin access
```

El entorno desplegado debe tener:

```txt
NEXT_PUBLIC_APP_URL=https://<dominio-produccion-o-staging>
AUTH_URL=https://<dominio-produccion-o-staging>
AUTH_TRUST_HOST=true
```

Y la base de datos debe apuntar al entorno correcto:

```txt
DATABASE_URL=<Neon/Postgres del entorno desplegado>
DIRECT_URL=<Neon/Postgres directo si aplica>
```

---

## 4. Variables de entorno requeridas

### 4.1 Stripe en modo test

En el entorno desplegado, deben estar configuradas claves **test**, no live.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM=price_...        # Price test, opcional si hay price_data dinámico
STRIPE_PRICE_BUDGET_REVIEW=price_...  # Price test, opcional si hay price_data dinámico
STRIPE_PRICE_PROVIDER_LEAD_PACK=price_... # Price test, opcional si hay price_data dinámico
```

Variables públicas/precio:

```env
NEXT_PUBLIC_PREMIUM_PRICE_EUR=9.90
NEXT_PUBLIC_PREMIUM_STANDARD_PRICE_EUR=14.90
NEXT_PUBLIC_BUDGET_REVIEW_PRICE_EUR=19.90
NEXT_PUBLIC_PROVIDER_LEAD_PACK_PRICE_EUR=300
PROVIDER_LEAD_PACK_CREDITS=10
```

### 4.2 Email

Para probar emails en modo seguro:

```env
RESEND_API_KEY=<test o cuenta controlada>
EMAIL_FROM="Anclora EnergyScan <no-reply@anclora.com>"
SUPPORT_EMAIL="soporte@anclora.com"
```

Si no quieres enviar emails reales durante QA, deja `RESEND_API_KEY` vacío. La app no debería romper el flujo.

### 4.3 Analytics

```env
NEXT_PUBLIC_POSTHOG_KEY=<key test/proyecto staging>
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
ENABLE_ANALYTICS_EVENT_LOG=true
```

### 4.4 Recovery cron

```env
CRON_SECRET=<valor-secreto-largo>
ABANDONED_CHECKOUT_DELAY_HOURS=24
ABANDONED_CHECKOUT_DISCOUNT_CODE=VUELVE5
```

### 4.5 Admin metrics

```env
ADMIN_EMAILS=tu-email-admin@dominio.com
```

El email debe coincidir con el usuario autenticado en la app.

---

## 5. Configurar webhook de Stripe test

En Stripe Dashboard:

1. Activar **Test mode**.
2. Ir a **Developers → Webhooks**.
3. Crear endpoint:

```txt
https://<dominio>/api/webhook/stripe
```

4. Seleccionar eventos mínimos:

```txt
checkout.session.completed
checkout.session.expired
```

5. Copiar el signing secret:

```txt
whsec_...
```

6. Pegar ese valor en el entorno desplegado como:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

7. Redeploy de la aplicación si el hosting no aplica env vars automáticamente.

---

## 6. Comprobaciones previas de base de datos

Ejecutar desde local, apuntando al `DATABASE_URL` del entorno desplegado o desde consola SQL de Neon.

### 6.1 Estado de migraciones

```bash
npx prisma migrate status
```

Resultado esperado:

```txt
Database schema is up to date!
```

### 6.2 Comprobar duplicados antes de unique constraint

Si la migración `20260516224500_harden_provider_credit_idempotency` ya está aplicada, esta query debe devolver 0 filas igualmente.

```sql
SELECT "stripeSessionId", COUNT(*)
FROM "ProviderLeadCreditLedger"
WHERE "stripeSessionId" IS NOT NULL
GROUP BY "stripeSessionId"
HAVING COUNT(*) > 1;
```

Resultado esperado:

```txt
0 rows
```

### 6.3 Comprobar tablas nuevas

```sql
SELECT to_regclass('"EmailLog"');
SELECT to_regclass('"CheckoutRecovery"');
SELECT to_regclass('"AnalyticsEventLog"');
SELECT to_regclass('"BudgetReview"');
SELECT to_regclass('"ProviderAccount"');
SELECT to_regclass('"ProviderLeadCreditLedger"');
SELECT to_regclass('"ProviderSubscription"');
SELECT to_regclass('"ProfessionalAccessRequest"');
```

Resultado esperado: todas existen.

---

## 7. Smoke test de rutas públicas

Abrir en navegador o validar con `curl`.

Sustituye:

```txt
BASE_URL=https://<dominio>
```

### 7.1 Rutas esperadas 200

```bash
curl -I "$BASE_URL/ciudad/palma"
curl -I "$BASE_URL/calculadora-ahorro"
curl -I "$BASE_URL/budget-review"
curl -I "$BASE_URL/proveedores"
curl -I "$BASE_URL/provider/register"
curl -I "$BASE_URL/partner/demo-aerotermia-mallorca"
curl -I "$BASE_URL/profesional"
curl -I "$BASE_URL/profesional/solicitar"
curl -I "$BASE_URL/dashboard"
curl -I "$BASE_URL/sitemap.xml"
curl -I "$BASE_URL/robots.txt"
```

Resultado esperado:

```txt
HTTP 200
```

Puede haber redirects de auth en `/dashboard` según implementación. Si redirige a login, es aceptable.

### 7.2 Rutas protegidas esperadas 401/403

Sin sesión:

```bash
curl -I "$BASE_URL/admin/metrics"
```

Resultado esperado:

```txt
HTTP 403
```

Sin sesión:

```bash
curl -i -X POST "$BASE_URL/api/provider/credits/checkout"
curl -i "$BASE_URL/api/provider/leads"
```

Resultado esperado:

```txt
HTTP 401
```

Cron sin secreto:

```bash
curl -i -X POST "$BASE_URL/api/cron/checkout-recovery"
```

Resultado esperado:

```txt
HTTP 403
```

---

## 8. Tarjetas Stripe test

Para pagos positivos usa:

```txt
4242 4242 4242 4242
```

Datos:

```txt
Fecha futura: 12/34
CVC: 123
ZIP/postal code: cualquiera válido, por ejemplo 07015
```

Para pago rechazado puedes usar una tarjeta de test de Stripe para declinación genérica. Si no quieres ampliar escenarios, con un pago correcto por producto es suficiente para esta primera QA.

Importante: no uses tarjetas reales en modo test.

---

# 9. QA flujo 1 — Premium Report

## 9.1 Crear análisis

1. Abrir:

```txt
$BASE_URL/wizard
```

2. Completar wizard con datos de prueba.
3. Llegar a resultado gratuito.
4. Verificar que aparece paywall o CTA Premium.

Resultado esperado:

```txt
El resultado básico se ve.
El PDF Premium está bloqueado.
Aparece CTA de checkout Premium.
```

## 9.2 Iniciar checkout Premium

1. Pulsar CTA Premium.
2. Debe abrir Stripe Checkout test.
3. Confirmar que el importe coincide:

```txt
9,90 € o 14,90 €, según configuración
```

4. Pagar con:

```txt
4242 4242 4242 4242
12/34
123
```

## 9.3 Verificar retorno

Tras pagar, Stripe debe redirigir a página de éxito.

Resultado esperado:

```txt
Se muestra confirmación.
El análisis queda Premium.
El botón de descarga PDF queda disponible.
```

## 9.4 Verificar DB

Localiza el `assessmentId`.

```sql
SELECT id, "paidAt", "paymentStatus", "stripeSessionId", "paidAmountCents", "paidCurrency", "isPremium"
FROM "Assessment"
WHERE id = '<assessmentId>';
```

Resultado esperado:

```txt
paidAt: no null
paymentStatus: paid
stripeSessionId: cs_test_...
paidAmountCents: coincide con precio
paidCurrency: eur
isPremium: true
```

## 9.5 Verificar webhook idempotente

En Stripe Dashboard → Events, reintentar el evento `checkout.session.completed` si Stripe lo permite.

Resultado esperado:

```txt
No duplica emails.
No cambia dos veces el estado.
No crea efectos secundarios duplicados.
No falla con 500.
```

## 9.6 Verificar PDF

Descargar PDF Premium.

Resultado esperado:

```txt
PDF se descarga.
Nombre correcto según idioma.
No aparece como demo si no era demo.
Incluye disclaimers orientativos.
```

---

# 10. QA flujo 2 — Budget Review

## 10.1 Abrir flujo

Abrir:

```txt
$BASE_URL/budget-review
```

Resultado esperado:

```txt
Página carga en 200.
Se muestra flujo para analizar presupuesto.
Se muestra disclaimer de análisis automático orientativo.
```

## 10.2 Analizar presupuesto

Usa un texto de prueba:

```txt
Presupuesto reforma energética
Sustitución de ventanas PVC doble acristalamiento: 4.800 €
Instalación aerotermia ACS y calefacción: 9.500 €
Aislamiento fachada SATE parcial: 12.000 €
Total presupuesto: 26.300 €
IVA no incluido.
```

Enviar análisis.

Resultado esperado:

```txt
Se crea BudgetReview.
Status inicial: ANALYZED.
paid: false.
Muestra resumen básico sin desbloquear contenido premium completo.
```

## 10.3 Iniciar checkout Budget Review

Pulsar CTA de pago.

Resultado esperado:

```txt
Stripe Checkout test se abre.
Importe esperado: 19,90 € o el configurado.
Producto: Budget Review / Segunda opinión de presupuesto.
```

Pagar con tarjeta test positiva.

## 10.4 Verificar DB

Localiza `budgetReviewId`.

```sql
SELECT id, status, "paidAt", "stripeSessionId", "paidAmountCents", "paidCurrency"
FROM "BudgetReview"
WHERE id = '<budgetReviewId>';
```

Resultado esperado:

```txt
status: PAID
paidAt: no null
stripeSessionId: cs_test_...
paidAmountCents: 1990 o precio configurado
paidCurrency: eur
```

## 10.5 Verificar acceso post-pago

Abrir:

```txt
$BASE_URL/budget-review/<budgetReviewId>
```

o la ruta real de detalle si difiere.

Resultado esperado:

```txt
El contenido completo aparece desbloqueado.
No se desbloquea otro modelo distinto.
No marca Assessment como pagado.
```

## 10.6 Verificar expiración

Crear otro BudgetReview, iniciar checkout y no pagar.

Desde Stripe Dashboard, expirar la sesión si está disponible.

Resultado esperado:

```txt
BudgetReview pasa a EXPIRED si paidAt sigue null.
No se marca como pagado.
```

---

# 11. QA flujo 3 — Provider Lead Pack

## 11.1 Crear o usar usuario proveedor

1. Registrarse/login con un usuario de prueba.
2. Abrir:

```txt
$BASE_URL/provider/register
```

3. Registrar proveedor demo.

Resultado esperado:

```txt
Provider creado.
ProviderAccount asociado al usuario.
Acceso a /provider/dashboard.
```

## 11.2 Ver estado inicial de créditos

En DB:

```sql
SELECT id, name, "leadCreditsBalance"
FROM "Provider"
ORDER BY "createdAt" DESC
LIMIT 5;
```

Resultado esperado:

```txt
leadCreditsBalance inicial: 0 o valor seed/demo conocido.
```

## 11.3 Comprar pack de créditos

Abrir:

```txt
$BASE_URL/provider/billing
```

Pulsar comprar créditos.

Resultado esperado:

```txt
Stripe Checkout test se abre.
Importe esperado: 300 € o valor configurado.
Pack esperado: 10 créditos.
```

Pagar con tarjeta test positiva.

## 11.4 Verificar DB

```sql
SELECT id, "leadCreditsBalance"
FROM "Provider"
WHERE id = '<providerId>';
```

Resultado esperado:

```txt
leadCreditsBalance incrementado en PROVIDER_LEAD_PACK_CREDITS.
```

Ver ledger:

```sql
SELECT id, type, credits, "stripeSessionId", "createdAt"
FROM "ProviderLeadCreditLedger"
WHERE "providerId" = '<providerId>'
ORDER BY "createdAt" DESC
LIMIT 5;
```

Resultado esperado:

```txt
Una fila PURCHASE.
credits: 10 o valor configurado.
stripeSessionId: cs_test_...
```

## 11.5 Verificar idempotencia

Reintentar evento `checkout.session.completed` desde Stripe Dashboard.

Resultado esperado:

```txt
No se suma otro pack.
No se crea segundo ledger con mismo stripeSessionId.
No falla con 500.
```

## 11.6 Probar protección proveedor

Sin sesión:

```bash
curl -i "$BASE_URL/api/provider/leads"
```

Resultado esperado:

```txt
401
```

Con usuario proveedor, abrir:

```txt
$BASE_URL/provider/leads
```

Resultado esperado:

```txt
Carga panel de leads.
No muestra leads de otros proveedores.
```

---

# 12. QA Provider Lead desde usuario propietario

## 12.1 Crear solicitud de presupuesto

Desde un Assessment existente o nuevo:

1. Abrir resultado.
2. Localizar sección de proveedores o solicitud de presupuesto.
3. Enviar lead con datos de prueba.
4. Aceptar consentimiento explícito.

Resultado esperado:

```txt
Lead creado.
Consentimiento guardado.
Categoría y zona guardadas.
```

## 12.2 Verificar DB

```sql
SELECT id, email, phone, category, status, "consentAccepted", "providerId", "createdAt"
FROM "Lead"
ORDER BY "createdAt" DESC
LIMIT 10;
```

Resultado esperado:

```txt
consentAccepted: true
status: PENDING o equivalente
providerId: asignado si matching encontró proveedor
```

## 12.3 Verificar email/log proveedor

```sql
SELECT id, type, status, "assessmentId", "createdAt", error
FROM "EmailLog"
ORDER BY "createdAt" DESC
LIMIT 20;
```

Resultado esperado:

```txt
Email log creado si RESEND está configurado o fallback controlado.
No rompe el lead aunque falle email.
```

---

# 13. QA Checkout Recovery

## 13.1 Crear checkout abandonado Premium

1. Crear Assessment.
2. Iniciar checkout Premium.
3. No pagar.
4. Volver a la app o cerrar Stripe.

Verificar DB:

```sql
SELECT *
FROM "CheckoutRecovery"
ORDER BY "createdAt" DESC
LIMIT 10;
```

Resultado esperado:

```txt
Registro PENDING o equivalente asociado al Assessment.
```

## 13.2 Ejecutar cron sin secreto

```bash
curl -i -X POST "$BASE_URL/api/cron/checkout-recovery"
```

Resultado esperado:

```txt
403
```

## 13.3 Ejecutar cron con secreto

```bash
curl -i -X POST "$BASE_URL/api/cron/checkout-recovery" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Resultado esperado:

```txt
200
```

Si no ha pasado el delay configurado, puede no enviar todavía. Para QA, puedes ajustar temporalmente:

```env
ABANDONED_CHECKOUT_DELAY_HOURS=0
```

Después redeploy y repetir.

## 13.4 Verificar no duplicado

Ejecutar cron dos veces.

Resultado esperado:

```txt
No se envían dos emails de recuperación para el mismo Assessment.
recoverySentAt queda informado solo una vez.
```

## 13.5 Verificar no envía si ya pagó

1. Crear checkout.
2. Completar pago.
3. Ejecutar cron.

Resultado esperado:

```txt
No se envía recuperación.
Status SKIPPED_PAID o equivalente.
```

---

# 14. QA Admin Metrics

## 14.1 Sin sesión

Abrir:

```txt
$BASE_URL/admin/metrics
```

Resultado esperado:

```txt
403
```

## 14.2 Con sesión no admin

Login con un usuario cuyo email no esté en `ADMIN_EMAILS`.

Resultado esperado:

```txt
403
```

## 14.3 Con sesión admin

Login con email incluido en:

```env
ADMIN_EMAILS
```

Abrir:

```txt
$BASE_URL/admin/metrics
```

Resultado esperado:

```txt
Dashboard visible.
Muestra métricas de assessments, pagos, leads, budget reviews y proveedores.
No expone datos personales innecesarios.
```

---

# 15. QA SEO y calculadora

## 15.1 Página ciudad

Abrir:

```txt
$BASE_URL/ciudad/palma
```

Revisar:

- H1 claro.
- CTA al wizard.
- Disclaimer visible.
- No prometer CEE oficial.
- No afirmar ahorros garantizados.
- No inventar subvenciones concretas si no hay fuente.

Resultado esperado:

```txt
Página indexable y orientada a captación.
```

## 15.2 Calculadora pública

Abrir:

```txt
$BASE_URL/calculadora-ahorro
```

Probar:

```txt
Tipo: vivienda unifamiliar
Superficie: 120
Letra actual: E
Mejora: aerotermia
Gasto mensual: 180
```

Resultado esperado:

```txt
Muestra rangos orientativos.
No promete ahorro garantizado.
CTA al wizard.
Evento analytics si está configurado.
```

---

# 16. QA Partner Landing

Abrir:

```txt
$BASE_URL/partner/demo-aerotermia-mallorca
```

Resultado esperado:

```txt
Carga página personalizada.
Explica que el análisis lo realiza Anclora EnergyScan.
Incluye disclaimer.
CTA al wizard conserva atribución.
```

Comprobar URL del CTA:

```txt
/wizard?source=partner&partner=demo-aerotermia-mallorca
```

Después crear lead y verificar que se conserva atribución si el flujo lo soporta:

```sql
SELECT id, source, "partnerId", "providerId", "createdAt"
FROM "Lead"
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

# 17. QA Profesional Beta

Abrir:

```txt
$BASE_URL/profesional
$BASE_URL/profesional/solicitar
```

Enviar solicitud con datos de prueba:

```txt
Nombre: Técnico Demo
Email: tecnico-demo@example.com
Perfil: certificador / arquitecto técnico / inmobiliaria
Volumen estimado: 10 análisis/mes
```

Verificar DB:

```sql
SELECT id, email, status, "createdAt"
FROM "ProfessionalAccessRequest"
ORDER BY "createdAt" DESC
LIMIT 10;
```

Resultado esperado:

```txt
Solicitud creada.
No cobra todavía.
No confunde plan profesional con Premium individual.
```

---

# 18. QA i18n visual básica

Probar manualmente, si el toggle ES/EN/DE está disponible:

1. ES:
   - `/budget-review`
   - `/calculadora-ahorro`
   - `/proveedores`
   - `/profesional`

2. EN:
   - mismos flujos.
   - moneda GBP si aplica por preferencia.
   - unidades sq ft si aplica.

3. DE:
   - mismos flujos.
   - moneda EUR.
   - unidades m².

Resultado esperado:

```txt
No hay mezcla evidente de idiomas en nuevos bloques principales.
No hay textos críticos hardcodeados en español en páginas EN/DE.
Disclaimers aparecen en el idioma activo o fallback aceptable.
```

Si encuentras textos mezclados, anotar ruta exacta, idioma y texto.

---

# 19. QA legal/copy

Buscar visualmente y, si tienes acceso al repo desplegado localmente, también con grep antes del deploy.

No deben aparecer claims como:

```txt
certificado energético oficial online
CEE oficial por 14,90 €
ahorro garantizado
sube tu letra garantizado
válido para registro oficial
cumplimiento garantizado
```

Deben aparecer mensajes equivalentes a:

```txt
Prediagnóstico orientativo.
No sustituye al Certificado de Eficiencia Energética oficial.
Costes, ahorros, ayudas y resultados pueden variar.
```

---

# 20. Revisión de logs

Durante cada flujo, revisar logs del hosting.

Buscar errores:

```txt
500
StripeSignatureVerificationError
Webhook error
PrismaClientKnownRequestError
P2002
Unauthorized inesperado
Email send failed
Cannot read properties of undefined
NEXT_REDIRECT inesperado
```

Especialmente tras pagos:

- Premium Checkout.
- Budget Review Checkout.
- Provider Credits Checkout.
- Reintento de webhook.

Resultado esperado:

```txt
No hay errores 500.
Los errores esperados 401/403 aparecen solo en rutas protegidas.
P2002 no debe aparecer salvo que se capture y trate como no-op.
```

---

# 21. Matriz de aceptación

| Área | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| DB | migrate status | Up to date | Pendiente |
| DB | duplicados stripeSessionId | 0 filas | Pendiente |
| Premium | checkout test | Redirige a Stripe | Pendiente |
| Premium | webhook completed | Assessment paidAt informado | Pendiente |
| Premium | PDF | Descarga desbloqueada | Pendiente |
| Budget Review | analyze | 200 + ANALYZED | Pendiente |
| Budget Review | checkout | Stripe URL | Pendiente |
| Budget Review | webhook | BudgetReview PAID | Pendiente |
| Provider Credits | checkout | Stripe URL | Pendiente |
| Provider Credits | webhook | créditos incrementados | Pendiente |
| Provider Credits | idempotencia | no duplica ledger | Pendiente |
| Leads | consentimiento | Lead guardado | Pendiente |
| Recovery | sin secreto | 403 | Pendiente |
| Recovery | con secreto | 200 | Pendiente |
| Admin | no admin | 403 | Pendiente |
| Admin | admin | dashboard visible | Pendiente |
| SEO | /ciudad/palma | 200 + CTA + disclaimer | Pendiente |
| Calculator | rangos | sin promesas garantizadas | Pendiente |
| Partner | atribución | partner en URL/lead | Pendiente |
| Profesional | solicitud | request creado | Pendiente |
| i18n | ES/EN/DE | sin mezcla crítica | Pendiente |
| Legal | claims | sin claims prohibidos | Pendiente |

---

# 22. Criterio para aprobar QA

Puedes dar la QA como aprobada para staging si se cumple:

1. Los tres checkouts test abren Stripe y completan pago.
2. Los tres webhooks actualizan el modelo correcto.
3. Provider credits no se duplican al reintentar webhook.
4. Premium PDF se bloquea antes del pago y se desbloquea después.
5. Budget Review no desbloquea contenido premium antes del pago.
6. Rutas protegidas devuelven 401/403 correctamente.
7. `/admin/metrics` solo es accesible para `ADMIN_EMAILS`.
8. Las rutas nuevas devuelven 200.
9. No hay errores 500 en logs.
10. No hay claims legales peligrosos.

No aprobar para producción real/live todavía si no se han probado claves live, facturación real, política de reembolso, fiscalidad/IVA y emails definitivos.

---

# 23. Criterio de rollback

Hacer rollback si ocurre cualquiera de estos casos:

1. Webhook devuelve 500 de forma recurrente.
2. Un pago Premium marca `BudgetReview` o viceversa.
3. Un provider pack duplica créditos.
4. El PDF queda desbloqueado sin pago.
5. `/admin/metrics` queda accesible sin admin.
6. La migración Prisma falla en staging.
7. Aparecen errores graves de auth en rutas públicas.
8. El sitio deja de servir landing/wizard principal.

Rollback recomendado:

```bash
git revert <commit-hardening>
git revert a4cbdf5
```

Solo revertir el commit necesario si el fallo está localizado.

---

# 24. Evidencias a guardar

Para cada flujo, guarda:

- URL probada.
- Fecha/hora.
- Usuario usado.
- Stripe Checkout Session ID `cs_test_...`.
- Stripe Event ID `evt_...`.
- ID interno:
  - `assessmentId`,
  - `budgetReviewId`,
  - `providerId`,
  - `leadId`.
- Captura de pantalla de Stripe Checkout.
- Captura de pantalla de éxito.
- Query SQL de verificación.
- Resultado en logs.

Plantilla:

```md
## Evidencia QA

- Fecha:
- Entorno:
- URL:
- Flujo:
- Usuario:
- Stripe Session:
- Stripe Event:
- ID interno:
- Resultado esperado:
- Resultado obtenido:
- Logs relevantes:
- Capturas:
- Estado: OK / KO / Revisar
```

---

# 25. Orden recomendado de ejecución

Ejecuta en este orden:

1. Variables de entorno.
2. Webhook Stripe test.
3. Migraciones DB.
4. Smoke rutas públicas.
5. Protecciones 401/403.
6. Premium Report checkout.
7. Budget Review checkout.
8. Provider Credits checkout.
9. Idempotencia webhooks.
10. Lead provider.
11. Checkout recovery.
12. Admin metrics.
13. SEO/calculadora.
14. Partner/profesional.
15. i18n visual.
16. Legal/copy.
17. Logs finales.

No empieces por provider marketplace si Premium todavía no pasa. Premium es el flujo comercial principal.

---

## 26. Resultado final esperado

Al terminar la QA, documenta:

```md
# Resultado QA Producción/Staging — Stripe Test

## Estado general
- Aprobado / Aprobado con salvedades / Bloqueado

## Entorno
- URL:
- Rama/commit:
- Fecha:

## Stripe
- Premium report: OK/KO
- Budget review: OK/KO
- Provider lead pack: OK/KO
- Webhook endpoint: OK/KO
- Idempotencia: OK/KO

## Base de datos
- Migraciones: OK/KO
- Duplicados ledger: OK/KO

## Rutas
- Públicas: OK/KO
- Protegidas: OK/KO

## Emails
- Premium: OK/KO/no configurado
- Recovery: OK/KO/no configurado
- Provider lead: OK/KO/no configurado

## Admin metrics
- OK/KO

## i18n/copy/legal
- OK/KO/revisar

## Incidencias
- ...

## Decisión
- Mantener en staging
- Preparar live
- Corregir antes de avanzar
- Rollback
```

