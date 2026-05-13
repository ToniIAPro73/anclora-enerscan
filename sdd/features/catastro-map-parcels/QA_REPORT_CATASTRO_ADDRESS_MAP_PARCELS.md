# QA Report — Catastro Address Map Parcels

## Resumen

Se corrige el flujo del paso 2 del wizard para que la búsqueda por provincia, municipio, calle/vía y número use contratos oficiales de Catastro, alimente el mapa con resultados reales y permita seleccionar features catastrales aproximadas cuando hay coordenadas. El mapa pasa a MapLibre GL JS con base vectorial clara sin claves propietarias.

## Causa raíz

- El mapa no conservaba los resultados Catastro como estado de features seleccionables.
- La capa WMS catastral existía, pero se mostraba como overlay tenue, bloqueaba la experiencia de zoom/pan esperada y no aportaba features propias de selección.
- La resolución por coordenadas usaba parámetros no oficiales (`CoorX`, `CoorY`) y no enriquecía resultados de dirección con centroide de parcela.
- La búsqueda por dirección no exigía número en UI, aunque el servicio de datos por localización lo requiere para una finca concreta.
- La búsqueda por dirección no reutilizaba los códigos de provincia, municipio y vía que devuelve el autocompletado, por lo que direcciones como `MIQUEL ROSSELLO I ALEMANY 48` dependían sólo del nombre textual.

## Correcciones aplicadas

- Se separan servicios oficiales REST:
  - `COVCCallejero.svc/rest` para provincias, municipios, vías, `Consulta_DNPLOC` y `Consulta_DNPRC`.
  - `COVCCoordenadas.svc/rest` para `Consulta_RCCOOR` y `Consulta_CPMRC`.
- `getStreets` mantiene `TipoVia` y `NombreVia` separados.
- `getStreets` conserva `cp`, `cm` y `cv` para resolver después por códigos.
- `resolveByAddress` usa `TipoVia`, `NomVia`, `Numero`, `Bloque`, `Escalera`, `Planta` y `Puerta`.
- `resolveByAddress` intenta primero `COVCCallejeroCodigos.svc/rest/Consulta_DNPLOC_Codigos` cuando hay códigos de vía y hace fallback a `Consulta_DNPLOC` textual si Catastro no devuelve finca.
- `resolveByCoordinates` usa `Coordenada_X`, `Coordenada_Y` y `SRS=EPSG:4326`.
- Los resultados por dirección se enriquecen con coordenadas de parcela cuando hay referencia catastral.
- El mapa recibe `CadastralMapFeature[]`, renderiza bounds/markers seleccionables y soporta pan, scroll wheel zoom, zoom +/- fijo, cambio de capa y pitch 3D orientativo con MapLibre.
- La búsqueda por dirección requiere número para evitar búsquedas incompletas.

## Estrategia de fincas/parcela

No se inventan polígonos. La implementación usa:

- Base vectorial clara compatible con MapLibre y sin token propietario.
- Features fallback basadas en centroide/bounds aproximado cuando Catastro devuelve coordenadas.
- Click sobre el mapa sigue resolviendo contra Catastro por coordenadas.

La geometría real de parcela queda pendiente si se incorpora un endpoint WFS/GeoJSON fiable.

## QA manual

Caso objetivo:

- Provincia: `ILLES BALEARS`
- Municipio: `PALMA`
- Calle/vía: `MIQUEL ROSSELLO I ALEMANY`
- Tipo vía: `CL`
- Número: `48`

Limitación actual: Catastro devuelve `403 Forbidden` con `Peticion denegada. Ha superado el limite de peticiones por hora` desde la IP de desarrollo, por lo que no se pudo validar manualmente el caso real en vivo en esta sesión.

## Validación automática

- `npm test -- --runInBand tests/catastro-autocomplete.test.ts tests/catastro-client-endpoints.test.ts`: PASS.
- `npm test -- --runInBand`: PASS (`22` suites, `90` tests).
- `npm run lint`: PASS.
- `npm run build`: PASS.
- Verificación Playwright local del paso 2: canvas MapLibre renderizado, controles `+`, `-`, capa y `3D` visibles.

## Riesgos pendientes

- La disponibilidad de Catastro/WMS depende de límites externos y disponibilidad del servicio.
- La selección visual exacta de geometría de finca requiere geometría real; el fallback actual usa centroide/bounds aproximado.
- El caso real debe revalidarse manualmente cuando Catastro levante el límite horario de la IP.
