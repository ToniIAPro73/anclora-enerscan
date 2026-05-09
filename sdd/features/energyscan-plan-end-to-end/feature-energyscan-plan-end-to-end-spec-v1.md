# Feature Spec v1 — EnergyScan Plan End-to-End

## Contexto

Anclora EnergyScan es una herramienta mobile-first de prediagnóstico energético orientativo. No emite Certificados de Eficiencia Energética oficiales ni documentos con validez administrativa.

## Alcance

- Actualización legal y normativa.
- Scoring v2.1 con reglas modulares y trazabilidad.
- Timeline regulatorio enriquecido.
- Simulador de mejoras con escenarios más accionables.
- Capa informativa de ayudas y subvenciones.
- Validaciones básicas de adjuntos.
- Leads con logging estructurado, fallback observable y rate limit MVP.
- Vista de resultados y PDF premium actualizados.
- Tests unitarios de scoring, normativa, simulador, ayudas y adjuntos.

## Fuera de alcance

- Stripe real.
- Autenticación completa.
- Parser productivo de CEE.
- Modelos ML.
- Scraping o verificación dinámica de ayudas.
- Backoffice avanzado de partners/proveedores.

## Cambios funcionales

- La UI separa letra, score, confianza, penalizaciones, fortalezas, contexto regulatorio, escenarios, ayudas, adjuntos, proveedores y CTA de PDF.
- El PDF incluye normativa actualizada, escenarios ampliados y ayudas potencialmente relevantes.
- Los adjuntos inválidos se rechazan con mensajes claros.
- Los leads mantienen fallback no persistente si falla la base de datos y dejan trazas estructuradas.

## Cambios técnicos

- `calculateScoreV2` queda dividido en arrays de reglas: data quality, typology, envelope, systems, renewables y climate.
- `ScoreResultV2` conserva shape existente y añade `ruleBreakdown` opcional.
- `RegulatoryTimelineItem` se amplía con jurisdicción, referencia legal, impacto, estado y disclaimer.
- Se añade `SubsidyInfoItem` y `src/lib/subsidies.ts`.
- `ImprovementScenario` se amplía manteniendo compatibilidad con campos existentes.

## Riesgos

- El rate limit de leads es solo en memoria y no es apto para producción distribuida.
- La información de ayudas no se verifica dinámicamente.
- El scoring sigue siendo heurístico y no sustituye una metodología oficial reconocida.
- La renderización de páginas CEE en PDF depende de `pdftoppm` cuando se incluyen PDFs demo.

## Decisiones tomadas

- Mantener compatibilidad de API pública del scoring.
- Evitar nuevas dependencias.
- Centralizar normativa y ayudas en módulos de librería.
- Usar rangos cualitativos en simulador para no prometer ahorros ni importes exactos.
