# EnergyScan - Ecosystem Alignment

## Fuente de verdad

La fuente de verdad documental de Anclora EnergyScan vive en la Bóveda Anclora:

- `proyectos/anclora-energyscan.md`
- `resources/Anclora EnergyScan.md`
- `resources/product-sheets/Ficha de producto - Anclora EnergyScan.md`
- `docs/governance/APPLICATION_FAMILY_MAP.md`
- `docs/governance/ecosystem-repos.json`

Este documento resume la alineación local del repo, pero no reemplaza la bóveda.

## Clasificación

- Producto: Anclora EnergyScan.
- Repo: `anclora-energyscan`.
- Tier: Premium.
- Familia: `premium`.
- Perfil recomendado: `premium analytical / premium utility`.
- Vertical: Real Estate + Energy Intelligence.
- Estado: MVP funcional en evolución.

## Contratos aplicables

- `ANCLORA_PREMIUM_APP_CONTRACT`
- `ANCLORA_BRANDING_MASTER_CONTRACT`
- `LOCALIZATION_CONTRACT`
- `UI_MOTION_CONTRACT`
- Anclora Design System Premium family

## Integraciones ecosistémicas previstas

- Nexus: leads, estados de evaluación, seguimiento operativo y trazabilidad.
- Data Lab: datos agregados, señales territoriales, costes orientativos y patrones energéticos.
- Synergi: proveedores, partners, certificadores externos e instaladores.
- Private Estates: contexto energético orientativo para activos inmobiliarios premium.

## Límite legal

Anclora EnergyScan no genera Certificados de Eficiencia Energética oficiales, no sustituye una certificación técnica y no emite documentación con validez administrativa. Es una herramienta de prediagnóstico energético orientativo.

## Rutas principales del repo

- `src/app/page.tsx`: landing pública.
- `src/app/wizard/page.tsx`: wizard de captura.
- `src/app/assessment/[id]/page.tsx`: resultados.
- `src/app/pricing/page.tsx`: pricing Premium.
- `src/app/api/assessment/route.ts`: creación de assessment.
- `src/app/api/checkout/route.ts`: Stripe Checkout.
- `src/app/api/webhook/stripe/route.ts`: confirmación de pago y `paidAt`.
- `src/lib/scoring.ts`: scoring orientativo.
- `src/lib/regulatory.ts`: contexto normativo.
- `src/lib/subsidies.ts`: ayudas informativas.
- `src/lib/catastro/`: Catastro.
- `src/lib/ocr/`: OCR/parsing.
- `src/lib/pdf/`: informe PDF Premium.
- `sdd/features/`: specs, test plans, execution reports y gates por feature.

## Relación con SDD

Las features SDD documentan evolución funcional, pero no deben cambiar la clasificación del producto sin actualizar primero la Bóveda Anclora.
