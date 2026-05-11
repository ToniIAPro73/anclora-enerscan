# Prompt maestro para Gemini CLI — EnergyScan: mapa contextual por ubicación, layout full viewport y superficies Catastro en wizard

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

La integración actual del paso 2 del wizard ya incluye:

- Búsqueda Catastro por referencia catastral.
- Búsqueda Catastro por dirección.
- Autocomplete de vía/calle.
- Resultados con viviendas diferenciadas.
- Detalle de inmueble.
- Botón `Confirmar y usar estos datos`.
- Un mapa interactivo junto al bloque de datos.

El problema actual es que el mapa no responde al contexto de búsqueda. Aunque el usuario está buscando una vivienda en `ILLES BALEARS / PALMA`, el mapa sigue mostrando Madrid o una ubicación por defecto incorrecta.

Además, el layout del paso 2 no aprovecha bien el viewport. Este paso debería ocupar toda la altura visible y dar más protagonismo al mapa que al formulario, porque la ubicación visual es parte central de la validación.

También hay un problema con los datos mostrados y aplicados desde Catastro: actualmente se ve año de construcción y porcentaje de participación, pero no aparece correctamente la superficie. Deben mostrarse tanto la superficie construida como la superficie útil/habitable si están disponibles. La superficie útil debe ser la que se cargue en el campo correspondiente del wizard.

---

## Objetivo general

Implementar tres mejoras end-to-end:

1. **Mapa contextual y reactivo**: el mapa debe desplazarse automáticamente según provincia, municipio, dirección, coincidencia Catastro y vivienda confirmada.
2. **Layout full viewport para el paso 2 del wizard**: ocupar mejor el alto disponible y dar más espacio al mapa que a los datos.
3. **Gestión correcta de superficies Catastro**: mostrar superficie construida y superficie útil/habitable cuando existan, y rellenar el campo del wizard con la superficie útil si está disponible.

---

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b fix/wizard-map-contextual-layout-surfaces
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial obligatoria

## Objetivo

Entender el estado real de la implementación antes de modificar código.

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

- Paso 2 del wizard.
- Componente del mapa.
- Estado de provincia, municipio, vía, número, dirección interna y vivienda seleccionada.
- Función que actualiza coordenadas o centro del mapa.
- Cliente/normalizador Catastro.
- Tipos de `CadastralMatch` o equivalentes.
- Función de confirmación Catastro → wizard.
- Campos actuales de superficie en wizard.
- Helpers de formato de superficie y unidades.
- Sistema i18n ES/EN/DE.
- Tests actuales de wizard, Catastro y mapa.

## Diagnóstico obligatorio

Antes de implementar, identifica:

1. Por qué el mapa se queda centrado en Madrid.
2. Si hay coordenadas hardcodeadas como fallback.
3. Si el mapa solo actualiza con `lat/lng` pero no con provincia/municipio/dirección.
4. Si Catastro devuelve coordenadas para provincia, municipio, parcela o inmueble.
5. Si existe geocodificación interna o hay que añadirla.
6. Qué superficies devuelve realmente Catastro en el caso usado.
7. Si el normalizador descarta superficie construida o útil.
8. Qué campo del wizard representa superficie útil/habitable.

No hagas cambios a ciegas.

---

# Fase 1 — Mapa contextual por jerarquía de ubicación

## Objetivo

El mapa debe cambiar automáticamente según el progreso de búsqueda del usuario.

## Comportamiento esperado

El mapa debe seguir esta jerarquía:

```txt
1. Coordenadas exactas de vivienda confirmada
2. Coordenadas de coincidencia seleccionada en detalle
3. Coordenadas de parcela/dirección resuelta por Catastro
4. Dirección completa: provincia + municipio + vía + número
5. Municipio seleccionado
6. Provincia seleccionada
7. Centro por defecto de España o Mallorca, según producto
```

## Casos concretos

### Al seleccionar provincia

Si el usuario selecciona:

```txt
ILLES BALEARS
```

El mapa debe centrarse en Illes Balears, no en Madrid.

### Al seleccionar municipio

Si el usuario selecciona:

```txt
PALMA
```

El mapa debe hacer zoom automáticamente a Palma.

### Al seleccionar vía y número

Si el usuario selecciona:

```txt
MIQUEL ROSSELLO I ALEMANY (CL)
Número 48
```

El mapa debe intentar acercarse a esa dirección si hay coordenadas disponibles o si puede resolverlas de forma segura.

### Al seleccionar una coincidencia Catastro

Debe centrar el mapa en la parcela o vivienda si hay coordenadas.

### Al confirmar vivienda

Debe quedar marcador claro en la ubicación confirmada.

---

# Fase 2 — Resolver coordenadas de provincia, municipio y dirección

## Objetivo

Crear una capa estable para obtener coordenadas aproximadas cuando Catastro no devuelve coordenadas exactas.

## Regla técnica

No hardcodees todo en el componente del mapa. Crea helpers o servicios reutilizables.

## Opción mínima aceptable para MVP

Crear un diccionario local pequeño para ubicaciones principales usadas por la app, empezando por:

```ts
const REGION_CENTERS = {
  "ILLES BALEARS": { lat: 39.6, lng: 2.95, zoom: 8 },
  "PALMA": { lat: 39.5696, lng: 2.6502, zoom: 13 },
  "MADRID": { lat: 40.4168, lng: -3.7038, zoom: 12 }
};
```

Pero debe diseñarse para ampliarse, no como parche disperso.

## Opción preferente si ya existe servicio/API

Si el repo ya tiene endpoint de geocoding, úsalo.

## Opción con API externa

Solo usar geocoding externo si:

- no requiere clave privada expuesta,
- se llama desde backend si procede,
- no rompe privacidad,
- se maneja timeout y errores,
- no bloquea el wizard.

No introducir dependencias o servicios externos innecesarios.

## Helper sugerido

```ts
type MapViewportTarget = {
  lat: number;
  lng: number;
  zoom: number;
  source: "property" | "parcel" | "address" | "municipality" | "province" | "default";
};

function resolveMapViewportTarget(input: {
  province?: string;
  municipality?: string;
  street?: string;
  number?: string;
  selectedMatch?: CadastralMatch | null;
  confirmedMatch?: CadastralMatch | null;
  manualPosition?: { lat: number; lng: number } | null;
}): MapViewportTarget;
```

Adapta nombres a la arquitectura real.

---

# Fase 3 — Actualización reactiva del mapa

## Objetivo

El mapa debe reaccionar a cambios en el formulario sin quedarse en una ubicación antigua.

## Requisitos

1. Cuando cambia provincia, actualizar centro y zoom.
2. Cuando cambia municipio, actualizar centro y zoom.
3. Cuando cambia vía/número y existe resolución de dirección, actualizar centro.
4. Cuando se selecciona coincidencia, actualizar marcador.
5. Cuando se confirma vivienda, fijar marcador.
6. Si el usuario mueve manualmente el marcador, no sobrescribirlo sin una nueva confirmación explícita.
7. Evitar loops de render.
8. Evitar llamadas excesivas a geocoding.
9. Mantener debounce si hay resolución por dirección.

## Nota sobre Leaflet / React Leaflet

Si el mapa usa Leaflet, recuerda que cambiar props no siempre cambia automáticamente el viewport. Puede hacer falta un componente interno tipo:

```tsx
function MapViewportController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center[0], center[1], zoom]);

  return null;
}
```

Implementa el patrón equivalente si la librería de mapas es otra.

---

# Fase 4 — Layout full viewport del paso 2

## Objetivo

Rediseñar solo el layout del paso 2 para aprovechar todo el viewport y dar más espacio al mapa.

## Requisitos de layout

El paso 2 debe ocupar, aproximadamente:

```txt
altura visible disponible = viewport - header
```

En desktop:

```txt
┌────────────────────────────────────────────────────────────┐
│ Paso 2 / Datos de la vivienda                              │
├──────────────────────┬─────────────────────────────────────┤
│ Formulario / Catastro │ Mapa interactivo                    │
│ 35-40% ancho          │ 60-65% ancho                         │
│ scroll interno si hace│ altura completa disponible           │
│ falta                 │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

En mobile:

```txt
Paso 2
Formulario / Catastro
Mapa interactivo debajo o bloque plegable
```

## Reglas

1. No rediseñar todos los pasos del wizard.
2. Aplicar el layout especial solo al paso de datos de vivienda si es viable.
3. El mapa debe tener más ancho que la columna de datos en desktop.
4. La columna de datos puede tener scroll interno.
5. El mapa debe tener altura estable, no una miniatura estrecha.
6. No debe aparecer scroll horizontal.
7. El header debe permanecer usable.
8. En pantallas pequeñas, priorizar completar datos antes que mapa.

## Proporción recomendada

- Formulario: `minmax(360px, 0.38fr)`
- Mapa: `minmax(480px, 0.62fr)`

O equivalente con Tailwind/CSS actual.

## Cuidado visual

Mantén:

- estética oscura premium,
- bordes redondeados,
- contraste correcto,
- jerarquía visual existente,
- botones actuales,
- mobile-first.

No hagas un rediseño radical.

---

# Fase 5 — Superficie construida y superficie útil/habitable

## Objetivo

Mostrar y aplicar correctamente las superficies recuperadas desde Catastro.

## Problema actual

En el detalle se muestra:

```txt
Superficie construida: ---
Año construcción: 2003
% coeficiente de participación: 14 %
```

Pero en Catastro para la vivienda concreta debería aparecer una superficie, por ejemplo:

```txt
Residencial | 67 m² | 14,57% | 2003
```

Además, el campo del wizard `SUPERFICIE ÚTIL (M²)` sigue mostrando un valor manual como `80`, en lugar de usar la superficie útil/habitable disponible desde Catastro o una regla clara de fallback.

## Reglas de datos

1. Si Catastro devuelve `usableAreaM2` o equivalente fiable, usarlo para el campo del wizard de superficie útil.
2. Si Catastro solo devuelve `builtAreaM2`, mostrarlo como superficie construida.
3. No etiquetar `builtAreaM2` como superficie útil sin indicar criterio.
4. Si el producto decide usar superficie construida como aproximación MVP para superficie útil, debe aparecer aviso visible:

```txt
Superficie precargada desde Catastro. Puede corresponder a superficie construida; revísala antes de continuar.
```

5. Si existen ambas:

```txt
Superficie construida: 67 m²
Superficie útil: XX m²
```

6. El campo del wizard debe rellenarse con la superficie útil si existe.
7. Si no existe superficie útil, aplicar la regla de producto documentada.

## Tipo objetivo orientativo

Adapta el tipo real existente:

```ts
type CadastralMatch = {
  cadastralReference: string;
  parcelReference?: string;
  builtAreaM2?: number;
  usableAreaM2?: number;
  livingAreaM2?: number;
  areaSource?: "catastro_built" | "catastro_usable" | "catastro_living" | "manual";
  participationCoefficient?: number;
  constructionYear?: number;
};
```

## Parsing obligatorio

Para una línea como:

```txt
Residencial | 67 m² | 14,57% | 2003
```

Extraer:

```ts
propertyUse: "Residencial"
builtAreaM2: 67
participationCoefficient: 14.57
constructionYear: 2003
```

Si el origen solo tiene esa línea, probablemente `67 m²` es construida o superficie catastral, no necesariamente útil. Documentar.

---

# Fase 6 — Autofill correcto del campo superficie útil

## Objetivo

Actualizar el campo del wizard con la superficie adecuada al confirmar una vivienda.

## Comportamiento esperado

Al confirmar una vivienda Catastro:

1. `AÑO DE CONSTRUCCIÓN` se rellena con `constructionYear`.
2. `SUPERFICIE ÚTIL (M²)` se rellena con:
   - `usableAreaM2`, si existe;
   - si no existe, `livingAreaM2`, si existe;
   - si no existe, según decisión documentada, opcionalmente `builtAreaM2` con aviso.
3. Mostrar aviso de revisión si se ha usado superficie construida como fallback.
4. La superficie interna queda guardada en m².
5. En inglés se muestra como `sq ft` solo en presentación.

## Función centralizada sugerida

```ts
function getWizardAreaFromCadastralMatch(match: CadastralMatch): {
  areaM2?: number;
  source?: "usable" | "living" | "built_fallback";
  requiresReview: boolean;
} {
  // implementar reglas
}
```

Añade tests unitarios.

---

# Fase 7 — Detalle del inmueble mejorado

## Objetivo

Mostrar al usuario toda la información relevante antes de confirmar.

## Debe mostrar

- Referencia catastral completa.
- Referencia de parcela.
- Dirección.
- Planta.
- Puerta.
- Uso.
- Superficie construida.
- Superficie útil/habitable si existe.
- Superficie que se aplicará al wizard.
- Año de construcción.
- Coeficiente de participación.
- Municipio.
- Provincia.
- Fuente.
- Fecha de consulta.

## Ejemplo ES

```txt
Superficie construida: 67 m²
Superficie útil aplicada: 67 m² · Revisar
Año de construcción: 2003
Coeficiente de participación: 14,57 %
```

## Ejemplo EN

```txt
Built area: 721 sq ft
Applied usable area: 721 sq ft · Review
Construction year: 2003
Participation coefficient: 14.57%
```

## Importante

No mostrar `---` si el dato sí está disponible en la respuesta normalizada.

---

# Fase 8 — i18n y unidades

## Objetivo

Mantener coherencia ES/EN/DE.

## Claves sugeridas

```ts
wizard.map.viewport.province
wizard.map.viewport.municipality
wizard.map.viewport.address
wizard.map.viewport.property
wizard.map.viewport.default
wizard.map.locationSource.province
wizard.map.locationSource.municipality
wizard.map.locationSource.address
wizard.map.locationSource.catastro
wizard.map.locationSource.manual
wizard.catastro.area.built
wizard.catastro.area.usable
wizard.catastro.area.living
wizard.catastro.area.applied
wizard.catastro.area.reviewRequired
wizard.catastro.area.builtFallbackNotice
wizard.catastro.area.notAvailable
wizard.catastro.area.sourceBuilt
wizard.catastro.area.sourceUsable
wizard.catastro.area.sourceManual
wizard.wizardLayout.mapPanelTitle
```

## Unidades

- Guardar internamente en m².
- ES: mostrar `m²`.
- EN: mostrar `sq ft`.
- DE: mostrar `m²`.
- Usar `formatArea` o helper centralizado.
- Porcentajes formateados según locale.

---

# Fase 9 — Tests

## Tests mínimos backend/normalización

1. Extrae `builtAreaM2` de `67 m²`.
2. Extrae `participationCoefficient` de `14,57%` como `14.57`.
3. Extrae `constructionYear` como `2003`.
4. No pierde superficie al normalizar resultados por dirección.
5. Conserva RC completa.
6. `getWizardAreaFromCadastralMatch` usa `usableAreaM2` si existe.
7. `getWizardAreaFromCadastralMatch` usa fallback construido solo según regla documentada.

## Tests frontend/mapa

1. Al seleccionar provincia `ILLES BALEARS`, el mapa recibe centro de Illes Balears.
2. Al seleccionar municipio `PALMA`, el mapa recibe centro de Palma.
3. Al seleccionar/confirmar match con coordenadas, el mapa recibe esas coordenadas.
4. El mapa no queda centrado en Madrid si la provincia es Illes Balears.
5. El layout desktop del paso 2 renderiza columna de mapa y columna de datos.
6. Confirmar vivienda rellena año.
7. Confirmar vivienda rellena superficie según regla.
8. El detalle muestra superficie construida si existe.
9. En inglés la superficie se muestra en `sq ft`.
10. En español/alemán se muestra en `m²`.

## Mocking

No dependas de tiles externos ni de Catastro real en tests automáticos.

Mockea:

- cliente Catastro,
- componente de mapa si el entorno DOM lo requiere,
- viewport resolver.

---

# Fase 10 — QA manual obligatoria

## Arranque

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000/wizard
```

## Caso 1 — Provincia

Seleccionar:

```txt
Provincia: ILLES BALEARS
```

Resultado esperado:

- El mapa se centra en Illes Balears.
- No se queda en Madrid.

## Caso 2 — Municipio

Seleccionar:

```txt
Municipio: PALMA
```

Resultado esperado:

- El mapa se centra en Palma.
- El zoom aumenta respecto a provincia.

## Caso 3 — Dirección

Buscar:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
```

Resultado esperado:

- El mapa se aproxima a la zona de la dirección o parcela si hay coordenadas.
- Se muestran viviendas diferenciadas.

## Caso 4 — Vivienda concreta

Seleccionar:

```txt
6485534DD6768E0003QD
Planta 01
Puerta B
67 m²
2003
```

Resultado esperado:

- El detalle muestra superficie construida.
- El detalle muestra año 2003.
- El detalle muestra coeficiente de participación.
- El mapa se centra en la vivienda/parcela.

## Caso 5 — Confirmación y autofill

Pulsar:

```txt
Confirmar y usar estos datos
```

Resultado esperado:

- El campo `AÑO DE CONSTRUCCIÓN` se rellena con `2003`.
- El campo `SUPERFICIE ÚTIL` se rellena con la superficie útil si existe.
- Si se usa superficie construida como fallback, aparece aviso de revisión.
- La RC completa queda guardada.

## Caso 6 — Layout full viewport

En desktop:

- El paso 2 ocupa prácticamente todo el viewport disponible.
- El mapa ocupa más espacio que la columna de datos.
- La columna de datos permite scroll interno si hace falta.
- No hay scroll horizontal.

En mobile:

- El formulario sigue siendo usable.
- El mapa no bloquea el flujo.

## Caso 7 — Idiomas y unidades

Revisar:

```txt
ES · € · m²
EN · £ · sq ft
DE · € · m²
```

Resultado esperado:

- Nuevos textos traducidos.
- Superficie en `sq ft` en inglés.
- Superficie en `m²` en español y alemán.
- Porcentaje formateado según locale.

---

# Fase 11 — Comandos de verificación

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
npm test -- catastro
npm test -- wizard
npm test -- map
```

---

# Fase 12 — Informe final

Crea o actualiza un informe en:

```txt
sdd/features/catastro-integration/QA_REPORT_MAP_CONTEXTUAL_LAYOUT_SURFACES.md
```

Debe incluir:

1. Resumen de mejoras implementadas.
2. Causa raíz del mapa centrado en Madrid.
3. Estrategia de viewport contextual.
4. Centros usados para provincia/municipio o servicio usado para resolverlos.
5. Cambios de layout del paso 2.
6. Decisión sobre superficie útil vs construida.
7. Campos Catastro que se muestran.
8. Campos Catastro que se aplican al wizard.
9. Cambios i18n.
10. Tests añadidos/actualizados.
11. Resultado QA manual.
12. Limitaciones pendientes.
13. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "fix: improve wizard map viewport layout and cadastral areas"
```

## PR sugerida

Título:

```txt
fix: improve wizard map viewport, layout and cadastral areas
```

Cuerpo:

```md
## Summary
- Makes the wizard map react to province, municipality, address and selected cadastral match.
- Prevents the map from staying centered on Madrid when another location is selected.
- Updates step 2 layout to better use the viewport and prioritize the map.
- Parses and displays cadastral area data.
- Applies usable/living area to the wizard when available, with built-area fallback notice if needed.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual QA: province viewport
- [ ] manual QA: municipality viewport
- [ ] manual QA: address viewport
- [ ] manual QA: selected property viewport
- [ ] manual QA: area display
- [ ] manual QA: wizard autofill
- [ ] manual QA: desktop layout
- [ ] manual QA: mobile layout
- [ ] manual QA: ES/EN/DE units

## Notes
Document the final built-area vs usable-area decision here.
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No romper la búsqueda Catastro actual.
- No romper el wizard manual.
- No dejar Madrid como centro fijo si el usuario selecciona otra provincia/municipio.
- No llamar a servicios externos desde cliente si no corresponde.
- No introducir claves privadas de mapas.
- No convertir superficies internamente a `sq ft`.
- No etiquetar superficie construida como útil sin aviso o decisión documentada.
- No mostrar `---` cuando el dato sí existe.
- No hardcodear textos visibles.
- No mezclar idiomas.
- No rediseñar todos los pasos del wizard.
- No romper SSR/build con el mapa.
- No hacer que tests dependan de tiles externos.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. Al seleccionar `ILLES BALEARS`, el mapa se centra en Illes Balears.
2. Al seleccionar `PALMA`, el mapa se centra en Palma.
3. Al resolver dirección o seleccionar inmueble, el mapa se acerca a la dirección/parcela si hay coordenadas.
4. Madrid solo aparece si el usuario busca Madrid o si es fallback explícito y documentado.
5. El paso 2 ocupa mejor el viewport.
6. En desktop el mapa tiene más espacio que la columna de datos.
7. En mobile el flujo sigue siendo usable.
8. El detalle del inmueble muestra superficie construida si Catastro la devuelve.
9. El campo de superficie útil del wizard se rellena con superficie útil si existe.
10. Si se usa superficie construida como fallback, aparece aviso de revisión.
11. Año de construcción se rellena correctamente.
12. RC completa se conserva.
13. i18n ES/EN/DE está cubierto.
14. Unidades `m²`/`sq ft` funcionan correctamente.
15. Tests relevantes pasan.
16. Build pasa.
17. Hay informe QA final.
18. Hay commit y PR listos para revisión.

---

# Nota final de producto

El paso 2 debe sentirse como una pantalla de validación visual de la vivienda, no como un formulario estrecho con un mapa decorativo. La ubicación debe acompañar al usuario desde provincia hasta vivienda exacta.

La superficie es crítica para el análisis energético. Si Catastro aporta superficie construida pero no útil, debe tratarse con transparencia: útil si existe, construida como fallback solo con aviso claro.

