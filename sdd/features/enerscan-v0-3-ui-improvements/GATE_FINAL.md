# GATE FINAL — EnerScan v0.3 UI Improvements

## Checks contractuales
- [x] Flujo Landing -> Wizard -> Assessment -> Resultado -> PDF preservado
- [x] Scoring v2, simulador y normativa respetados
- [x] API legacy JSON preservada
- [x] Multipart añadido para adjuntos
- [x] Aviso legal visible en UI y PDF

## Checks funcionales
- [x] Selector tema Luna/Sol/Ordenador persistente
- [x] Selector idioma ES/EN/DE persistente
- [x] Campos energéticos ampliados
- [x] Adjuntos validados, persistidos y descargables/eliminables
- [x] Valoración demo sin datos personales
- [x] PDF incluye documentación aportada

## Validación
- [x] npm run lint
- [x] npm test
- [x] npm run build
- [ ] Validación visual completa móvil/escritorio en 9 combinaciones tema/idioma

## Resultado
Estado: PASS técnico. La validación visual completa queda indicada como checklist manual porque no hay Playwright instalado/configurado en el proyecto.
