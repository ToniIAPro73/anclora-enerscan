# EnerScan v0.3 UI Improvements — Spec v1

## Objetivo
Elevar la experiencia de EnerScan sin rehacer el producto: diseño más claro, selector premium de tema e idioma, captura energética ampliada, soporte de adjuntos y valoración demo.

## Alcance incluido
- Selector de tema `Luna/Sol/Ordenador` con persistencia en `localStorage` y cookie.
- Selector de idioma `ES/EN/DE` con diccionarios locales en `public/locales/*/common.json` y textos principales en UI/PDF.
- Nuevos campos: orientación, tipo de cubierta, ventilación, presupuesto y horizonte temporal.
- Carga local de imágenes, PDF, DOCX y Markdown con límite de 8 MB por archivo y 6 archivos por assessment.
- Modelo Prisma `AssessmentAttachment` relacionado con `Assessment`.
- Resultado enriquecido con datos capturados, documentación aportada, demo identificada y PDF actualizado.
- Endpoint demo para crear un assessment ficticio sin datos personales.

## Fuera de alcance
- Análisis automático del contenido de adjuntos.
- Certificación energética oficial.
- Pago real o simulación de pasarela no marcada como demo.
- Proveedores reales no existentes en base de datos.

## Contratos preservados
- Flujo Landing -> Wizard -> API -> Results -> PDF.
- Scoring v2, simulador y motor normativo siguen siendo el núcleo.
- La API conserva compatibilidad JSON para clientes legacy y añade multipart para adjuntos.
- El aviso legal orientativo permanece visible en UI y PDF.

## Contratos modificados
- `PropertyDataV2` añade campos opcionales.
- `ScoreResultV2` mantiene shape y enriquece explicación/penalizaciones.
- `Assessment` añade columnas opcionales y relación con `AssessmentAttachment`.

## Riesgos
- El almacenamiento local de adjuntos no es persistente en entornos serverless sin volumen.
- La i18n es ligera y no cubre todavía cada cadena secundaria de datos técnicos.
- Los archivos se descargan/eliminan desde API, pero no hay autenticación por usuario.
