# Test Plan v1 — EnergyScan Real Cost Estimates

## Unitarios

- Resolver cantidades por tipología.
- Motor de costes con rangos coherentes.
- Matriz de escenarios por salto y tipología.
- Normalizador ETL de partidas importadas.

## Integración

- `generateScenarios` conserva escenarios existentes y añade `costEstimate`.
- PDF recibe escenarios con costes sin romper anexos.
- Página de resultados muestra rango y confianza.

## QA PDF

- Resumen económico visible.
- Detalle de actuaciones con rangos.
- Disclaimer de presupuesto orientativo.
- Bloque de bomba de calor cuando aplica.

## Validación

- `npm test`
- `npm run lint`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`
