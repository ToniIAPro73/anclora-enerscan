# Test Plan v1 — Premium Checkout Monetization

## Unitarios

- `premium-access`: pago real, legacy `isPremium`, demo autorizada y assessment no pagado.
- `checkout`: `assessmentId` ausente, assessment inexistente, assessment ya pagado y creación de sesión con metadata.
- `stripe-webhook`: firma inválida y `checkout.session.completed` marcando `paidAt`.

## Integración Local

- `npx prisma generate`
- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `npm run build`

## QA Manual

1. Crear assessment desde wizard.
2. Abrir `/assessment/{id}` y verificar resultado básico gratuito.
3. Confirmar paywall y ausencia de descarga PDF directa si no hay pago.
4. Intentar `/api/assessment/{id}/pdf` sin pago y esperar `402 premium_required`.
5. Iniciar checkout con Stripe test.
6. Confirmar pago con Stripe CLI reenviando a `/api/webhook/stripe`.
7. Verificar `paidAt`, `isPremium=true`, `paymentStatus=paid`.
8. Abrir `/checkout/success?session_id=...` y descargar PDF.
9. Revisar demo con `ENABLE_DEMO_PREMIUM=true`.
10. Revisar ES/EN/DE en paywall, pricing y success.
