# Prompt maestro para Gemini CLI — Corrección extracción de datos Catastro por Referencia Catastral

## Contexto

Estás trabajando en el repositorio local de la aplicación **Anclora EnergyScan**.

La aplicación permite introducir una **Referencia Catastral (RC)** para consultar datos del inmueble en la Sede Electrónica del Catastro y pre-rellenar campos del wizard de análisis energético.

Actualmente, al introducir una RC válida, la integración obtiene algunos datos del Catastro, pero la aplicación sólo está incorporando parcialmente la información disponible:

- Sí se incorpora correctamente el **año de construcción**.
- El **código postal** se está incorporando mal: sólo se rellenan los dos primeros dígitos, por ejemplo `07`, cuando debería ser el código completo `07015`.
- No se está incorporando correctamente la **superficie de vivienda / superficie útil estimada**.
- No se está incorporando correctamente el **porcentaje de participación del inmueble**.

En la consulta real del Catastro asociada a la RC de prueba se observan estos datos:

```text
Referencia catastral: 6485534DD6768E0003QD
Localización: CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
07015 PALMA (ILLES BALEARS)
Clase: Urbano
Uso principal: Residencial
Superficie construida: 67 m²
Año construcción: 2003
Superficie gráfica parcela: 617 m²
Participación del inmueble: 14,570000 %
Construcción:
  - VIVIENDA: planta 01, puerta B, superficie 52 m²
  - ELEMENTOS COMUNES: superficie 15 m²
```

La app debería usar preferentemente la superficie privativa de `VIVIENDA` cuando exista, en este caso **52 m²**, y no quedarse sólo con la superficie construida total de 67 m² si la tabla de construcción permite distinguir vivienda y elementos comunes.

## Objetivo

Corregir end-to-end la integración de Catastro por Referencia Catastral para que la aplicación extraiga, normalice, persista y muestre correctamente los datos disponibles del inmueble.

El resultado esperado es que, al introducir la RC `6485534DD6768E0003QD`, la aplicación rellene al menos:

```text
Año de construcción: 2003
Código postal: 07015
Superficie útil / vivienda estimada: 52
Superficie construida catastral: 67
Porcentaje de participación: 14,57 %
Referencia catastral completa: 6485534DD6768E0003QD
Referencia de parcela: 6485534DD6768E
Municipio: Palma
Provincia: Illes Balears
Dirección: CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
Uso principal: Residencial
Clase: Urbano
```

## Instrucciones de ejecución

Actúa como agente senior full-stack, especialista en integración de APIs públicas, parsing robusto, producto y QA.

Trabaja desde la raíz del repo local de **Anclora EnergyScan**.

No rehagas la aplicación desde cero. Corrige de forma incremental, trazable y testeable la lógica existente.

Debes implementar la solución end-to-end, incluyendo:

1. Inventario inicial del estado actual.
2. Localización del flujo exacto de consulta Catastro por RC.
3. Corrección del parser / normalizador de datos.
4. Corrección del mapeo hacia el estado del wizard.
5. Corrección visual si algún campo existe pero no se muestra correctamente.
6. Tests unitarios y/o de integración.
7. Validación manual o automatizada en la app.
8. Commit final con mensaje claro.

No hagas cambios cosméticos no relacionados con este problema.

## Reglas funcionales obligatorias

### 1. Código postal

El código postal debe extraerse completo.

Caso real esperado:

```text
07015 PALMA (ILLES BALEARS)
```

Resultado esperado:

```ts
postalCode = "07015"
```

No debe truncarse a `07`.

Si actualmente existe una función que interpreta `07` como provincia, debe separarse claramente:

```ts
provinceCode = "07"
postalCode = "07015"
```

Ambos conceptos no deben mezclarse.

### 2. Superficie del inmueble

El sistema debe diferenciar entre:

```ts
builtAreaM2 = 67
livingAreaM2 / usableAreaM2 / dwellingAreaM2 = 52
commonElementsAreaM2 = 15
```

Regla de prioridad:

1. Si la tabla de construcción contiene una fila de uso `VIVIENDA`, usar esa superficie como superficie principal del formulario para estimación energética.
2. Si no existe fila `VIVIENDA`, usar la superficie construida descriptiva del inmueble.
3. Si ninguna existe, dejar el campo vacío y mostrar estado no disponible.

Para el caso de prueba:

```ts
mainAreaM2 = 52
builtAreaM2 = 67
```

El formulario del wizard debe rellenarse con `52` como superficie útil / vivienda estimada si ese es el campo usado para el cálculo.

### 3. Porcentaje de participación

Debe extraerse y normalizarse:

```text
14,570000 %
```

Resultado esperado:

```ts
participationPercent = 14.57
```

En UI puede mostrarse como:

```text
14,57 %
```

No debe redondearse erróneamente a `14 %` salvo que exista una decisión explícita de diseño para tarjetas resumidas. Si hay tarjeta resumida, puede mostrar `14,57 %` o `14.57 %`, pero no debe perder precisión sin motivo.

### 4. Año de construcción

Debe mantenerse funcionando:

```ts
constructionYear = 2003
```

No rompas esta parte.

### 5. Dirección, municipio y provincia

Debe conservarse o mejorarse el parsing de:

```text
CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B
07015 PALMA (ILLES BALEARS)
```

Resultado esperado mínimo:

```ts
addressLine = "CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B"
postalCode = "07015"
municipality = "PALMA" // o "Palma" si se normaliza capitalización
province = "ILLES BALEARS" // o "Illes Balears"
```

### 6. Referencias catastrales

Debe mantenerse:

```ts
cadastralReference = "6485534DD6768E0003QD"
parcelReference = "6485534DD6768E"
```

Si la aplicación deriva la referencia de parcela desde la RC completa, documenta la regla usada y añade test.

## Tareas técnicas

### Fase 1 — Inventario

Ejecuta comandos para entender el estado actual:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
find . -maxdepth 4 -type f | grep -Ei "catastro|cadastral|wizard|assessment|property|address|cadastre|parcel" | sort
```

Busca referencias relevantes:

```bash
grep -R "catastro\|Catastro\|cadastral\|Cadastral\|cadastre\|postal\|zip\|participation\|superficie\|surface\|area\|builtArea\|constructionYear" -n src app components lib prisma tests 2>/dev/null | head -200
```

Identifica exactamente:

- endpoint o función que consulta Catastro,
- parser de la respuesta,
- normalizador de datos,
- modelo TypeScript usado para datos catastrales,
- estado del wizard donde se insertan los datos,
- componentes UI que muestran los datos obtenidos.

Antes de cambiar nada, deja anotado en el resumen final qué archivos intervienen.

### Fase 2 — Modelo de datos

Revisa si el modelo actual permite representar todos los campos.

Debe existir una estructura equivalente a:

```ts
type CadastralPropertyData = {
  cadastralReference: string;
  parcelReference?: string;
  addressLine?: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  propertyClass?: string;
  mainUse?: string;
  constructionYear?: number;
  builtAreaM2?: number;
  dwellingAreaM2?: number;
  commonElementsAreaM2?: number;
  mainAreaM2?: number;
  plotAreaM2?: number;
  participationPercent?: number;
};
```

No es obligatorio usar exactamente estos nombres si el repo ya tiene convenciones claras, pero deben existir equivalentes claros y tipados.

Evita nombres ambiguos como `surface` si no se sabe si representa superficie construida, útil o privativa.

### Fase 3 — Parser robusto

Corrige el parser para que funcione con la respuesta real del Catastro.

Debe cubrir, como mínimo, estos patrones:

```text
Superficie construida: 67 m²
Año construcción: 2003
Participación del inmueble: 14,570000 %
07015 PALMA (ILLES BALEARS)
VIVIENDA ... superficie 52 m²
ELEMENTOS COMUNES ... superficie 15 m²
```

Implementa funciones auxiliares puras y testeables, por ejemplo:

```ts
parseSpanishDecimal("14,570000") => 14.57
parseAreaM2("67 m²") => 67
parsePostalMunicipalityProvince("07015 PALMA (ILLES BALEARS)") => {
  postalCode: "07015",
  municipality: "PALMA",
  province: "ILLES BALEARS"
}
```

El parser debe ser tolerante a:

- espacios múltiples,
- saltos de línea,
- `m²`, `m2` o `mÂ²` si aparece por encoding,
- porcentajes con coma decimal,
- textos en mayúsculas o minúsculas.

### Fase 4 — Mapeo al wizard

Corrige el punto donde los datos catastrales se vuelcan al wizard.

Debe cumplirse:

```ts
wizard.property.constructionYear = 2003
wizard.property.postalCode = "07015"
wizard.property.areaM2 = 52 // si este campo representa superficie útil/principal de cálculo
wizard.property.builtAreaM2 = 67 // si existe campo diferenciado
wizard.property.participationPercent = 14.57
```

Si el wizard sólo tiene un campo `areaM2` o `surfaceM2`, úsalo para la superficie principal `mainAreaM2`, no para la superficie construida total, salvo que el producto haya definido lo contrario.

Si hay formularios visibles con nombres como:

- `Superficie útil (m²)`
- `Superficie construida`
- `Código postal`
- `% coeficiente de participación`

Asegúrate de que reciben el valor correcto.

### Fase 5 — UI y formato

Revisa la pantalla del wizard donde se muestran los datos obtenidos del Catastro.

Problemas actuales observados:

- `Año construcción` aparece como `2003`, correcto.
- `Código postal` aparece como `07`, incorrecto.
- `% coeficiente de participación` aparece como `14 %`, incompleto.
- La superficie de vivienda no se incorpora aunque está disponible como `52 m²`.

Corrige la UI para que muestre:

```text
Superficie vivienda: 52 m²
Superficie construida: 67 m²
Año construcción: 2003
Código postal: 07015
% coeficiente de participación: 14,57 %
```

Si por limitaciones de diseño no caben todos los datos, prioriza los campos que alimentan el cálculo y deja los secundarios en un bloque “Datos catastrales detectados”.

No sacrifiques precisión por estética.

### Fase 6 — Tests

Añade o actualiza tests.

Debe haber al menos un test con este caso real:

```ts
const sample = {
  cadastralReference: "6485534DD6768E0003QD",
  location: "CL MIQUEL ROSSELLO I ALEMANY 48 Pl:01 Pt:B\n07015 PALMA (ILLES BALEARS)",
  propertyClass: "Urbano",
  mainUse: "Residencial",
  builtArea: "67 m²",
  constructionYear: "2003",
  plotArea: "617 m²",
  participation: "14,570000 %",
  constructionRows: [
    { use: "VIVIENDA", floor: "01", door: "B", area: "52" },
    { use: "ELEMENTOS COMUNES", area: "15" }
  ]
};
```

Expectativas mínimas:

```ts
expect(result.constructionYear).toBe(2003);
expect(result.postalCode).toBe("07015");
expect(result.builtAreaM2).toBe(67);
expect(result.dwellingAreaM2).toBe(52);
expect(result.mainAreaM2).toBe(52);
expect(result.commonElementsAreaM2).toBe(15);
expect(result.participationPercent).toBe(14.57);
expect(result.municipality).toMatch(/palma/i);
expect(result.province).toMatch(/illes balears/i);
```

También añade tests negativos o de robustez:

- sin fila `VIVIENDA`, usa `builtAreaM2`,
- porcentaje con punto decimal,
- código postal con cero inicial,
- superficie con `m2` en vez de `m²`.

### Fase 7 — Validación en local

Ejecuta los comandos disponibles según el repo:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Si algún script no existe, usa el equivalente real definido en `package.json` y documenta la diferencia.

Después levanta la app localmente si es viable:

```bash
npm run dev
```

Valida manualmente el flujo:

1. Abrir `/wizard`.
2. Introducir la RC `6485534DD6768E0003QD`.
3. Confirmar que los datos del Catastro se cargan.
4. Confirmar que el formulario muestra código postal completo `07015`.
5. Confirmar que la superficie principal usada es `52 m²`.
6. Confirmar que el año sigue siendo `2003`.
7. Confirmar que el porcentaje muestra `14,57 %` o `14.57 %`, no `14 %`.
8. Confirmar que no se rompe el paso siguiente del wizard.

Si tienes Playwright o testing e2e disponible, añade una prueba mínima para este flujo.

### Fase 8 — Commit

Cuando todo esté corregido y validado:

```bash
git status --short
git add <archivos_modificados>
git commit -m "fix: normalize full Catastro property data from cadastral reference"
```

No hagas push ni abras PR salvo que se indique explícitamente.

## Criterios de aceptación

La corrección se considerará válida si se cumple todo lo siguiente:

- Al introducir la RC `6485534DD6768E0003QD`, el código postal se rellena como `07015`, no como `07`.
- La superficie principal del inmueble se rellena como `52 m²` cuando exista fila `VIVIENDA`.
- La superficie construida catastral `67 m²` no se pierde y queda disponible como dato diferenciado.
- El año de construcción sigue siendo `2003`.
- El porcentaje de participación se normaliza como `14.57` y se muestra sin redondeo destructivo.
- Municipio y provincia se conservan correctamente.
- Los tests cubren el caso real de Palma / Illes Balears.
- `npm test`, lint/typecheck/build o equivalentes pasan, o se documenta claramente cualquier limitación externa.
- El commit final contiene sólo cambios relacionados con esta corrección.

## Riesgos a evitar

No mezcles código postal y código de provincia.

No uses `parseInt` sobre porcentajes decimales, porque convertiría `14,570000` en `14`.

No uses `Number("14,570000")` directamente, porque devuelve `NaN`.

No tomes siempre la superficie construida total si existe una fila específica de `VIVIENDA`.

No rompas el cálculo energético existente: si cambias qué campo alimenta el cálculo, verifica su impacto.

No introduzcas dependencias nuevas salvo que sean estrictamente necesarias.

No cambies estilos globales ni componentes no relacionados.

## Resumen final requerido

Al terminar, devuelve un informe breve con esta estructura:

```md
## Resultado
- Estado: completado / parcial / bloqueado

## Archivos modificados
- ...

## Problema encontrado
- ...

## Corrección aplicada
- ...

## Datos validados para RC 6485534DD6768E0003QD
- Código postal: ...
- Superficie vivienda: ...
- Superficie construida: ...
- Año construcción: ...
- Participación: ...

## Tests ejecutados
- npm test: ...
- npm run lint: ...
- npm run typecheck: ...
- npm run build: ...

## Commit
- hash / mensaje

## Pendientes o limitaciones
- ...
```

