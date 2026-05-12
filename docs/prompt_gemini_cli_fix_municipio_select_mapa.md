# Prompt para Gemini CLI — Fix selector de municipio y actualización del mapa en EnergyScan

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

En el paso 2 del wizard, `Datos de la vivienda`, el flujo Catastro ya permite seleccionar provincia y muestra el mapa de la provincia correctamente. Sin embargo, hay un bug claro en el selector de municipio:

1. Al seleccionar una provincia, por ejemplo `ILLES BALEARS`, el selector de municipio muestra correctamente los municipios disponibles.
2. Cuando el usuario selecciona un municipio, por ejemplo `PALMA`, el valor **no se queda fijado en el campo**.
3. El campo vuelve a mostrar `Selecciona municipio`.
4. Como el estado real del municipio no queda actualizado, el mapa tampoco puede centrarse en el municipio seleccionado.

En la captura actual se observa:

```txt
Provincia: ILLES BALEARS
Municipio: Selecciona municipio
Mapa: centrado en Illes Balears
```

El comportamiento esperado es:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Mapa: centrado en Palma
```

---

## Objetivo

Corregir end-to-end el bug del selector de municipio para que:

1. Al seleccionar un municipio, el valor quede guardado en el estado del formulario.
2. El municipio seleccionado quede visible en el campo.
3. El mapa se actualice inmediatamente al municipio seleccionado.
4. La selección de municipio desbloquee correctamente los siguientes campos: calle/vía, número, búsqueda por dirección, etc.
5. No se rompa la selección de provincia ni la búsqueda Catastro ya funcional.

---

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b fix/catastro-municipality-select-map-sync
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial

## Comandos iniciales

Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find app components lib src tests -maxdepth 5 -type f 2>/dev/null | sort | sed 's#^./##' | head -400
```

## Localiza

- Componente del paso 2 del wizard.
- Componente del buscador Catastro.
- Selector de provincia.
- Selector de municipio.
- Estado del formulario Catastro.
- Hook o función que carga municipios tras seleccionar provincia.
- Handler `onChange` / `onValueChange` del municipio.
- Función que resuelve el viewport del mapa.
- Componente del mapa y su controller de `setView` / `fitBounds`.
- Tests existentes de Catastro, wizard y mapa.

## Diagnóstico obligatorio

Antes de tocar código, identifica la causa raíz exacta:

1. Si el selector de municipio está recibiendo un `value` incorrecto.
2. Si el municipio seleccionado usa `name`, `label`, `id`, `code` o `displayName` y se guarda otro campo distinto.
3. Si el `value` del select espera un código pero el handler guarda el nombre.
4. Si al seleccionar municipio se dispara algún efecto que resetea el estado.
5. Si el cambio de provincia resetea municipio después de seleccionarlo por un `useEffect` mal dependenciado.
6. Si el listado de municipios se recarga y pierde la opción seleccionada por comparación de objetos en vez de string estable.
7. Si el mapa no recibe el municipio aunque el estado sí cambie.
8. Si el resolver del viewport no da prioridad al municipio sobre la provincia.

No apliques parches visuales sin corregir el estado real.

---

# Fase 1 — Corregir el selector de municipio

## Objetivo

Hacer que el municipio seleccionado quede fijado correctamente.

## Comportamiento esperado

Al seleccionar:

```txt
PALMA
```

El select debe mostrar:

```txt
PALMA
```

Y el estado interno debe contener un identificador estable del municipio.

## Reglas técnicas

1. Usa un `value` estable para cada municipio.
2. Evita usar objetos completos como value si el componente select espera string.
3. Decide un contrato claro:

```ts
type MunicipalityOption = {
  id: string;
  code?: string;
  name: string;
  displayName: string;
  provinceCode?: string;
};
```

4. Si Catastro requiere código interno de municipio, guarda tanto el `code` como el `name`.
5. Si el select solo puede guardar un string, usa `id` o `code` como value y deriva el objeto seleccionado desde la lista.
6. No guardes `displayName` si luego el backend necesita `code`.
7. No resetees municipio salvo cuando cambie realmente la provincia.

## Estado recomendado

Adapta a la arquitectura real:

```ts
type CatastroAddressState = {
  provinceCode?: string;
  provinceName?: string;
  municipalityCode?: string;
  municipalityName?: string;
  streetName?: string;
  streetCode?: string;
  streetTypeCode?: string;
  number?: string;
};
```

## Cuidado con efectos

Si existe algo parecido a:

```ts
useEffect(() => {
  setMunicipality("");
}, [municipalities]);
```

revisarlo. Ese patrón puede borrar la selección cada vez que se recarga la lista.

El reset correcto debería ocurrir cuando cambia la provincia, no cuando cambia cualquier dependencia secundaria.

---

# Fase 2 — Sincronizar municipio con el mapa

## Objetivo

Cuando el municipio quede seleccionado, el mapa debe centrarse en él.

## Comportamiento esperado

1. Usuario selecciona `ILLES BALEARS`.
2. Mapa se centra en Illes Balears.
3. Usuario selecciona `PALMA`.
4. El select muestra `PALMA`.
5. El resolver de mapa recibe `municipalityName = PALMA` y `provinceName = ILLES BALEARS`.
6. El mapa se centra en Palma con zoom municipal.

## Requisitos técnicos

1. El resolver del mapa debe priorizar municipio sobre provincia.
2. Si usa diccionario local, debe tener entrada para `PALMA` dentro de `ILLES BALEARS`.
3. Si usa geocoding, debe lanzar resolución cuando cambie municipio.
4. Si usa Leaflet, el mapa debe aplicar el nuevo centro aunque ya esté montado.
5. No basta con cambiar props iniciales. Debe existir controller interno con `setView`, `flyTo` o `fitBounds`.

## Ejemplo de prioridad

```ts
if (selectedMatch?.lat && selectedMatch?.lng) return propertyViewport;
if (addressCoordinates) return addressViewport;
if (municipalityName) return municipalityViewport;
if (provinceName) return provinceViewport;
return defaultViewport;
```

## Centros mínimos

Debe funcionar al menos con:

```ts
ILLES BALEARS -> lat: 39.6, lng: 2.95, zoom: 8
PALMA + ILLES BALEARS -> lat: 39.5696, lng: 2.6502, zoom: 13
```

---

# Fase 3 — Limpiar dependencias entre provincia, municipio y vía

## Objetivo

Evitar estados inconsistentes al cambiar provincia o municipio.

## Reglas

### Al cambiar provincia

Debe resetear:

- municipio,
- calle/vía,
- número,
- dirección interna,
- resultados Catastro,
- match seleccionado,
- geometrías/parcela.

Debe mantener:

- modo de búsqueda actual si procede,
- mapa centrado en nueva provincia.

### Al cambiar municipio

Debe resetear:

- calle/vía,
- número,
- dirección interna,
- resultados Catastro,
- match seleccionado,
- geometrías/parcela.

Debe mantener:

- provincia,
- municipio seleccionado,
- mapa centrado en municipio.

### Al cambiar vía

Debe resetear:

- número si el producto lo decide,
- resultados anteriores,
- match seleccionado.

No debe resetear:

- provincia,
- municipio.

---

# Fase 4 — Validación visual y UX

## Objetivo

El usuario debe percibir claramente que el municipio quedó seleccionado.

## Requisitos

1. El campo municipio debe mostrar el valor elegido.
2. Si la lista de municipios está cargando, mostrar estado loading.
3. Si no hay municipios, mostrar mensaje claro.
4. Si hay error al cargar municipios, permitir reintento.
5. Tras seleccionar municipio, habilitar input de calle/vía.
6. Si el municipio no está seleccionado, el campo calle/vía puede estar deshabilitado o mostrar instrucción clara.

## No hacer

- No simular el valor con placeholder.
- No dejar el select controlado a medias.
- No duplicar estado entre componente padre e hijo sin sincronización.
- No resetear municipio al renderizar.

---

# Fase 5 — Tests

## Tests mínimos

Añade o actualiza tests para:

1. Seleccionar provincia carga municipios.
2. Seleccionar `PALMA` deja `PALMA` visible en el select.
3. El estado interno contiene municipio seleccionado.
4. Cambiar provincia resetea municipio.
5. Cambiar municipio no resetea provincia.
6. Cambiar municipio resetea calle/resultados previos.
7. El resolver de mapa recibe municipio.
8. Municipio tiene prioridad sobre provincia en el viewport.
9. Seleccionar `PALMA` centra el mapa en Palma.
10. El mapa no permanece solo en vista de `ILLES BALEARS` tras seleccionar `PALMA`.

## Mocking

- Mockea endpoints de municipios.
- Mockea componente de mapa si hace falta.
- No dependas de tiles externos.
- No dependas de Catastro real en tests automáticos.

---

# Fase 6 — QA manual obligatoria

## Arranque

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000/wizard
```

## Caso 1 — Selección de municipio

1. Ir al paso 2.
2. Seleccionar modo dirección.
3. Seleccionar provincia:

```txt
ILLES BALEARS
```

4. Abrir selector de municipio.
5. Seleccionar:

```txt
PALMA
```

Resultado esperado:

- El campo municipio muestra `PALMA`.
- No vuelve a `Selecciona municipio`.
- La calle/vía queda disponible.
- El mapa se centra en Palma.

## Caso 2 — Cambio de municipio

1. Con `ILLES BALEARS` seleccionada, elegir otro municipio.
2. Verificar que el nuevo municipio queda fijado.
3. Verificar que el mapa cambia a ese municipio.
4. Volver a elegir `PALMA`.

Resultado esperado:

- Todos los cambios quedan reflejados.
- No hay resets inesperados.

## Caso 3 — Cambio de provincia

1. Seleccionar `ILLES BALEARS` y `PALMA`.
2. Cambiar provincia a otra disponible.

Resultado esperado:

- Municipio se resetea correctamente.
- Calle/vía se limpia.
- Resultados previos se limpian.
- Mapa se centra en la nueva provincia.

## Caso 4 — Dirección completa

Después de seleccionar `PALMA`, introducir:

```txt
MIQUEL ROSSELLO I ALEMANY (CL)
48
```

Resultado esperado:

- La búsqueda por dirección sigue funcionando.
- El mapa puede avanzar de municipio a dirección/parcela si hay coordenadas/geometría.

---

# Fase 7 — Comandos de verificación

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

# Fase 8 — Informe final

Crea o actualiza un informe en:

```txt
sdd/features/catastro-integration/QA_REPORT_MUNICIPALITY_SELECT_MAP_SYNC.md
```

Debe incluir:

1. Resumen del bug.
2. Causa raíz exacta.
3. Cambios realizados en el selector de municipio.
4. Cambios realizados en estado del formulario.
5. Cambios realizados en sincronización con mapa.
6. Tests añadidos/actualizados.
7. QA manual.
8. Limitaciones pendientes.
9. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "fix: sync municipality selection with cadastral map"
```

## PR sugerida

Título:

```txt
fix: sync municipality selection with cadastral map
```

Cuerpo:

```md
## Summary
- Fixes municipality select state so selected municipality remains visible.
- Prevents municipality from being reset after selection.
- Syncs selected municipality with the map viewport resolver.
- Keeps province/municipality/street reset logic predictable.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual QA: select Illes Balears
- [ ] manual QA: select Palma
- [ ] manual QA: map centers on Palma
- [ ] manual QA: change province resets municipality
- [ ] manual QA: address search still works
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No romper la selección de provincia.
- No romper la búsqueda por dirección.
- No romper la búsqueda por referencia catastral.
- No solucionar solo el placeholder; hay que corregir el estado real.
- No dejar el select de municipio controlado a medias.
- No resetear municipio salvo cuando cambie provincia.
- No dejar el mapa dependiente solo de provincia.
- No hardcodear textos visibles nuevos.
- No romper i18n.
- No romper SSR/build del mapa.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. El usuario selecciona `ILLES BALEARS` y se cargan municipios.
2. El usuario selecciona `PALMA` y `PALMA` queda visible en el campo.
3. El estado interno conserva `PALMA`.
4. El mapa se centra en Palma tras seleccionar el municipio.
5. El campo calle/vía queda operativo tras seleccionar municipio.
6. Cambiar provincia resetea municipio de forma correcta.
7. Cambiar municipio no resetea provincia.
8. La búsqueda por dirección sigue funcionando.
9. Tests relevantes pasan.
10. Build pasa.
11. Hay informe QA final.
12. Hay commit y PR listos para revisión.

---

# Nota final

Este bug no es visual: es de estado. Si el municipio no queda fijado, todo lo que depende de él falla en cadena: calle, número, resolución de dirección, viewport del mapa y búsqueda Catastro. Prioriza corregir el contrato de estado antes de tocar estilos.

