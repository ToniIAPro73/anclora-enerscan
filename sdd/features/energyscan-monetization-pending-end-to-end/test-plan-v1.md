# Test Plan v1

## Automatizados

- `npx prisma generate`
- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `npm run build`

## Tests añadidos

- `tests/analytics.test.ts`
- `tests/email.test.ts`
- `tests/seo-calculator.test.ts`
- `tests/budget-review.test.ts`
- `tests/provider-monetization.test.ts`

## QA manual mínima

- Abrir `/ciudad/palma`.
- Abrir `/calculadora-ahorro`.
- Abrir `/budget-review`.
- Abrir `/proveedores`.
- Confirmar `POST /api/cron/checkout-recovery` sin secreto devuelve 403.
- Confirmar build lista rutas nuevas.

## QA pendiente recomendada

- Premium checkout real con Stripe CLI.
- Webhook real de budget review.
- Registro proveedor autenticado y consumo de créditos.
- Partner attribution completando wizard.
- Admin metrics con `ADMIN_EMAILS`.
