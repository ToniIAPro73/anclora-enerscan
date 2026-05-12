# Prompt maestro para Gemini CLI — EnergyScan: paso 2 full-width, mapa reactivo por municipio/dirección y fincas seleccionables

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

En el paso 2 del wizard, `Datos de la vivienda`, ya se ha implementado una vista en dos columnas:

- Columna izquierda: datos / buscador catastral.
- Columna derecha: mapa interactivo.

La decisión de usar dos columnas es correcta, pero la implementación actual tiene tres problemas importantes:

1. **No usa el ancho total del viewport**. El contenido queda centrado y estrecho, dejando mucho espacio vacío a ambos lados. Si se usara el ancho completo disponible, habría más espacio para el formulario y, sobre todo, para el mapa.

2. **El mapa solo se actualiza parcialmente**. Actualmente se actualiza al seleccionar provincia, pero no se actualiza correctamente al seleccionar municipio. También debería actualizarse al introducir calle/vía y número.

3. **El mapa no muestra fincas/parcela seleccionables** como referencia visual. En la herramienta de referencia adjunta, el mapa muestra geometrías o parcelas/fincas resaltadas y seleccionables. EnergyScan debería aproximarse a ese comportamiento usando datos disponibles de Catastro o una capa catastral compatible.

La referencia visual externa muestra un layout donde el formulario ocupa una franja lateral y el mapa ocupa la mayor parte del ancho disponible, con fincas/parcela visibles y seleccionables.

---

## Objetivo general

Implementar una mejora end-to-end del paso 2 del wizard para que:

1. Use realmente el ancho total del viewport.
2. Mantenga dos columnas en desktop, pero con más espacio útil.
3. Dé más protagonismo al mapa interactivo.
4. El mapa se actualice al cambiar provincia, municipio, calle/vía y número.
5. El mapa muestre fincas/parcela seleccionables cuando existan datos o capa disponible.
6. La selección en mapa pueda sincronizarse con la selección Catastro del formulario.
7. El flujo mobile siga siendo usable.

---

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b fix/wizard-full-width-reactive-cadastral-map
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial obligatoria

## Objetivo

Entender por qué el paso 2 no usa el viewport completo y cómo está funcionando ahora el mapa.

## Comandos iniciales

Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find app components lib prisma tests src -maxdepth 5 -type f 2>/dev/null | sort | sed 's#^./##' | head -500
```

## Localiza

- Componente del wizard.
- Componente específico del paso 2 `Datos de la vivienda`.
- Layout wrapper del wizard.
- Contenedores con `max-width`, `container`, `mx-auto`, `max-w-*`, `w-*` o equivalentes.
- Componente del mapa.
- Estado de provincia, municipio, calle/vía, número, referencia catastral y match seleccionado.
- Función actual que resuelve el viewport del mapa.
- Capa actual de tiles/mapa.
- Si existen geometrías, polígonos, parcelas o coordenadas devueltas por Catastro.
- Endpoints Catastro actuales.
- Tests actuales de mapa/wizard.

## Diagnóstico obligatorio

Antes de tocar código, identifica y documenta:

1. Qué contenedor limita actualmente el ancho del paso 2.
2. Si ese límite afecta a todos los pasos o solo al paso 2.
3. Por qué el mapa sí reacciona a provincia pero no a municipio.
4. Si el cambio de municipio actualiza estado pero no recalcula viewport.
5. Si el mapa necesita `setView`, `flyTo`, `fitBounds` o un controller interno para reaccionar.
6. Si calle y número disparan alguna resolución geográfica.
7. Si Catastro devuelve geometría/parcela o solo datos alfanuméricos.
8. Qué opción técnica es viable para mostrar fincas seleccionables.

No implementes a ciegas.

---

# Fase 1 — Layout full-width real para el paso 2

## Objetivo

Eliminar la restricción de ancho del paso 2 sin romper el resto del wizard.

## Problema actual

Aunque se usan dos columnas, el bloque completo está dentro de un contenedor demasiado estrecho. El resultado es:

```txt
[margen enorme] [formulario estrecho] [mapa estrecho] [margen enorme]
```

Debe cambiar a:

```txt
[ margen mínimo ] [ formulario ] [ mapa amplio ] [ margen mínimo ]
```

## Requisitos desktop

En pantallas grandes, el paso 2 debe usar casi todo el ancho disponible del viewport:

```txt
width: min(100%, viewport - padding lateral razonable)
```

Proporción recomendada:

```txt
Formulario: 32-38%
Mapa:      62-68%
```

Ejemplo conceptual:

```txt
┌──────────────────────────────────────────────────────────────────────┐
│ Paso 2 · Datos de la vivienda                                        │
├────────────────────────────┬─────────────────────────────────────────┤
│ Datos / Catastro            │ Mapa interactivo                        │
│ 360-520px aprox             │ resto del ancho disponible              │
│ scroll interno si hace falta│ altura amplia                           │
└────────────────────────────┴─────────────────────────────────────────┘
```

## Requisitos concretos

1. El layout especial debe aplicarse preferentemente solo al paso 2.
2. No rompas el layout de los demás pasos.
3. Evita `max-w-3xl`, `max-w-4xl`, `max-w-5xl` o similares en el wrapper del paso 2 si limitan el ancho.
4. Usa algo equivalente a:

```tsx
className="w-full max-w-none px-4 sm:px-6 lg:px-8"
```

O la convención real del repo.

5. En desktop, el mapa debe ocupar más ancho que la columna de datos.
6. La columna de datos puede tener scroll interno si hay muchos campos.
7. El mapa debe tener altura estable y útil, no una miniatura.
8. No debe aparecer scroll horizontal.
9. Mantén header y navegación del wizard usables.
10. Mantén estética premium actual.

## Requisitos mobile

En móvil:

```txt
[ Datos / Catastro ]
[ Mapa interactivo ]
```

- El mapa debe ir debajo o en bloque plegable.
- No debe impedir completar campos.
- No debe forzar ancho mayor que la pantalla.

---

# Fase 2 — Resolver mapa por municipio

## Objetivo

Corregir el problema actual: el mapa se actualiza al seleccionar provincia, pero no al seleccionar municipio.

## Comportamiento esperado

Al seleccionar:

```txt
Provincia: ILLES BALEARS
```

El mapa debe centrarse en Illes Balears.

Al seleccionar:

```txt
Municipio: PALMA
```

El mapa debe hacer zoom a Palma.

## Requisitos técnicos

1. Asegúrate de que el estado de municipio se propaga al resolver del viewport.
2. Asegúrate de que el resolver da prioridad a municipio sobre provincia.
3. Asegúrate de que el componente mapa aplica cambios de centro/zoom aunque ya esté montado.
4. Si usas Leaflet, implementa o corrige un controller similar:

```tsx
function MapViewportController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24], animate: true });
      return;
    }

    map.setView(center, zoom, { animate: true });
  }, [map, center[0], center[1], zoom, bounds]);

  return null;
}
```

5. Evita que el mapa se quede con el centro inicial.
6. Evita loops de actualización.

## Centros mínimos necesarios

Si no hay geocoding dinámico, añade un resolver local ampliable para al menos:

```ts
ILLES BALEARS -> centro aproximado de la comunidad/islas
PALMA -> centro aproximado de Palma
```

Ejemplo orientativo:

```ts
{
  province: "ILLES BALEARS",
  lat: 39.6,
  lng: 2.95,
  zoom: 8
}

{
  municipality: "PALMA",
  province: "ILLES BALEARS",
  lat: 39.5696,
  lng: 2.6502,
  zoom: 13
}
```

Debe diseñarse para poder añadir más municipios/provincias después.

---

# Fase 3 — Resolver mapa por calle/vía y número

## Objetivo

El mapa debe actualizarse al introducir una dirección concreta.

## Comportamiento esperado

Cuando el usuario tenga:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Calle/vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
```

El mapa debe intentar acercarse a la dirección o parcela.

## Estrategia recomendada

Usar esta jerarquía:

```txt
1. Coordenadas exactas devueltas por Catastro para la dirección o inmueble.
2. Bounds/geometría de parcela si Catastro la devuelve.
3. Coordenadas aproximadas de dirección mediante endpoint backend de geocoding/catastro.
4. Centro del municipio.
5. Centro de provincia.
6. Default.
```

## Endpoint sugerido si no existe

Crear o adaptar endpoint interno:

```txt
GET /api/catastro/geocode?province=...&municipality=...&street=...&number=...
```

O integrar esta resolución en el endpoint existente de búsqueda por dirección.

## Requisitos

- No llamar a servicios externos directamente desde cliente.
- Debounce razonable si se resuelve mientras escribe.
- No resolver dirección hasta que haya datos mínimos:
  - provincia,
  - municipio,
  - vía,
  - número.
- Cancelar/ignorar respuestas obsoletas.
- Si no se puede resolver dirección, mantener viewport de municipio.
- Mostrar un estado discreto si procede, no un error bloqueante.

---

# Fase 4 — Fincas/parcela seleccionables en el mapa

## Objetivo

Mostrar fincas, parcelas o geometrías seleccionables en el mapa cuando sea posible, como en la herramienta de referencia adjunta.

## Comportamiento objetivo

Cuando la app tenga datos de Catastro para una dirección/parcela:

1. El mapa debe mostrar la parcela o finca resaltada.
2. Si hay varias parcelas/fincas candidatas, deben mostrarse como geometrías seleccionables.
3. Al hacer click en una finca/parcela:
   - se selecciona visualmente,
   - se sincroniza con la lista de resultados si hay correspondencia,
   - se abre detalle o se marca como selección pendiente.
4. Al confirmar una vivienda desde la lista, el mapa debe resaltar su parcela.

## Opciones técnicas aceptables

### Opción A — Usar geometría Catastro si ya está disponible

Si el backend ya recibe geometría o bounds:

- Normalízala a GeoJSON.
- Pásala al componente de mapa.
- Renderízala como polígonos.
- Usa `fitBounds` para centrar.

### Opción B — Añadir obtención de geometría de parcela

Si Catastro permite obtener geometría por referencia catastral/parcela:

- Añade función backend para obtener geometría.
- No acoples la UI al servicio externo.
- Normaliza a GeoJSON.
- Cachea si procede.
- Maneja ausencia de geometría.

### Opción C — Fallback por bounding box o marcador

Si no se puede obtener geometría todavía:

- Mostrar marcador o bounding box aproximado.
- Documentar limitación.
- Dejar el contrato preparado para GeoJSON.

## Tipo sugerido

```ts
type CadastralMapFeature = {
  id: string;
  cadastralReference?: string;
  parcelReference?: string;
  label?: string;
  kind: "parcel" | "building" | "unit" | "address";
  geometry?: GeoJSON.Geometry;
  center?: { lat: number; lng: number };
  bounds?: [[number, number], [number, number]];
  selected?: boolean;
};
```

## Requisitos visuales

- La finca seleccionada debe verse claramente.
- Las fincas no seleccionadas deben ser visibles pero discretas.
- No uses colores que rompan el diseño premium.
- No dependas de estilos imposibles de mantener.
- El mapa debe seguir siendo legible en dark UI.

## Nota importante

No hace falta replicar exactamente la cartografía de la herramienta de referencia en esta iteración si técnicamente no está disponible. Pero sí debe quedar una implementación real o un fallback claro, no un mapa decorativo.

---

# Fase 5 — Sincronización mapa ↔ resultados Catastro

## Objetivo

La lista de resultados y el mapa deben hablar entre sí.

## Comportamiento esperado

1. Buscar por dirección devuelve viviendas y, si es posible, parcela/geometría.
2. El mapa muestra la parcela/finca correspondiente.
3. Al pasar o seleccionar una tarjeta de resultado, el mapa resalta la finca/parcela relacionada.
4. Al hacer click en la finca del mapa, la lista selecciona o destaca el resultado correspondiente.
5. Al confirmar, queda marcador/geometría fija.

## Estado sugerido

```ts
type MapSelectionState = {
  selectedFeatureId?: string;
  highlightedFeatureId?: string;
  confirmedFeatureId?: string;
};
```

Adapta nombres al estado real.

---

# Fase 6 — Capa visual del mapa

## Objetivo

Aproximar mejor la utilidad visual del mapa de referencia.

## Requisitos

1. Mostrar zoom controls.
2. Mantener marcador si hay coordenadas.
3. Mostrar polígonos si hay geometría.
4. Permitir selección manual si no hay datos.
5. Mostrar estado de fuente:
   - provincia,
   - municipio,
   - dirección,
   - Catastro,
   - manual.
6. Botón `Selecciona la ubicación manualmente` debe ser claro y funcional.
7. Si hay modo selección manual, el usuario debe entender que puede hacer click en el mapa.

## No hacer

- No dejar el mapa como imagen decorativa.
- No mostrar siempre el mismo centro.
- No ocultar el mapa en desktop.
- No bloquear el wizard si no hay geometría.

---

# Fase 7 — i18n

## Objetivo

Todo el nuevo copy debe estar en ES/EN/DE.

## Claves sugeridas

```ts
wizard.map.fullWidth.title
wizard.map.locationSource.province
wizard.map.locationSource.municipality
wizard.map.locationSource.address
wizard.map.locationSource.cadastreParcel
wizard.map.locationSource.manual
wizard.map.selectParcel
wizard.map.selectedParcel
wizard.map.noParcelGeometry
wizard.map.loadingAddress
wizard.map.addressNotResolved
wizard.map.manualMode
wizard.map.clickToSelect
wizard.map.fitToResults
wizard.map.fitToMunicipality
wizard.map.fitToProvince
```

No hardcodees textos visibles.

---

# Fase 8 — Tests

## Tests mínimos de layout

1. El paso 2 no está limitado por `max-w-*` estrecho.
2. El layout desktop renderiza dos columnas.
3. El mapa tiene más ancho que la columna de datos.
4. En mobile el layout se apila.

## Tests mínimos de viewport

1. Provincia `ILLES BALEARS` centra el mapa en Illes Balears.
2. Municipio `PALMA` tiene prioridad sobre provincia.
3. Dirección completa tiene prioridad sobre municipio si hay coordenadas/geometría.
4. Match seleccionado tiene prioridad sobre dirección.
5. El mapa no permanece en Madrid tras seleccionar Palma.

## Tests mínimos de fincas/geometría

1. Normalizador convierte geometría/bounds a `CadastralMapFeature`.
2. El mapa renderiza features si existen.
3. Click en feature llama a `onFeatureSelect`.
4. Feature seleccionada se marca como selected.
5. Si no hay geometría, se muestra fallback controlado.

## Mocking

- No dependas de tiles externos.
- Mockea Leaflet/React Leaflet si hace falta.
- Mockea Catastro/geocoding.

---

# Fase 9 — QA manual obligatoria

## Arranque

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000/wizard
```

## Caso 1 — Layout full-width

En desktop:

- El paso 2 usa casi todo el ancho del viewport.
- El mapa ocupa más espacio que el formulario.
- Hay márgenes laterales razonables, no enormes.
- No hay scroll horizontal.

## Caso 2 — Provincia

Seleccionar:

```txt
ILLES BALEARS
```

Resultado esperado:

- El mapa se centra en Illes Balears.

## Caso 3 — Municipio

Seleccionar:

```txt
PALMA
```

Resultado esperado:

- El mapa se centra en Palma.
- El zoom es mayor que a nivel provincia.
- No se queda en la vista anterior.

## Caso 4 — Calle y número

Introducir:

```txt
MIQUEL ROSSELLO I ALEMANY (CL)
48
```

Resultado esperado:

- El mapa intenta acercarse a la dirección/parcela.
- Si hay geometría, se muestra la finca/parcela.
- Si no hay geometría, se muestra marcador o fallback claro.

## Caso 5 — Finca seleccionable

Cuando aparezca parcela/finca en el mapa:

- se puede pulsar,
- se resalta,
- se sincroniza con los resultados Catastro si hay correspondencia.

## Caso 6 — Resultado Catastro confirmado

Seleccionar una vivienda y confirmar.

Resultado esperado:

- El mapa centra/resalta la parcela o ubicación confirmada.
- La selección queda visualmente clara.

## Caso 7 — Mobile

Revisar en viewport móvil:

- El formulario sigue siendo usable.
- El mapa aparece debajo o en bloque manejable.
- No hay scroll horizontal.

## Caso 8 — Idiomas

Revisar:

```txt
ES · € · m²
EN · £ · sq ft
DE · € · m²
```

Resultado esperado:

- Copy nuevo traducido.
- Estados del mapa traducidos.

---

# Fase 10 — Comandos de verificación

Ejecuta los scripts reales disponibles en `package.json`.

Intenta:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si alguno no existe, no lo inventes. Documenta el equivalente real usado.

Ejecuta tests específicos si existen:

```bash
npm test -- wizard
npm test -- map
npm test -- catastro
```

---

# Fase 11 — Informe final

Crea o actualiza un informe en:

```txt
sdd/features/catastro-integration/QA_REPORT_FULL_WIDTH_REACTIVE_CADASTRAL_MAP.md
```

Debe incluir:

1. Resumen del problema.
2. Causa raíz del ancho limitado.
3. Cambios de layout aplicados.
4. Causa raíz de que municipio no actualizase el mapa.
5. Estrategia para resolver provincia/municipio/dirección.
6. Estrategia para fincas/parcela seleccionables.
7. Qué datos de Catastro se usan para geometría o fallback.
8. Cambios i18n.
9. Tests añadidos/actualizados.
10. QA manual.
11. Limitaciones pendientes.
12. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "fix: expand wizard map layout and make cadastral map reactive"
```

## PR sugerida

Título:

```txt
fix: expand wizard map layout and make cadastral map reactive
```

Cuerpo:

```md
## Summary
- Expands wizard step 2 to use the available viewport width.
- Gives the interactive map more space than the form on desktop.
- Makes the map react to province, municipality, street and number changes.
- Adds support for selectable cadastral parcel/features when available.
- Keeps mobile layout usable and preserves manual fallback.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual QA: full-width desktop layout
- [ ] manual QA: mobile layout
- [ ] manual QA: province viewport
- [ ] manual QA: municipality viewport
- [ ] manual QA: street + number viewport
- [ ] manual QA: selectable parcels/features
- [ ] manual QA: ES/EN/DE

## Notes
Document here whether real cadastral geometries are available or whether the current implementation uses marker/bounds fallback.
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No romper el wizard manual.
- No romper la búsqueda Catastro existente.
- No aplicar full-width de forma destructiva a todos los pasos si solo el paso 2 lo necesita.
- No dejar `Madrid` como fallback activo cuando hay provincia/municipio seleccionados.
- No depender de tiles externos en tests.
- No llamar a APIs externas directamente desde cliente si no corresponde.
- No introducir claves privadas.
- No mostrar fincas falsas si no hay datos; usa fallback claro.
- No hardcodear textos visibles.
- No mezclar idiomas.
- No romper SSR/build con el mapa.
- No generar scroll horizontal.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. El paso 2 usa casi todo el ancho disponible del viewport en desktop.
2. El mapa ocupa más espacio que la columna de datos.
3. El layout mobile sigue siendo usable.
4. Seleccionar provincia actualiza el mapa.
5. Seleccionar municipio actualiza el mapa.
6. Introducir calle y número intenta actualizar el mapa a la dirección/parcela.
7. El mapa no se queda en Madrid cuando la búsqueda es en Illes Balears/Palma.
8. Si hay geometría de finca/parcela, se muestra en el mapa.
9. Si hay finca/parcela en el mapa, se puede seleccionar o al menos resaltar.
10. La selección en mapa se sincroniza con los resultados Catastro cuando sea posible.
11. Si no hay geometría, existe fallback visual claro.
12. Todo el nuevo copy está traducido a ES/EN/DE.
13. Tests relevantes pasan.
14. Build pasa.
15. Hay informe QA final.
16. Hay commit y PR listos para revisión.

---

# Nota final de producto

La pantalla del paso 2 debe parecer una herramienta de validación de inmueble, no un formulario estrecho con un mapa auxiliar. El mapa debe ocupar espacio real, reaccionar a cada nivel de precisión introducido por el usuario y, cuando sea posible, permitir seleccionar visualmente la finca/parcela vinculada a Catastro.

