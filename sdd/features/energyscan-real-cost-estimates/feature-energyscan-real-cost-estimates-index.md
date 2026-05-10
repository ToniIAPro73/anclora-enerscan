# EnergyScan Real Cost Estimates — Index

## Objetivo

Implementar el primer motor productivo de estimaciones económicas orientativas para Anclora EnergyScan, conectando medidas energéticas, partidas de precio, tipologías, escenarios y PDF Premium.

## Estado

En implementación sobre `feat/energyscan-real-cost-estimates`, creada desde `main` tras merge de `energyscan-plan-end-to-end`.

## Relación con features anteriores

- `energyscan-plan-end-to-end`: scoring v2.1, simulador, normativa, ayudas, Auth.js, Neon y Blob.
- `energyscan-partners-demo-assets-mobile-qa`: demo enriquecida, anexos documentales y proveedores.

## Archivos principales

- `prisma/schema.prisma`
- `prisma/seed-price-catalog.ts`
- `src/lib/costs/*`
- `src/lib/simulator.ts`
- `src/app/assessment/[id]/page.tsx`
- `src/lib/pdf/EnerScanReport.tsx`
- `docs/etl/price-catalog-etl-roadmap.md`

## Fuera de alcance

No se implementan presupuestos contractuales, certificación oficial, parser BC3 productivo, scraping, integración real con BEDEC/CYPE/PREOC ni panel admin.
