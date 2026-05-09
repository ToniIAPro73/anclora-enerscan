# Test Plan v1

## Unit tests

- Helpers de partners/leads:
  - Parseo de arrays JSON y fallback CSV.
  - Formato de categorías y estados.
  - Cálculo de expiración de atribución.
  - Formato seguro de céntimos a EUR.
- Validación de leads:
  - Rechaza falta de consentimiento.
  - Rechaza falta de email/teléfono.
  - Acepta payload mínimo válido.
- Demo assets:
  - Existe CEE demo.
  - Existen 6 imágenes.
  - Hay 2 exteriores y 4 interiores.
  - Todas las rutas resuelven a fichero local.
  - Letra de scoring demo coincide con CEE demo.

## Integration checks

- `GET /api/providers` devuelve datos públicos sin campos sensibles.
- `POST /api/leads` crea o acepta solicitud con consentimiento.
- `/api/assessment/demo` redirige a assessment demo stateless.
- `/api/assessment/[id]/attachments/[attachmentId]` sirve imágenes y PDF demo reales.
- `/api/assessment/[id]/pdf` genera PDF con anexo visual.

## Build checks

- `npm test`
- `npm run lint`
- `npm run build`
- `npx prisma generate`
- Migración Prisma aplicada: `20260509155049_energyscan_partners_demo_assets`.

## Mobile-first visual QA

Viewports:
- 375x667
- 390x844
- 412x915

Pantallas:
- Landing.
- Wizard.
- Assessment result demo.
- Documentation section.
- Providers section.
- Lead form.
- PDF demo generation.

Checklist:
- No overflow horizontal.
- CTAs tocables.
- Cards apiladas correctamente.
- Inputs usables.
- Texto legal legible.
- Modo claro/oscuro con contraste suficiente.
- Miniaturas proporcionadas.
- Anexo PDF con 2 imágenes por página.
