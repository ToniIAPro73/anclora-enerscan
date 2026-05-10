# Price Catalog ETL Roadmap

## Objetivo

Preparar una ingesta controlada de partidas de precio para EnergyScan sin acoplar parsers pesados ni fuentes privadas al core de la app.

## Fuentes Permitidas

- BC3/FIEBDC exportados con licencia válida.
- CSV normalizados por Anclora.
- PDFs técnicos revisados manualmente.
- Bases autorizadas: BEDEC/ITeC, CYPE, PREOC/PREMETI, IVE, BCCA, Comunidad de Madrid, Extremadura u otras bases públicas/privadas con licencia compatible.
- Índices públicos de costes de construcción.

## Fuentes Secundarias o Descartadas

- Blogs sin fecha o metodología.
- Presupuestos aislados usados como verdad maestra.
- Scraping automático agresivo.
- APIs privadas sin contrato o credenciales explícitas.

## Pipeline

```txt
BC3/CSV/PDF -> staging -> parser -> normalizer -> price_sources/price_items -> measure_price_map -> estimate engine
```

## Licencia y Trazabilidad

Cada fuente debe registrar nombre, versión, ámbito geográfico, fecha de captura, licencia, validez temporal, fiabilidad y notas de uso. Ninguna fuente privada debe exponerse en UI más allá de una etiqueta agregada y permitida.

## Campos Obligatorios

- Código externo.
- Título.
- Unidad.
- Precio o rango.
- Moneda.
- Región.
- Fecha/versión.
- Confianza.
- Fuente.

## Actualización y Versionado

Cada ingesta crea una versión nueva de `price_sources`. Las partidas anteriores se desactivan solo tras validación. No se sobrescriben precios históricos sin dejar rastro.

## Rollback

El rollback consiste en desactivar la fuente importada y reactivar la versión anterior. Las estimaciones ya generadas conservan sus líneas persistidas.

## Futuro Parser TypeScript `bc3`

Si se implementa BC3 real, se evaluará un paquete TypeScript mantenido o un microservicio aislado. El parser no debe ejecutarse en requests de usuario.

## Riesgos de `bc3reader`

`bc3reader` no se integra en el core porque es antiguo, añade riesgo de mantenimiento y no encaja como dependencia crítica de runtime. Podría usarse como CLI aislado solo si una ingesta controlada lo justifica.
