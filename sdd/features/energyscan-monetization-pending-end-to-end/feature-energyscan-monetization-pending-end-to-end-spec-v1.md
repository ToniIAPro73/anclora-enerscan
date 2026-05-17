# EnergyScan Monetization Pending End-to-End Spec v1

## Objetivo

Implementar las piezas pendientes de monetización de mayor impacto sin rehacer el checkout Premium existente ni alterar el gating del PDF.

## Alcance implementado

- Analítica real opcional con PostHog HTTP y fallback seguro.
- Persistencia interna opcional de eventos críticos.
- Emails transaccionales con Resend opcional y logs.
- Recuperación de checkout abandonado mediante cron protegido.
- SEO programático inicial por ciudad.
- Calculadora pública de ahorro orientativo.
- Producto standalone de segunda opinión de presupuesto.
- Marketplace proveedor MVP con registro, panel, leads y créditos.
- Partner landing con atribución hacia wizard.
- Solicitud de acceso profesional beta.
- Dashboard interno de métricas protegido por allowlist.

## Fuera de alcance

- API pública enterprise.
- White-label completo.
- Subasta inversa.
- Venta de datos agregados.
- Plugin CRM.
- Stripe Billing de suscripción profesional.
- Emisión o venta de CEE oficial.
