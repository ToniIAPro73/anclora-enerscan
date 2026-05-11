# Prompt maestro para Gemini CLI — Catastro: dirección interna y selección de vivienda exacta en Anclora EnergyScan

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

Ya existe una integración funcional del buscador catastral dentro del wizard. El estado actual es:

1. La búsqueda por **referencia catastral** funciona.
2. La búsqueda por **dirección** ya funciona.
3. El autocompletado de calles/vías ya permite seleccionar una vía del Catastro.
4. Al buscar por dirección con calle y número, EnergyScan devuelve varias coincidencias cuando en esa dirección hay división horizontal o varias viviendas.

Problema actual:

Cuando se busca por dirección, por ejemplo:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Calle/vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
```

EnergyScan devuelve 5 filas, pero todas muestran prácticamente la misma información:

```txt
6485534DD6768E
MIQUEL ROSSELLO I ALEMANY
```

Eso no permite saber qué fila corresponde a la vivienda exacta.

En la Sede Electrónica del Catastro, para esa misma dirección, la información aparece de forma más útil. Se ve una parcela catastral con varios inmuebles y cada vivienda tiene:

```txt
6485534DD6768E0001XA  CL MIQUEL ROSSELLO I ALEMANY 48 Pl:BJ
Residencial | 114 m² | 26,91% | 2003

6485534DD6768E0002MS  CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:A
Residencial | 78 m² | 18,21% | 2003

6485534DD6768E0003QD  CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
Residencial | 67 m² | 14,57% | 2003

6485534DD6768E0004WF  CL MIQUEL ROSSELLO I ALEMANY 48 Pl:02 Pt:A
Residencial | 75 m² | 17,36% | 2003

6485534DD6768E0005EG  CL MIQUEL ROSSELLO I ALEMANY 48 Pl:02 Pt:B
Residencial | 105 m² | 22,95% | 2003
```

La aplicación debe mostrar esta información, o toda la que sea posible obtener del Catastro, para que el usuario pueda seleccionar la vivienda exacta.

Además, en la búsqueda por dirección deben añadirse los campos de **dirección interna** que existen en Catastro:

- Bloque
- Escalera
- Planta
- Puerta

Estos campos deben permitir filtrar o precisar la búsqueda, pero sin bloquear al usuario si los deja vacíos.

---

## Objetivo

Implementar una mejora end-to-end en el buscador catastral para que EnergyScan pueda distinguir entre varias viviendas dentro de una misma dirección o parcela.

El flujo objetivo es:

```txt
seleccionar provincia → seleccionar municipio → seleccionar vía → introducir número → opcionalmente introducir bloque/escalera/planta/puerta → buscar → mostrar inmuebles diferenciados → abrir detalle → confirmar vivienda exacta → rellenar wizard
```

---

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b fix/catastro-internal-address-unit-selection
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial obligatoria

## Objetivo

Entender cómo está implementada actualmente la búsqueda por dirección y por referencia catastral.

## Comandos iniciales

Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find app components lib prisma tests src -maxdepth 5 -type f 2>/dev/null | sort | sed 's#^./##' | head -400
```

## Localiza

- Componente actual del buscador Catastro.
- Estado del formulario de dirección.
- Endpoint actual de resolución por dirección.
- Endpoint actual de resolución por referencia catastral.
- Cliente Catastro backend.
- Normalizadores de respuesta.
- Tipo actual de coincidencia, por ejemplo `CadastralMatch`.
- Vista/lista actual de resultados.
- Panel/detalle actual de inmueble.
- Función que confirma una coincidencia y rellena el wizard.
- Sistema i18n ES/EN/DE.
- Tests existentes de Catastro.

## Diagnóstico obligatorio

Antes de modificar código, identifica:

1. Por qué las 5 filas devueltas por dirección muestran solo la referencia de parcela o edificio.
2. Si el backend está descartando los últimos 7 caracteres de la RC completa.
3. Si el normalizador está perdiendo `Pl`, `Pt`, superficie, uso, porcentaje o año.
4. Si el endpoint usado para dirección devuelve ya los inmuebles completos pero la UI no los muestra.
5. Si hace falta una llamada adicional a Catastro para obtener la lista de bienes/inmuebles de una parcela.
6. Qué datos exactos devuelve Catastro para el caso `MIQUEL ROSSELLO I ALEMANY 48`.

No hagas cambios a ciegas.

---

# Fase 1 — Ampliar el modelo de datos normalizado

## Objetivo

Asegurar que cada coincidencia catastral representa una vivienda/unidad concreta cuando exista división horizontal.

## Tipo objetivo orientativo

Adapta el tipo existente, no dupliques innecesariamente.

```ts
type CadastralMatch = {
  id: string;

  cadastralReference: string;       // RC completa si está disponible: 20 caracteres
  parcelReference?: string;         // RC de parcela/edificio: primeros 14 caracteres si aplica

  address: string;
  normalizedAddress?: string;
  province?: string;
  municipality?: string;
  postalCode?: string;

  block?: string;                   // Bloque
  staircase?: string;               // Escalera
  floor?: string;                   // Planta / Pl
  door?: string;                    // Puerta / Pt

  propertyUse?: string;             // Residencial, comercial, etc.
  builtAreaM2?: number;             // Superficie construida o útil según fuente
  participationCoefficient?: number;// Porcentaje de participación, si Catastro lo devuelve
  constructionYear?: number;

  sourceSystem: "catastro";
  sourceMode: "rc" | "address" | "coords" | "parcel";
  retrievedAt?: string;
  confidence?: number;

  raw?: unknown;                    // Solo backend o persistencia controlada, no mostrar completo en UI
};
```

## Reglas

1. `cadastralReference` debe guardar la referencia completa del inmueble si existe.
2. `parcelReference` puede guardar la referencia de parcela/edificio.
3. No muestres solo la referencia de parcela si existen referencias completas de viviendas.
4. No pierdas la información de planta y puerta.
5. No uses nombres internos confusos como `rc` si ya hay un contrato más claro.
6. Mantén compatibilidad con la búsqueda por RC actual.

---

# Fase 2 — Añadir campos de dirección interna en UI

## Objetivo

Añadir los campos que existen en Catastro para precisar la vivienda.

## Campos nuevos

Dentro del modo de búsqueda por dirección, añade:

```txt
Dirección interna
- Bloque
- Escalera
- Planta
- Puerta
```

## Comportamiento esperado

- Deben ser opcionales.
- Deben aparecer después de `Número` o en una sección compacta similar a Catastro.
- Deben funcionar bien en desktop y mobile.
- Deben enviarse al backend si el usuario los rellena.
- Deben ayudar a filtrar las coincidencias devueltas.
- Si no se rellenan, la app debe mostrar todas las viviendas encontradas en esa dirección.

## UI recomendada

En desktop:

```txt
Dirección interna
[ Bloque ] [ Escalera ] [ Planta ] [ Puerta ]
```

En mobile:

```txt
Dirección interna
[ Bloque ]
[ Escalera ]
[ Planta ]
[ Puerta ]
```

## i18n

Añade claves para ES/EN/DE:

```ts
wizard.catastro.internalAddress.title
wizard.catastro.internalAddress.block
wizard.catastro.internalAddress.staircase
wizard.catastro.internalAddress.floor
wizard.catastro.internalAddress.door
wizard.catastro.internalAddress.help
```

Ejemplo ES:

```txt
Dirección interna
Bloque
Escalera
Planta
Puerta
Opcional. Úsalo si quieres localizar una vivienda concreta dentro del edificio.
```

Ejemplo EN:

```txt
Internal address
Block
Staircase
Floor
Door
Optional. Use it to locate a specific dwelling within the building.
```

Ejemplo DE:

```txt
Interne Adresse
Block
Treppenhaus
Etage
Tür
Optional. Verwende diese Angaben, um eine bestimmte Wohnung im Gebäude zu finden.
```

---

# Fase 3 — Backend: resolver dirección con unidades internas

## Objetivo

Hacer que el endpoint de búsqueda por dirección reciba y use los campos internos.

## Payload esperado

Adapta el contrato actual para aceptar:

```ts
type ResolveByAddressInput = {
  province: string;
  municipality: string;
  streetName: string;
  streetType?: string;
  streetTypeCode?: string;
  streetCode?: string;
  number: string;

  block?: string;
  staircase?: string;
  floor?: string;
  door?: string;
};
```

## Acciones

1. Actualiza validación Zod o equivalente.
2. Normaliza los campos internos:
   - trim,
   - mayúsculas,
   - espacios duplicados,
   - equivalencias como `1`, `01`, `P1`, `Pl:01` si procede.
3. Ajusta el cliente Catastro para enviar esos campos si el endpoint oficial los acepta.
4. Si el endpoint oficial no acepta todos esos campos directamente:
   - primero resuelve la parcela/lista de inmuebles por dirección,
   - después filtra internamente por bloque/escalera/planta/puerta.
5. Si no hay filtro interno, devuelve todas las unidades disponibles.
6. No rompas la búsqueda por referencia catastral.

## Caso mínimo obligatorio

Para:

```txt
ILLES BALEARS / PALMA / MIQUEL ROSSELLO I ALEMANY / 48
```

La respuesta normalizada debe distinguir las 5 viviendas:

```txt
6485534DD6768E0001XA | Pl:BJ        | 114 m² | 26,91% | 2003
6485534DD6768E0002MS | Pl:01 Pt:A   | 78 m²  | 18,21% | 2003
6485534DD6768E0003QD | Pl:01 Pt:B   | 67 m²  | 14,57% | 2003
6485534DD6768E0004WF | Pl:02 Pt:A   | 75 m²  | 17,36% | 2003
6485534DD6768E0005EG | Pl:02 Pt:B   | 105 m² | 22,95% | 2003
```

Si algún dato concreto no está disponible desde la API usada, documenta la limitación. Pero no ocultes los datos que sí estén disponibles.

---

# Fase 4 — Normalización y parsing de datos del Catastro

## Objetivo

Corregir la pérdida de información en la capa de normalización.

## Datos que deben extraerse si aparecen

- Referencia catastral completa.
- Referencia de parcela.
- Dirección completa.
- Planta.
- Puerta.
- Bloque.
- Escalera.
- Uso.
- Superficie en m².
- Porcentaje/coefficient de participación.
- Año de construcción.
- Municipio.
- Provincia.
- Código postal si existe.

## Reglas de parsing

Para cadenas como:

```txt
CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
Residencial | 67 m² | 14,57% | 2003
```

Debe normalizarse aproximadamente a:

```ts
{
  cadastralReference: "6485534DD6768E0003QD",
  parcelReference: "6485534DD6768E",
  address: "CL MIQUEL ROSSELLO I ALEMANY 48",
  floor: "01",
  door: "B",
  propertyUse: "Residencial",
  builtAreaM2: 67,
  participationCoefficient: 14.57,
  constructionYear: 2003
}
```

## Importante

- No conviertas `14,57%` a `1457`.
- No conviertas `67 m²` a `67 sq ft` internamente.
- No pierdas ceros de planta como `01`.
- No confundas `Pt:A` con portal.
- `Pl` significa planta.
- `Pt` significa puerta.

---

# Fase 5 — Mostrar resultados como viviendas diferenciadas

## Objetivo

Cambiar la lista de resultados para que el usuario pueda elegir la vivienda exacta.

## Resultado visual esperado

Cada tarjeta/fila debe mostrar como mínimo:

```txt
6485534DD6768E0003QD
CL MIQUEL ROSSELLO I ALEMANY 48 · Planta 01 · Puerta B
Residencial · 67 m² · 14,57% · 2003
```

Para inglés, adaptado:

```txt
6485534DD6768E0003QD
CL MIQUEL ROSSELLO I ALEMANY 48 · Floor 01 · Door B
Residential · 721 sq ft · 14.57% · 2003
```

Para alemán, adaptado:

```txt
6485534DD6768E0003QD
CL MIQUEL ROSSELLO I ALEMANY 48 · Etage 01 · Tür B
Wohnnutzung · 67 m² · 14,57 % · 2003
```

## Requisitos

1. Mostrar la referencia completa del inmueble si está disponible.
2. Mostrar planta y puerta si existen.
3. Mostrar superficie si existe.
4. Mostrar año si existe.
5. Mostrar uso si existe.
6. Mantener la flecha o acción para abrir detalle.
7. Evitar tarjetas indistinguibles.
8. Si varias filas aún tienen datos iguales, mostrar un aviso técnico discreto solo si procede.

## No hacer

- No mostrar 5 tarjetas iguales.
- No mostrar solo la referencia de parcela si existe referencia completa.
- No ocultar planta/puerta.
- No forzar al usuario a introducir planta/puerta para ver resultados.

---

# Fase 6 — Detalle de inmueble mejorado

## Objetivo

Actualizar el panel de detalle para mostrar la vivienda exacta, no solo el edificio.

## Debe mostrar

```txt
Detalle del inmueble
Referencia catastral completa
Referencia de parcela
Dirección
Bloque
Escalera
Planta
Puerta
Uso
Superficie construida
Coeficiente de participación
Año de construcción
Municipio
Provincia
Fuente
Fecha de consulta
```

Solo mostrar campos con valor, salvo que el diseño actual prefiera mostrar `—`.

## Confirmación

El botón:

```txt
Confirmar y usar estos datos
```

Debe rellenar el wizard con los datos de esa vivienda concreta.

## Reglas de relleno

Al confirmar:

- `cadastralReference` debe ser la referencia completa.
- `parcelReference` debe quedar disponible si existe.
- `constructionYear` debe rellenarse si existe.
- `area` debe rellenarse con la superficie de la vivienda si existe y el campo del wizard corresponde.
- `postalCode` solo se rellena si existe dato fiable.
- Dirección interna debe quedar guardada o visible si el modelo del wizard lo permite.
- Si la superficie recuperada es construida pero el wizard pide superficie útil, no la renombres como útil sin criterio. Usa un nombre claro o aplica el mapping ya definido por producto.

## Advertencia importante

En la captura actual, el detalle muestra:

```txt
Superficie construida: ---
Año construcción: ---
Referencia completa: 6485534DD6768E
```

Eso está incompleto si Catastro tiene la información de las viviendas. Debe corregirse para mostrar datos reales cuando estén disponibles.

---

# Fase 7 — Persistencia y Prisma si aplica

## Objetivo

Asegurar que los nuevos datos de vivienda pueden persistirse si el flujo actual ya guarda datos catastrales.

## Acciones

1. Revisa el schema Prisma actual.
2. Si ya existe modelo/campos para Catastro, amplíalos de forma mínima.
3. Si no se persiste todavía, no introduzcas una migración innecesaria salvo que el flujo lo requiera.
4. Si añades campos, considera:

```prisma
cadastralReference String?
parcelReference    String?
internalBlock      String?
internalStaircase  String?
internalFloor      String?
internalDoor       String?
propertyUse        String?
builtAreaM2        Float?
participationPct   Float?
```

5. No sobrescribas el schema existente con un schema externo.
6. Ejecuta migración solo si procede.

---

# Fase 8 — i18n y unidades

## Objetivo

Mantener coherencia lingüística y de unidades.

## i18n obligatorio

Todo nuevo texto debe estar en ES/EN/DE.

Claves sugeridas:

```ts
wizard.catastro.results.count
wizard.catastro.results.unitAddress
wizard.catastro.results.floor
wizard.catastro.results.door
wizard.catastro.results.block
wizard.catastro.results.staircase
wizard.catastro.results.use
wizard.catastro.results.builtArea
wizard.catastro.results.participation
wizard.catastro.results.year
wizard.catastro.detail.parcelReference
wizard.catastro.detail.fullReference
wizard.catastro.detail.internalAddress
wizard.catastro.detail.propertyUse
wizard.catastro.detail.participationCoefficient
wizard.catastro.errors.noUnitMatch
wizard.catastro.errors.tooManyMatches
```

## Unidades

- Internamente mantener `m²`.
- En ES mostrar `m²`.
- En EN mostrar `sq ft`.
- En DE mostrar `m²`.
- Usar helper centralizado `formatArea` o equivalente.
- El porcentaje debe formatearse según locale.

## Traducción de usos

Si Catastro devuelve `Residencial`, se puede mostrar:

- ES: `Residencial`
- EN: `Residential`
- DE: `Wohnnutzung` o traducción equivalente coherente con el resto de la app.

No mezcles español en la UI inglesa/alemana si el valor se muestra como copy visible.

---

# Fase 9 — Tests

## Objetivo

Cubrir específicamente el caso de varias viviendas en una misma dirección.

## Tests backend mínimos

1. Normalización de lista de inmuebles:

Input mock similar a Catastro:

```txt
6485534DD6768E0003QD
CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
Residencial | 67 m² | 14,57% | 2003
```

Expected:

```ts
{
  cadastralReference: "6485534DD6768E0003QD",
  parcelReference: "6485534DD6768E",
  floor: "01",
  door: "B",
  builtAreaM2: 67,
  participationCoefficient: 14.57,
  constructionYear: 2003
}
```

2. Dirección con 5 viviendas devuelve 5 matches diferenciados.
3. Filtro por planta `01` y puerta `B` devuelve la vivienda `0003QD` si los datos están disponibles.
4. Filtro vacío devuelve todas las viviendas.
5. No se pierden ceros de planta.
6. No se trunca la RC completa.

## Tests frontend mínimos

1. Render de campos de dirección interna.
2. Buscar dirección sin planta/puerta muestra varias viviendas diferenciadas.
3. Las tarjetas muestran RC completa, planta, puerta, superficie y año cuando existen.
4. Pulsar tarjeta abre detalle con datos completos.
5. Confirmar vivienda rellena el wizard.
6. En inglés la superficie se muestra en `sq ft`.
7. En español/alemán la superficie se muestra en `m²`.

## Mocking

No dependas de Catastro real en tests automáticos. Usa mocks del cliente Catastro.

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

## Caso 1 — Dirección sin dirección interna

Introducir:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
Bloque: vacío
Escalera: vacío
Planta: vacío
Puerta: vacío
```

Resultado esperado:

- aparecen 5 viviendas diferenciadas,
- cada una muestra RC completa distinta,
- se ve planta/puerta si existe,
- se ve superficie si existe,
- se ve año 2003 si existe,
- no aparecen 5 filas indistinguibles.

## Caso 2 — Dirección con planta y puerta

Introducir:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY (CL)
Número: 48
Planta: 01
Puerta: B
```

Resultado esperado:

- aparece preferentemente la vivienda:

```txt
6485534DD6768E0003QD
Pl:01 Pt:B
67 m²
2003
```

Si Catastro devuelve varias coincidencias, la más probable debe aparecer claramente destacada o filtrada.

## Caso 3 — Detalle

Pulsar la vivienda `6485534DD6768E0003QD`.

Resultado esperado:

- se abre detalle,
- muestra RC completa,
- muestra parcela,
- muestra planta 01,
- muestra puerta B,
- muestra uso residencial,
- muestra superficie 67 m²,
- muestra año 2003,
- permite confirmar.

## Caso 4 — Confirmación

Confirmar vivienda.

Resultado esperado:

- el wizard usa esa vivienda concreta,
- se rellena año 2003,
- se rellena superficie si corresponde,
- se guarda RC completa `6485534DD6768E0003QD`, no solo `6485534DD6768E`,
- el usuario puede continuar el análisis.

## Caso 5 — i18n y unidades

Revisar mínimo en:

```txt
ES · € · m²
EN · £ · sq ft
DE · € · m²
```

Resultado esperado:

- no se mezclan idiomas,
- los labels nuevos están traducidos,
- las superficies se formatean según configuración,
- el porcentaje se formatea según locale.

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

Ejecuta también tests específicos si existen:

```bash
npm test -- catastro
npm test -- wizard
```

---

# Fase 12 — Informe final

Crea o actualiza un informe en:

```txt
sdd/features/catastro-integration/QA_REPORT_INTERNAL_ADDRESS_UNIT_SELECTION.md
```

Debe incluir:

1. Resumen del problema.
2. Causa raíz.
3. Cambios realizados en backend.
4. Cambios realizados en normalización.
5. Cambios realizados en UI.
6. Cambios i18n.
7. Cambios de persistencia, si aplica.
8. Tests añadidos/actualizados.
9. Resultado QA manual.
10. Limitaciones pendientes.
11. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "fix: distinguish cadastral units by internal address"
```

## PR sugerida

Título:

```txt
fix: distinguish Catastro units by internal address
```

Cuerpo:

```md
## Summary
- Adds internal address fields: block, staircase, floor and door.
- Normalizes full cadastral unit references instead of only parcel references.
- Shows differentiated dwellings for multi-unit addresses.
- Improves cadastral match details and confirmation flow.
- Preserves i18n and area unit formatting.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual QA: address without internal fields
- [ ] manual QA: address with floor/door
- [ ] manual QA: match detail
- [ ] manual QA: confirm selected dwelling
- [ ] manual QA: ES/EN/DE units

## Notes
Document any limitation of the Catastro service response here.
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No romper la búsqueda por referencia catastral.
- No romper la búsqueda por dirección ya funcional.
- No mostrar varias viviendas como tarjetas idénticas.
- No truncar la referencia catastral completa.
- No perder planta/puerta.
- No convertir superficies internamente a `sq ft`.
- No hardcodear textos visibles.
- No mezclar idiomas.
- No mostrar raw JSON al usuario final.
- No rediseñar el wizard completo.
- No obligar al usuario a introducir bloque/escalera/planta/puerta.
- No bloquear el fallback manual.
- No introducir migraciones innecesarias.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. El formulario de dirección incluya Bloque, Escalera, Planta y Puerta.
2. Esos campos se envíen al backend y se usen para filtrar si tienen valor.
3. La búsqueda sin campos internos muestre todas las viviendas encontradas en la dirección.
4. La búsqueda con planta/puerta pueda localizar la vivienda concreta.
5. Las tarjetas de resultados muestren RC completa, planta, puerta, superficie, porcentaje y año cuando existan.
6. El detalle del inmueble muestre los datos de la vivienda exacta.
7. Al confirmar, el wizard guarde la RC completa y datos de esa vivienda, no solo la parcela.
8. ES/EN/DE estén cubiertos.
9. `m²`/`sq ft` se respeten según configuración activa.
10. Tests relevantes pasen.
11. Build pase.
12. Exista informe QA final.
13. Exista commit y PR listos para revisión.

---

# Nota final de producto

Esta mejora es importante porque el valor real de la integración con Catastro no está solo en encontrar el edificio, sino en identificar la vivienda exacta dentro de edificios con división horizontal.

Para EnergyScan, elegir mal la vivienda puede afectar superficie, año, datos de referencia y precisión del análisis energético. Por eso el resultado debe ser explícito, verificable y confirmable por el usuario.

