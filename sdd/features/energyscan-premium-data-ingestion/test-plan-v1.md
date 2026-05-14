# Test Plan v1

## Unitarios
- CEE: programa, letra, energia primaria, emisiones, superficie, ano, zona climatica, recomendaciones, coma decimal y NEEDS_REVIEW.
- Presupuesto: total, lineas, categorias energeticas, partidas no energeticas, impacto conservador y medidas faltantes.
- Ingestion: prioridad de fuentes y no sobrescritura de usuario.

## Integracion
- Endpoint pre-assessment CEE con PDF/texto suficiente.
- Endpoint pre-assessment presupuesto con PDF/texto suficiente.
- Creacion assessment con payloads `energyCertificate` y `rehabBudget`.

## PDF
- Secciones opcionales aparecen solo cuando hay datos.
- Disclaimers presentes.

## Manual
- Wizard sin CEE/presupuesto.
- Wizard con CEE, aplicar datos.
- Wizard con presupuesto.
- PDF premium con datos persistidos.
