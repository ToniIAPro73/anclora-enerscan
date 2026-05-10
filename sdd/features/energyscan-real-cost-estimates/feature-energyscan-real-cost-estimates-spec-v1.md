# Spec v1 — EnergyScan Real Cost Estimates

## Contexto

EnergyScan genera un prediagnóstico energético orientativo. Esta feature añade estimaciones económicas por escenario para hacer el PDF Premium más accionable, manteniendo disclaimers claros.

## Alcance

- Modelos Prisma para fuentes, partidas, medidas, mapeos y estimaciones.
- Catálogo seed idempotente con rangos orientativos.
- Motor offline de cantidades y costes.
- Matriz por tipología y salto energético.
- Integración con simulador, resultados y PDF.
- Preparación ETL BC3/FIEBDC sin parser productivo.

## Modelo de Datos

Se añaden `PriceSource`, `PriceItem`, `EnergyMeasure`, `MeasurePriceMap`, `EstimateRun` y `EstimateLine`, más relación `Assessment.costEstimateRuns`.

## Motor de Costes

El motor resuelve cantidades por proxy trazable, aplica factores de calidad, complejidad y región, y devuelve siempre rangos mínimo/medio/máximo con confianza y assumptions.

## PDF Premium

El PDF incluye resumen económico por escenario, detalle ligero de partidas, trazabilidad de fuentes y disclaimers. Las páginas del CEE y anexos documentales existentes se mantienen.

## Decisiones

- Catálogo interno seed como primera fuente.
- No se consulta BEDEC/CYPE/PREOC en vivo.
- No se instala `bc3reader`.
- Los importes no incluyen IVA, licencias ni presupuesto cerrado salvo indicación futura explícita.

## Riesgos

- Los proxies de cantidades requieren validación técnica posterior.
- La matriz seed no sustituye mediciones reales.
- La ingesta de fuentes técnicas necesitará revisión de licencias.
