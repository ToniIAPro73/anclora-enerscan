# QA Report — Catastro Address Map Parcels

## Resumen

Se corrige el flujo del paso 2 del wizard para que la búsqueda por provincia, municipio, calle/vía y número use contratos oficiales de Catastro, alimente el mapa con resultados reales y permita seleccionar features catastrales aproximadas cuando hay coordenadas.

## Causa raíz

- El mapa no conservaba los resultados Catastro como estado de features seleccionables.
- La capa WMS catastral existía, pero se mostraba como overlay tenue y sin features propias de selección.
- La resolución por coordenadas usaba parámetros no oficiales (`CoorX`, `CoorY`) y no enriquecía resultados de dirección con centroide de parcela.
- La búsqueda por dirección no exigía número en UI, aunque el servicio de datos por localización lo requiere para una finca concreta.

## Correcciones aplicadas

- Se separan servicios oficiales REST:
  - `COVCCallejero.svc/rest` para provincias, municipios, vías, `Consulta_DNPLOC` y `Consulta_DNPRC`.
  - `COVCCoordenadas.svc/rest` para `Consulta_RCCOOR` y `Consulta_CPMRC`.
- `getStreets` mantiene `TipoVia` y `NombreVia` separados.
- `resolveByAddress` usa `TipoVia`, `NomVia`, `Numero`, `Bloque`, `Escalera`, `Planta` y `Puerta`.
- `resolveByCoordinates` usa `Coordenada_X`, `Coordenada_Y` y `SRS=EPSG:4326`.
- Los resultados por dirección se enriquecen con coordenadas de parcela cuando hay referencia catastral.
- El mapa recibe `CadastralMapFeature[]`, renderiza bounds/markers seleccionables y mantiene la capa WMS catastral visible.
- La búsqueda por dirección requiere número para evitar búsquedas incompletas.

## Estrategia de fincas/parcela

No se inventan polígonos. La implementación usa:

- Capa WMS pública de Catastro como referencia visual de parcelas.
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

- `npm test -- --runInBand tests/catastro-autocomplete.test.ts tests/catastro-client-endpoints.test.ts tests/catastro-normalizer.test.ts tests/catastro-map-features.test.ts`: PASS.
- `npm test -- --runInBand`: PASS (`22` suites, `89` tests).
- `npm run lint`: PASS.
- `npm run build`: PASS.

## Riesgos pendientes

- La disponibilidad de Catastro/WMS depende de límites externos y disponibilidad del servicio.
- La selección visual exacta de geometría de finca requiere geometría real; el fallback actual usa centroide/bounds aproximado.
- El caso real debe revalidarse manualmente cuando Catastro levante el límite horario de la IP.
