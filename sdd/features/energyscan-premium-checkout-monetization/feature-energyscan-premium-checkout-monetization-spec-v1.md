# Feature Spec v1 — Premium Checkout Monetization

## Objetivo

Activar monetización mínima viable para Anclora EnergyScan con modelo freemium: resultado básico gratuito y desbloqueo del informe Premium mediante pago único Stripe Checkout.

## Alcance

- Campos de pago en `Assessment`.
- Checkout de pago único para un assessment existente.
- Webhook Stripe con verificación de firma.
- Estado de pago consultable por sesión o assessment.
- Gating real del PDF Premium mediante `paidAt`.
- Página de resultados dividida entre contenido free y Premium.
- Paywall con precio de lanzamiento 9,90 € y aviso legal.
- Página de éxito y página de pricing.
- Tracking no-op preparado para eventos de conversión.

## Fuera de Alcance

- Suscripciones B2B.
- Marketplace completo.
- White-label.
- API pública.
- Emails transaccionales avanzados.
- Panel profesional.

## Reglas de Acceso

- `paidAt` es la fuente principal de desbloqueo real.
- `isPremium` se mantiene por compatibilidad, pero no abre Premium por sí solo.
- Demo Premium solo se desbloquea si `ENABLE_DEMO_PREMIUM="true"` y debe seguir marcada como demo.
- Stateless no debe ser bypass comercial salvo demo autorizada.

## Legal

Todo copy nuevo mantiene que Anclora EnergyScan genera un prediagnóstico orientativo. No vende ni emite un Certificado de Eficiencia Energética oficial ni un documento con validez administrativa.
