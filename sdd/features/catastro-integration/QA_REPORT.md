# Catastro Integration QA Report

## 1. Resumen

Se ha consolidado la integración existente de Catastro en EnergyScan sin sustituir la arquitectura del repo. El wizard ya contenía búsqueda por referencia, dirección y selección en mapa, persistencia en `CadastralRecord`, PDF con trazabilidad y tests. Esta iteración endurece el contrato API, añade el endpoint reverse exigido y elimina copy/unidades hardcodeadas en el flujo de mapa/listados.

## 2. Decisiones de arquitectura

- Se mantiene `src/lib/catastro` como capa backend de abstracción.
- Se mantiene `Assessment` + `CadastralRecord` en Prisma; no se migra el esquema ni se introduce Neon por esta feature.
- Se validan entradas con Zod en `CatastroResolveRequestSchema`.
- Se mantiene la consulta a Catastro solo desde backend.
- Se respetan los helpers existentes de preferencias para `m²` / `sq ft`.

## 3. Paquete externo

No se encontró `anclora-energyscan-catastro-package.zip` en el repo. La feature ya estaba parcialmente integrada en el código actual, por lo que se auditó y adaptó lo existente.

## 4. Servicios oficiales usados

- Callejero y datos catastrales no protegidos: `OVCWcfCallejero/COVCCallejero.svc/rest`.
- Callejero por códigos: `OVCWcfCallejero/COVCCallejeroCodigos.svc/rest`.
- Coordenadas / referencia catastral: `OVCSWLocalizacionRC/OVCCoordenadas.asmx`.

Referencias oficiales revisadas:

- https://www.catastro.hacienda.gob.es/ayuda/servicios_web.htm
- https://www.catastro.hacienda.gob.es/ws/esquemas.htm
- https://www.catastro.hacienda.gob.es/ws/Webservices_Libres.pdf

## 5. Endpoints implementados o reforzados

- `POST /api/catastro/resolve`: validación Zod para `rc`, `address` y `coords`, errores controlados y sin filtrado de mensajes internos.
- `GET /api/catastro/reverse?lat=...&lng=...`: nuevo endpoint estable para resolución por coordenadas.
- Se mantienen `provinces`, `municipalities`, `streets`, `geocode` y `wms`.

## 6. Cambios de Prisma

No hubo cambios de schema ni migración nueva. El modelo `CadastralRecord` ya existía y persistía referencia, dirección, superficies, coordenadas, uso, participación y trazabilidad.

## 7. UI e i18n

- El listado de coincidencias usa `formatArea()` en lugar de `m²` hardcodeado.
- El panel de confirmación de finca desde mapa usa i18n en español, inglés y alemán.
- El mapa usa copy localizado para loading, selección, controles y fallback label.
- El usuario puede seguir manualmente si Catastro falla.

## 8. Tests ejecutados

- `npm test -- --runTestsByPath tests/catastro-validation.test.ts tests/catastro-client-endpoints.test.ts tests/catastro-normalizer.test.ts tests/catastro-autofill.test.ts tests/catastro-autocomplete.test.ts tests/catastro-map-features.test.ts`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm test`: 33 suites, 138 tests passed.
- `npm run build`: passed.

## 9. QA navegador

- `npm run dev` levantado en `http://localhost:3000`.
- `curl -I http://localhost:3000/wizard`: 200 OK.
- Chrome headless renderizó `/wizard` correctamente en viewport móvil.
- Validación API manual:
  - `/api/catastro/reverse?lat=91&lng=2.65` devuelve `INVALID_COORDINATES`.
  - `/api/catastro/resolve` con RC inválida devuelve `INVALID_INPUT`.

Limitación: no se completó una interacción manual completa del wizard en navegador real dentro de esta sesión; queda recomendada una pasada humana para confirmar selección de coincidencia, navegación por mapa y screenshots finales.

## 10. Riesgos pendientes

- El parser XML sigue siendo ligero y basado en extracción por etiquetas; está cubierto por tests de estructuras usadas, pero un XML oficial nuevo puede requerir ajuste.
- Catastro puede rate-limit o devolver respuestas variables por provincia/municipio.
- Las rutas `provinces`, `municipalities` y `streets` usan fallback local si Catastro falla.
- La automatización e2e completa no existe porque el repo no tiene Playwright instalado.

## 11. Variables de entorno

No se añaden variables obligatorias para Catastro. Vercel Blob y OCR siguen sujetos a la configuración existente del producto.

## 12. Limitaciones conocidas

- No se añadió geometría WKT ni raw response a Prisma porque el modelo actual no lo contempla y no era necesario para cerrar el contrato actual.
- La búsqueda por mapa se mantiene como ayuda opcional; la vía principal sigue siendo referencia catastral/dirección y fallback manual.
