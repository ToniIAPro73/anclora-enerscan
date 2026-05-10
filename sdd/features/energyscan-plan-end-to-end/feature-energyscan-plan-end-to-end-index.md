# EnergyScan Plan End-to-End

## Objetivo

Implementar una mejora incremental del MVP de Anclora EnergyScan centrada en hardening legal, scoring v2.1 modular, normativa enriquecida, simulador accionable, ayudas informativas, robustez básica de adjuntos/leads y actualización de resultados/PDF.

## Estado

Implementado en la rama `feat/energyscan-plan-end-to-end`.

## Archivos principales afectados

- `src/lib/scoring.ts`
- `src/lib/regulatory.ts`
- `src/lib/simulator.ts`
- `src/lib/subsidies.ts`
- `src/lib/attachments.ts`
- `src/app/api/assessment/route.ts`
- `src/app/api/leads/route.ts`
- `src/app/assessment/[id]/page.tsx`
- `src/lib/pdf/EnerScanReport.tsx`
- `src/lib/domain/energy-assessment.ts`
- `README.md`
- `tests/scoring-v2.test.ts`
- `tests/regulatory-simulator-subsidies.test.ts`
- `tests/attachments-preferences.test.ts`

## Relación con el plan de mejora

La implementación cubre Fase 0 completa y una primera versión práctica de Fase 1: normativa v1.1, simulador v1.1, ayudas informativas, mejoras de resultado y PDF premium.
