# energyscan-partners-demo-assets-mobile-qa - Spec v1

## Objetivo

Evolucionar Anclora EnergyScan hacia una base comercial mínima para partners, proveedores y leads, enriqueciendo la demo premium con assets documentales y manteniendo el carácter orientativo/no oficial.

## Alcance

- Ampliar Prisma con `Partner`, `Provider` comercial enriquecido y `Lead` trazable.
- Crear endpoints públicos mínimos para proveedores y leads.
- Incorporar assets demo locales: 6 imágenes sintéticas y un supuesto CEE demo.
- Centralizar metadatos demo en una fuente única de verdad.
- Mostrar documentación aportada y proveedores recomendados en resultados.
- Enriquecer el PDF premium con anexo visual y resumen de CEE demo.
- Revisar mobile-first en landing, wizard, resultados, documentos, providers y lead form.

## Fuera de alcance

- Backoffice completo.
- Autenticación.
- CRM avanzado.
- Facturación o comisiones reales.
- Certificación energética oficial.
- Uso de datos reales de empresas, técnicos, viviendas o personas.

## Modelos modificados

- `Assessment`: relación `leads Lead[]`.
- `Provider`: datos fiscales/contacto internos, categorías, zonas, certificaciones, estados, SLA, condiciones de comisión y partner opcional.
- `Partner`: nuevo modelo para colaboradores comerciales/técnicos.
- `Lead`: ciclo de vida, contacto, servicio, atribución, comisiones y consentimiento.

## Endpoints

- `GET /api/providers`: devuelve proveedores activos con datos públicos seguros y fallback demo.
- `POST /api/leads`: valida consentimiento/contacto, calcula atribución y crea solicitud trazable o fallback no persistente si la DB falla.

## Demo assets

- Carpeta: `public/demo-assets/property-demo/`.
- Imágenes: 2 exteriores y 4 interiores, sintéticas y ligeras.
- CEE demo: `cee-demo.pdf`, documento ficticio sin validez oficial.
- Fuente de verdad: `src/lib/demo-assets.ts`.

## PDF

- Cabecera con logo.
- Anexo de información de usuario.
- Resumen de documentación aportada.
- CEE demo referenciado con letra y aviso legal.
- Imágenes 2 por página con caption.
- Disclaimer de carácter demo/orientativo.

## Riesgos

- El fallback de lead no persiste si la DB cae; queda indicado en respuesta `fallback: true`.
- No hay deduplicación ni anti-spam de leads.
- El marketplace es una base inicial, no un ranking contractual.
