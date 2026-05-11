# Prompt maestro para Gemini CLI — EnergyScan: autocompletado de campos desde Catastro y mapa interactivo en el wizard

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

La integración con Catastro ya ha avanzado:

1. La búsqueda por referencia catastral funciona.
2. La búsqueda por dirección funciona.
3. El autocompletado de vías/calles funciona.
4. Al buscar por calle y número pueden aparecer varias viviendas en una misma parcela o edificio.
5. Ya se ha pedido una mejora para distinguir viviendas mediante dirección interna: bloque, escalera, planta y puerta.

Ahora hay dos nuevas necesidades funcionales:

### Necesidad 1 — Autorrelleno del wizard desde Catastro

Cuando el usuario obtiene información desde Catastro, especialmente usando búsqueda por dirección y seleccionando/confirmando una vivienda concreta, los datos disponibles deben cargarse automáticamente en los campos del wizard.

Ejemplos:

- Superficie habitable / superficie útil / superficie construida, según el dato disponible y el campo real del wizard.
- Año de construcción.
- Código postal si está disponible.
- Dirección normalizada.
- Referencia catastral completa.
- Planta, puerta, bloque o escalera si están disponibles.
- Tipo de inmueble o uso si puede mapearse con seguridad.

### Necesidad 2 — Mapa interactivo dentro del wizard

Añadir al wizard un mapa interactivo similar al mostrado en la herramienta oficial/sectorial adjunta:

- Mapa visible junto al formulario en desktop.
- Mapa integrado de forma usable en mobile.
- Capacidad de posicionar o visualizar la ubicación de la vivienda.
- Posibilidad de usar coordenadas del Catastro si están disponibles.
- Posibilidad de que el usuario ajuste o guarde una posición si el flujo lo permite.

La referencia visual muestra un layout con formulario a la izquierda y mapa a la derecha. No hay que copiar su diseño literalmente, pero sí tomar la idea funcional:

```txt
Formulario de datos de vivienda + búsqueda Catastro + mapa interactivo de ubicación
```

---

## Objetivo general

Implementar end-to-end estas dos features:

1. **Autofill inteligente del wizard** a partir de datos confirmados desde Catastro.
2. **Mapa interactivo** en el paso de datos de vivienda del wizard, integrado con búsqueda Catastro y selección manual de ubicación.

El resultado debe mejorar la experiencia sin romper el flujo actual ni bloquear la introducción manual.

---

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b feat/catastro-autofill-interactive-map
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial obligatoria

## Objetivo

Entender el estado real del repo antes de implementar.

## Comandos iniciales

Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find app components lib prisma tests src -maxdepth 5 -type f 2>/dev/null | sort | sed 's#^./##' | head -500
```

## Localiza como mínimo

- Componente principal del wizard.
- Paso de datos de vivienda.
- Estado del formulario del wizard.
- Campos actuales: superficie, año, código postal, tipo de inmueble, dirección, etc.
- Función que confirma una coincidencia Catastro.
- Tipo de dato actual para coincidencias Catastro.
- Normalizador de respuesta Catastro.
- Persistencia de datos de assessment/análisis.
- Sistema i18n actual.
- Helpers de unidades: `formatArea`, `formatNumber`, etc.
- Dependencias de mapas ya instaladas, si existen.
- Uso actual de coordenadas, si existe.
- Tests actuales de wizard y Catastro.

## Diagnóstico obligatorio antes de tocar código

Identifica y documenta internamente:

1. Qué datos reales devuelve ahora Catastro en el flujo por dirección.
2. Qué datos se pierden en normalización, si ocurre.
3. Qué campos del wizard pueden rellenarse de forma segura.
4. Qué campos del wizard no deben rellenarse automáticamente por ambigüedad.
5. Si existe ya soporte para lat/lng o geometría.
6. Si el repo ya tiene una librería de mapas.
7. Si el build actual permite usar dependencias client-only de mapas sin romper SSR.

No implementes a ciegas.

---

# Fase 1 — Contrato de autofill desde Catastro

## Objetivo

Definir exactamente qué se puede rellenar y bajo qué condiciones.

## Regla principal

Los datos de Catastro no deben sobrescribir silenciosamente datos manuales importantes sin confirmación.

Como mínimo:

- Si el usuario confirma una coincidencia Catastro, se pueden rellenar los campos relacionados con ubicación/inmueble.
- Si un campo ya tenía valor introducido manualmente, intenta respetar el valor manual o informa visualmente del cambio.
- Si el repo no distingue campos modificados manualmente, aplica una regla simple: la confirmación explícita de Catastro permite sobrescribir los campos relacionados.

## Campos objetivo para autofill

Mapea datos Catastro a campos del wizard de forma segura.

Tabla orientativa:

| Dato Catastro | Campo wizard | Regla |
|---|---|---|
| `cadastralReference` completa | referencia catastral | siempre si existe |
| `parcelReference` | referencia parcela | guardar si existe |
| `address` / `normalizedAddress` | dirección | siempre si existe |
| `postalCode` | código postal | solo si Catastro lo devuelve fiable |
| `constructionYear` | año de construcción | siempre si existe |
| `builtAreaM2` | superficie | solo si el campo acepta superficie construida o si producto decide usarla como aproximación |
| `usableAreaM2` | superficie útil/habitable | preferente si existe |
| `floor` | planta | si existe |
| `door` | puerta | si existe |
| `block` | bloque | si existe |
| `staircase` | escalera | si existe |
| `propertyUse` | tipo inmueble | mapear solo si hay equivalencia clara |
| `lat/lng` | ubicación mapa | siempre si existe |
| `geometry` | geometría/parcela | mostrar si la librería lo permite |

## Punto delicado: superficie habitable vs construida

Catastro suele devolver superficie construida, no necesariamente superficie útil o habitable.

Por tanto:

1. No etiquetes superficie construida como superficie habitable si no hay certeza.
2. Si el wizard tiene un campo llamado `superficie útil` o `superficie habitable`, decide una de estas opciones:

### Opción A — Conservadora

No rellenar automáticamente la superficie útil con la construida. Mostrar sugerencia:

```txt
Catastro informa 67 m² construidos. Revísalo antes de usarlo como superficie útil.
```

Y ofrecer acción:

```txt
Usar este valor
```

### Opción B — MVP práctica

Rellenar el campo de superficie con el dato de Catastro y mostrar nota:

```txt
Superficie precargada desde Catastro. Puede corresponder a superficie construida; revísala antes de continuar.
```

Elige la opción que encaje mejor con el producto actual, pero documenta la decisión en el QA report.

---

# Fase 2 — Implementar función centralizada de autofill

## Objetivo

Evitar lógica dispersa en componentes.

## Acción

Crear o adaptar una función centralizada, por ejemplo:

```ts
type WizardPropertyDraft = {
  propertyType?: string;
  constructionYear?: number | string;
  areaM2?: number;
  postalCode?: string;
  address?: string;
  cadastralReference?: string;
  parcelReference?: string;
  internalBlock?: string;
  internalStaircase?: string;
  internalFloor?: string;
  internalDoor?: string;
  lat?: number;
  lng?: number;
};

function mapCadastralMatchToWizardFields(match: CadastralMatch): Partial<WizardPropertyDraft> {
  // implementar con reglas claras
}
```

Adapta nombres a la arquitectura real.

## Requisitos

- No duplicar mapping en varios componentes.
- Añadir tests unitarios del mapping.
- Mantener canónica la superficie en `m²` internamente.
- No convertir a `sq ft` al guardar estado interno.
- No perder la referencia catastral completa.
- No perder planta/puerta.
- Guardar lat/lng si existen.

---

# Fase 3 — Confirmación Catastro → rellenar wizard

## Objetivo

Modificar el flujo de confirmación de coincidencia para que rellene realmente los campos del wizard.

## Comportamiento esperado

Cuando el usuario pulsa:

```txt
Confirmar y usar estos datos
```

La aplicación debe:

1. Guardar la vivienda Catastro seleccionada.
2. Rellenar los campos del wizard con los datos disponibles.
3. Mostrar un estado visual de éxito.
4. Permitir al usuario editar manualmente los campos después.
5. Actualizar el mapa si hay coordenadas.
6. Mantener el flujo de navegación del wizard sin saltos bruscos.

## Campos que deberían verse actualizados si hay datos

- Año de construcción.
- Superficie.
- Código postal.
- Tipo de inmueble si hay mapeo fiable.
- Dirección normalizada o resumen Catastro.
- Dirección interna si se ha añadido al wizard.

## Mensaje de confirmación sugerido

ES:

```txt
Datos de Catastro aplicados. Revísalos antes de continuar.
```

EN:

```txt
Cadastre data applied. Please review it before continuing.
```

DE:

```txt
Katasterdaten wurden übernommen. Bitte prüfe sie, bevor du fortfährst.
```

---

# Fase 4 — Añadir mapa interactivo al wizard

## Objetivo

Integrar un mapa interactivo en el paso de datos de vivienda.

## Requisitos funcionales

El mapa debe permitir:

1. Mostrar España/Mallorca o la ubicación por defecto.
2. Mostrar marcador si hay coordenadas de Catastro.
3. Permitir al usuario mover/seleccionar una ubicación manualmente si no hay coordenadas.
4. Guardar la posición seleccionada en el estado del wizard.
5. Actualizarse cuando se confirma una coincidencia Catastro con lat/lng.
6. No bloquear el wizard si el mapa no puede cargar.

## Layout recomendado

### Desktop

Usar layout en dos columnas:

```txt
[ Formulario / Catastro ] [ Mapa interactivo ]
```

El mapa debe tener altura suficiente, por ejemplo 420-560px, adaptada al diseño actual.

### Mobile

Usar layout vertical:

```txt
[ Formulario / Catastro ]
[ Mapa interactivo plegable o debajo ]
```

El mapa no debe dificultar completar el formulario.

## Librería de mapa

Antes de añadir una dependencia, comprueba `package.json`.

Opciones aceptables:

### Opción preferente si no hay librería instalada

Usar **Leaflet + React Leaflet**, por ser open-source y suficiente para este caso.

Dependencias típicas:

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Importante: React Leaflet suele requerir componente client-only y cuidado con SSR en Next.js.

### Alternativa

Si el repo ya usa otra librería de mapas, respétala.

## SSR / Next.js

El mapa debe cargarse solo en cliente.

Usa una estrategia segura, por ejemplo:

```ts
const PropertyMap = dynamic(() => import("@/components/.../PropertyMap"), {
  ssr: false,
});
```

O el patrón equivalente del repo.

## Tiles

Usa una fuente de tiles adecuada y gratuita para desarrollo.

No hardcodees claves privadas.

Si usas OpenStreetMap, respeta atribución:

```txt
© OpenStreetMap contributors
```

## Diseño visual

El mapa debe adaptarse al estilo premium oscuro de EnergyScan:

- contenedor con bordes redondeados,
- borde sutil,
- altura estable,
- loading skeleton si procede,
- fallback visual si no carga.

No intentes rediseñar todo el wizard.

---

# Fase 5 — Componente de mapa

## Objetivo

Crear un componente reutilizable y aislado.

## API sugerida

Adapta nombres a la arquitectura real.

```tsx
type PropertyMapProps = {
  lat?: number;
  lng?: number;
  addressLabel?: string;
  readOnly?: boolean;
  onPositionChange?: (position: { lat: number; lng: number }) => void;
};
```

## Comportamiento

- Si `lat/lng` existen: centrar mapa y mostrar marcador.
- Si no existen: mostrar centro por defecto.
- Centro por defecto recomendado para el producto:
  - Mallorca / Palma si el producto está enfocado ahí.
  - España si el análisis es nacional.
- Al hacer click en mapa: mover marcador y llamar `onPositionChange`, si no es readOnly.
- Mostrar un botón opcional:

```txt
Guardar posición actual
```

solo si encaja con el UX actual.

## i18n claves sugeridas

```ts
wizard.map.title
wizard.map.description
wizard.map.loading
wizard.map.noCoordinates
wizard.map.selectLocation
wizard.map.selectedLocation
wizard.map.saveCurrentPosition
wizard.map.positionFromCadastre
wizard.map.positionManual
wizard.map.error
```

---

# Fase 6 — Integración Catastro + mapa

## Objetivo

Conectar los datos de Catastro con el mapa.

## Comportamiento esperado

1. Si Catastro devuelve coordenadas:
   - el mapa se centra en ellas,
   - aparece marcador,
   - se muestra aviso:

```txt
Ubicación obtenida de Catastro.
```

2. Si Catastro no devuelve coordenadas:
   - el mapa muestra una posición por defecto,
   - se indica que el usuario puede marcar la ubicación manualmente.

3. Si el usuario marca una ubicación manualmente:
   - se guarda en estado del wizard,
   - se marca como `manual`,
   - no debe sobrescribirse sin confirmación si luego se aplica Catastro.

## Estado recomendado

```ts
type PropertyLocation = {
  lat?: number;
  lng?: number;
  source?: "catastro" | "manual" | "none";
};
```

---

# Fase 7 — Persistencia de coordenadas y datos Catastro

## Objetivo

Asegurar que los datos aplicados pueden persistirse junto al análisis si el flujo actual guarda el wizard.

## Acciones

1. Revisa `schema.prisma` actual.
2. Si ya existen campos de ubicación, úsalos.
3. Si no existen y el flujo requiere persistirlos, añade de forma mínima:

```prisma
latitude          Float?
longitude         Float?
locationSource    String?
cadastralReference String?
parcelReference    String?
catastroSourceJson Json?
```

Adapta nombres al modelo actual.

4. No introduzcas migraciones si el estado del wizard aún no persiste esos datos.
5. No cambies de SQLite/LibSQL/Postgres por esta feature.
6. Ejecuta migración solo si procede:

```bash
npx prisma migrate dev --name add_property_location_catastro_fields
npx prisma generate
```

---

# Fase 8 — i18n y unidades

## Objetivo

Mantener coherencia con ES/EN/DE y `m²`/`sq ft`.

## Requisitos

- Todo nuevo copy debe estar en español, inglés y alemán.
- No hardcodear textos visibles.
- El dato interno de superficie se mantiene en m².
- En ES se muestra m².
- En EN se muestra sq ft.
- En DE se muestra m².
- Usar helpers centralizados.
- Si se muestra una advertencia sobre superficie construida vs útil, traducirla.

## Claves sugeridas adicionales

```ts
wizard.catastro.autofill.applied
wizard.catastro.autofill.reviewNotice
wizard.catastro.autofill.builtAreaNotice
wizard.catastro.autofill.useBuiltArea
wizard.catastro.autofill.fieldsUpdated
wizard.catastro.autofill.noSafeFields
wizard.catastro.autofill.overwriteNotice
```

---

# Fase 9 — Tests

## Objetivo

Cubrir mapping, autofill y mapa sin depender del servicio real.

## Tests unitarios mínimos

### Mapping Catastro → wizard

1. RC completa se conserva.
2. Año de construcción se mapea.
3. Superficie en m² se conserva internamente.
4. Planta/puerta se conservan.
5. Dirección se mapea.
6. Lat/lng se mapean si existen.
7. Uso residencial se mapea a tipo de inmueble solo si hay equivalencia definida.

### Superficie

1. No se convierte a sq ft en estado interno.
2. En presentación EN se muestra sq ft.
3. En presentación ES/DE se muestra m².

## Tests frontend mínimos

1. Confirmar coincidencia Catastro rellena año.
2. Confirmar coincidencia Catastro rellena superficie según regla elegida.
3. Confirmar coincidencia Catastro guarda RC completa.
4. Confirmar coincidencia Catastro actualiza mapa si hay coordenadas.
5. Si no hay coordenadas, el mapa muestra estado sin coordenadas.
6. El usuario puede marcar posición manual en mapa.
7. El mapa no rompe el render SSR/build.

## Mocking del mapa

Si React Leaflet complica tests por entorno DOM, mockea el componente de mapa en tests de wizard y testea la lógica por separado.

No hagas que los tests dependan de tiles externos.

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

## Caso 1 — Autofill por dirección

Buscar:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
```

Seleccionar una vivienda concreta, por ejemplo:

```txt
6485534DD6768E0003QD
Planta 01
Puerta B
67 m²
2003
```

Confirmar.

Resultado esperado:

- El wizard rellena año `2003`.
- El wizard rellena superficie según la regla definida.
- El wizard guarda RC completa `6485534DD6768E0003QD`.
- El usuario puede editar los datos después.
- Aparece aviso de revisión de datos Catastro.

## Caso 2 — Autofill por RC

Buscar:

```txt
6485534DD6768E0003QD
```

Confirmar.

Resultado esperado:

- Se aplican los mismos campos posibles.
- No se guarda solo la referencia de parcela.

## Caso 3 — Mapa con coordenadas

Si Catastro devuelve coordenadas:

- el mapa se centra en la vivienda,
- aparece marcador,
- el estado indica que la ubicación viene de Catastro.

## Caso 4 — Mapa sin coordenadas

Si Catastro no devuelve coordenadas:

- el mapa muestra centro por defecto,
- permite seleccionar ubicación manual,
- guarda posición manual.

## Caso 5 — Responsive

Revisar:

- desktop,
- tablet si es posible,
- mobile viewport.

Resultado esperado:

- En desktop el mapa convive con formulario sin romper layout.
- En mobile no bloquea el flujo.
- No hay scroll horizontal.

## Caso 6 — Idiomas y unidades

Revisar:

```txt
ES · € · m²
EN · £ · sq ft
DE · € · m²
```

Resultado esperado:

- Nuevos textos traducidos.
- Superficie formateada según unidad activa.
- Avisos de Catastro traducidos.
- Textos del mapa traducidos.

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
sdd/features/catastro-integration/QA_REPORT_AUTOFILL_INTERACTIVE_MAP.md
```

Debe incluir:

1. Resumen de las features implementadas.
2. Decisión sobre superficie construida vs habitable/útil.
3. Campos Catastro que se mapean al wizard.
4. Campos que no se mapean y motivo.
5. Implementación del mapa.
6. Dependencias añadidas, si aplica.
7. Estrategia SSR/client-only del mapa.
8. Cambios i18n.
9. Cambios de persistencia, si aplica.
10. Tests añadidos/actualizados.
11. Resultado QA manual.
12. Limitaciones pendientes.
13. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "feat: autofill wizard from catastro and add property map"
```

## PR sugerida

Título:

```txt
feat: autofill wizard from Catastro and add property map
```

Cuerpo:

```md
## Summary
- Maps confirmed Catastro matches into wizard property fields.
- Adds review notice for Catastro-derived values.
- Adds an interactive property map to the wizard.
- Supports Catastro coordinates and manual map positioning.
- Preserves i18n and area unit formatting.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual QA: autofill by address
- [ ] manual QA: autofill by cadastral reference
- [ ] manual QA: map with Catastro coordinates
- [ ] manual QA: map with manual coordinates
- [ ] manual QA: responsive layout
- [ ] manual QA: ES/EN/DE

## Notes
Document here the decision made for built area vs usable/habitable area.
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No romper la búsqueda Catastro existente.
- No romper el wizard manual.
- No sobrescribir datos manuales sin una confirmación razonable.
- No llamar a servicios Catastro desde el frontend.
- No convertir superficies internamente a `sq ft`.
- No etiquetar superficie construida como habitable sin documentar la decisión.
- No hardcodear textos visibles.
- No mezclar idiomas.
- No introducir claves privadas de mapas.
- No usar una dependencia de mapas que rompa SSR/build.
- No rediseñar toda la aplicación.
- No bloquear el flujo si el mapa no carga.
- No hacer que tests dependan de tiles externos.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. Confirmar una vivienda Catastro rellena automáticamente campos compatibles del wizard.
2. La RC completa se conserva.
3. Año, superficie, dirección e información interna se aplican si están disponibles.
4. La superficie se gestiona con criterio claro: construida vs útil/habitable.
5. El usuario puede editar manualmente después del autofill.
6. Existe aviso visual de revisión de datos obtenidos de Catastro.
7. El wizard incorpora mapa interactivo.
8. El mapa muestra coordenadas de Catastro si existen.
9. El usuario puede seleccionar posición manual si no hay coordenadas.
10. El layout funciona en desktop y mobile.
11. Todo el nuevo copy está en ES/EN/DE.
12. Las unidades `m²`/`sq ft` se respetan.
13. Tests relevantes pasan.
14. Build pasa.
15. Hay informe QA final.
16. Hay commit y PR listos para revisión.

---

# Nota de producto

Esta mejora debe reducir fricción en el alta del análisis. El usuario no debería tener que copiar manualmente datos que Catastro ya proporciona. Pero hay que evitar una falsa precisión: algunos datos, como superficie construida frente a útil/habitable, deben mostrarse con una advertencia o una decisión de producto clara.

El mapa debe ayudar a validar visualmente la ubicación, no convertirse en un bloqueo del flujo.

