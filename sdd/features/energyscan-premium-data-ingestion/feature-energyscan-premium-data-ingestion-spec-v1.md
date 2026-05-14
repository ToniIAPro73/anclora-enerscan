# Spec v1 - EnergyScan Premium Data Ingestion

## Objetivo
Convertir EnergyScan en un prediagnostico premium capaz de combinar Catastro, CEE PDF, presupuestos de reforma y adjuntos del usuario con trazabilidad y revision.

## Alcance MVP
- Importacion CEE PDF con extraccion de texto nativa y parser rule-based.
- Analisis de presupuesto PDF con parser rule-based, clasificacion de medidas e impacto orientativo.
- Modelos Prisma para `EnergyCertificate`, `RehabBudget` y `DataFieldSource`.
- Endpoints de importacion y endpoints pre-assessment para el wizard.
- Resumen visual en wizard, aplicacion de campos CEE seleccionada por el usuario y no bloqueo del flujo manual.
- Secciones de trazabilidad, CEE y presupuesto en resultados/PDF.

## Fuera de Alcance
- No integrar CE3X como motor ejecutable.
- No ejecutar CE3X/HULC/CERMA en servidor.
- No emitir CEE oficial.
- No usar servicios OCR de pago como requisito.
- No garantizar salto de letra.
- No hacer scraping agresivo.
- No convertir presupuesto en oferta vinculante.

## Modelos de Datos
`EnergyCertificate` conserva campos extraidos del CEE y metadatos de extraccion. `RehabBudget` conserva totales, partidas, medidas detectadas e impacto orientativo. `DataFieldSource` guarda trazabilidad campo a campo.

## Pipeline CEE
1. Extraer texto PDF nativo con `pdfjs-dist`.
2. Evaluar calidad del texto por longitud y anchors.
3. Parsear campos con reglas y regex.
4. Marcar `PARSED` o `NEEDS_REVIEW` segun campos clave.
5. Aplicar al wizard solo con confirmacion del usuario.

## Pipeline Presupuesto
1. Extraer texto PDF nativo.
2. Detectar proveedor, fecha, total y lineas con importes.
3. Clasificar lineas mediante diccionarios por categoria energetica.
4. Estimar impacto conservador por categorias.
5. Mostrar confianza, supuestos y medidas faltantes.

## Cambios UX Wizard
Se anaden bloques opcionales para CEE y presupuesto en el paso de datos. Los datos detectados muestran fuente y confianza; el usuario decide si aplica datos CEE.

## Cambios PDF Premium
Se anaden secciones de fuentes de datos, CEE importado y presupuesto analizado, con disclaimers de prediagnostico orientativo.

## Trazabilidad y Confianza
Cada campo relevante puede expresarse como `ExtractedField` con fuente, confianza y revision requerida. No se guarda texto bruto completo en los modelos premium, solo hash y campos extraidos.

## Riesgos Legales
EnergyScan no sustituye CEE oficial, visita tecnica, medicion profesional ni presupuesto vinculante. Los calculos de impacto son heuristicas conservadoras.

## Plan de Tests
Unitarios para parser CEE, parser presupuesto, impacto presupuesto y prioridad de campos. Integracion API ligera donde sea viable sin OCR real pesado ni PDFs externos.

## QA Manual
Flujo manual sin documentos, CEE parcial, presupuesto sin CEE y generacion PDF.
