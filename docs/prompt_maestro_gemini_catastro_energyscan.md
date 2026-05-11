# Prompt maestro para Gemini — Integración Catastro en Anclora EnergyScan

## Contexto

Vas a trabajar en el repositorio local de **Anclora EnergyScan**, aplicación premium de Anclora Group desarrollada con Next.js 14, Prisma y flujo mobile-first.

Se ha adjuntado un paquete ZIP llamado:

```txt
anclora-energyscan-catastro-package.zip
```

El paquete contiene una feature inicial para integrar datos de Catastro en EnergyScan. No debes copiarla sin analizarla. Debes usarla como scaffolding técnico, revisando su compatibilidad con la arquitectura real del repo.

Contenido detectado del paquete:

```txt
ANCLORA_ENERGYSCAN_CATASTRO_PACKAGE_README.md
anclora-energyscan-catastro-package.manifest.json
components/cadastre/CadastreMap.tsx
components/cadastre/CadastreMatchList.tsx
components/cadastre/CadastreSearch.tsx
lib/catastro/client.ts
lib/catastro/normalize.ts
lib/catastro/types.ts
lib/prisma.ts
prisma/schema.prisma
app/api/catastro/resolve/route.ts
app/api/catastro/provinces/route.ts
app/api/catastro/municipalities/route.ts
app/api/catastro/streets/route.ts
app/api/catastro/reverse/route.ts
app/api/uploads/document/route.ts
```

El README del paquete indica expresamente que:

- Las URLs de Catastro son placeholders.
- Deben sustituirse por servicios oficiales validados.
- Debe mantenerse una capa backend de abstracción para no acoplar la UI a endpoints concretos.
- Incluye scaffolding para Next.js App Router, Prisma, Vercel Blob y componentes React básicos.

## Objetivo

Integrar una feature de consulta y resolución de datos catastrales en Anclora EnergyScan de forma end-to-end, respetando la arquitectura actual, la base de datos existente, el sistema i18n, el diseño premium y el flujo de análisis energético.

La feature debe permitir que el usuario pueda aportar o resolver datos de la vivienda mediante:

1. Referencia catastral.
2. Dirección normalizada.
3. Coordenadas o selección en mapa, si la arquitectura actual lo permite.
4. Confirmación manual de coincidencias antes de usar los datos en el análisis.

## Principio clave

No sustituyas la arquitectura existente por la del paquete.

El paquete es una propuesta inicial. Antes de implementar, debes inspeccionar el repo real y adaptar:

- estructura de carpetas,
- Prisma schema existente,
- modelo `Assessment` o equivalente,
- sistema i18n,
- helpers de formato,
- componentes UI existentes,
- tests,
- rutas API,
- generación de informes/PDF,
- flujo actual del wizard.

## Rama de trabajo

Crea una rama específica:

```bash
git checkout -b feat/catastro-integration
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial obligatoria

## Objetivo

Comprender el estado real del repo antes de tocar código.

## Acciones

1. Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find . -maxdepth 3 -type f | sort | sed 's#^./##' | head -300
```

2. Localiza:

- wizard actual,
- modelo Prisma actual,
- rutas API existentes,
- sistema i18n,
- componentes de formulario,
- helpers de formato,
- tests existentes,
- generación de PDF/report demo,
- gestión de uploads/documentos si existe,
- estado actual de SQLite/LibSQL/Prisma frente a cualquier plan de Neon/Postgres.

3. Revisa el paquete ZIP y compara sus archivos con el repo real.

4. Antes de implementar, redacta un mini plan técnico en consola o en un documento QA interno con:

- qué se puede reutilizar directamente,
- qué debe adaptarse,
- qué no debe usarse,
- riesgos detectados,
- dependencias necesarias.

## Criterio de aceptación

No debe haber cambios de código antes de entender cómo encaja la feature con el repo actual.

---

# Fase 1 — Contrato funcional de la feature

## Objetivo

Definir el comportamiento esperado antes de implementar.

## Flujo esperado

El usuario debe poder iniciar el análisis energético y, en el paso correspondiente del wizard, introducir datos de la vivienda mediante una de estas vías:

### Opción A — Referencia catastral

Campo para introducir referencia catastral.

La app llama a un endpoint interno, por ejemplo:

```txt
POST /api/catastro/resolve
```

El backend consulta el servicio oficial o capa adaptadora validada y devuelve coincidencias normalizadas.

### Opción B — Dirección

Formulario con campos mínimos:

- provincia,
- municipio,
- tipo de vía,
- nombre de vía,
- número,
- código postal,
- piso/puerta si aplica.

La app debe resolver posibles coincidencias y permitir confirmar una.

### Opción C — Coordenadas / mapa

Solo implementar si el repo ya tiene mapa o si el coste técnico es razonable.

Si no hay mapa todavía, deja la base preparada pero no bloquees la feature principal. La prioridad es referencia catastral y dirección.

## Datos esperados

Cada coincidencia catastral normalizada debe tener, si el servicio lo permite:

- referencia catastral,
- provincia,
- municipio,
- dirección,
- código postal,
- superficie construida,
- superficie de parcela,
- coordenadas,
- geometría si está disponible,
- fuente,
- fecha de consulta,
- nivel de confianza.

## Regla importante

El usuario debe confirmar la coincidencia antes de que los datos se usen para rellenar el wizard o persistirse como dato principal.

---

# Fase 2 — Integración backend Catastro

## Objetivo

Crear una capa backend robusta para resolver datos catastrales sin acoplar la UI a Catastro.

## Archivos del paquete relevantes

```txt
lib/catastro/client.ts
lib/catastro/normalize.ts
lib/catastro/types.ts
app/api/catastro/resolve/route.ts
app/api/catastro/provinces/route.ts
app/api/catastro/municipalities/route.ts
app/api/catastro/streets/route.ts
app/api/catastro/reverse/route.ts
```

## Acciones

1. Crea o adapta un módulo interno similar a:

```txt
src/lib/catastro/
```

o la ubicación equivalente del repo.

2. Implementa tipos Zod para validar entrada y salida.

3. Implementa un cliente backend con funciones separadas:

```ts
resolveByCadastralReference()
resolveByAddress()
resolveByCoordinates()
normalizeCadastralResponse()
```

4. Sustituye los placeholders del paquete por endpoints oficiales validados.

No uses URLs tipo:

```ts
const url = `${CAT_URL}/...`;
```

Eso es scaffolding, no implementación final.

5. Añade manejo de errores:

- referencia inválida,
- sin resultados,
- múltiples coincidencias,
- servicio externo caído,
- timeout,
- respuesta no parseable,
- rate limits si aplica.

6. No expongas detalles internos del servicio externo directamente al frontend.

7. Añade timeout razonable y `cache: "no-store"` donde proceda.

8. Si el servicio devuelve XML, implementa parsing seguro y testeable. No lo dejes como texto bruto salvo para auditoría/debug controlado.

## Requisito de seguridad

La consulta a Catastro debe hacerse desde backend, no desde componentes cliente.

---

# Fase 3 — Modelo de datos y persistencia

## Objetivo

Persistir la información catastral de forma compatible con el modelo actual de EnergyScan.

## Advertencia importante

El paquete incluye un `prisma/schema.prisma` pensado para Neon Postgres con modelos nuevos:

- `Property`
- `PropertyDocument`
- `PropertyImage`
- `PropertyAnalysis`

Pero el repo actual puede tener ya un modelo `Assessment`, `Lead`, `Provider`, `Partner` u otros modelos asociados. No reemplaces el schema actual.

## Acciones

1. Inspecciona el `prisma/schema.prisma` actual.

2. Decide la integración más segura:

### Opción recomendada si ya existe `Assessment`

Añadir campos catastrales directamente a `Assessment` o crear un modelo relacionado `CadastralRecord`.

Ejemplo orientativo:

```prisma
model CadastralRecord {
  id                  String   @id @default(uuid())
  assessmentId         String?
  cadastralReference   String?
  province             String?
  municipality         String?
  streetAddress        String?
  postalCode           String?
  lat                  Float?
  lng                  Float?
  surfaceBuiltM2       Float?
  surfacePlotM2        Float?
  geometryWkt          String?
  sourceSystem         String   @default("catastro")
  sourceMode           String?
  confidence           Float?   @default(1)
  rawResponseJson      Json?
  retrievedAt          DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

Adapta nombres y relaciones al schema real.

3. No migres a Postgres/Neon solo porque el paquete lo sugiera. Si el repo está en SQLite/LibSQL para dev, respeta el flujo actual.

4. Genera migración Prisma si procede:

```bash
npx prisma migrate dev --name add_catastro_records
```

5. Ejecuta:

```bash
npx prisma generate
```

6. Añade o actualiza seed/demo data si la feature necesita datos demo.

## Criterio de aceptación

La base de datos debe conservar compatibilidad con la app actual y los tests existentes.

---

# Fase 4 — API interna de EnergyScan

## Objetivo

Exponer endpoints internos estables para el frontend.

## Endpoints mínimos

Implementa o adapta:

```txt
POST /api/catastro/resolve
GET  /api/catastro/provinces
GET  /api/catastro/municipalities?province=...
GET  /api/catastro/streets?province=...&municipality=...&query=...
GET  /api/catastro/reverse?lat=...&lng=...
```

Si alguna ruta no se puede implementar todavía por falta de servicio fiable, déjala documentada y devuelve una respuesta controlada, no un stub silencioso.

## Requisitos

- Validación con Zod.
- Respuestas JSON consistentes.
- Códigos HTTP correctos.
- Errores localizables en frontend.
- No filtrar stack traces al cliente.
- Logging prudente en servidor.
- Tests unitarios o de integración para los casos principales.

## Contrato de respuesta sugerido

```ts
type CatastroResolveResponse = {
  ok: boolean;
  data?: {
    matches: CadastralMatch[];
    source: {
      system: "catastro";
      mode: "rc" | "address" | "coords" | "map";
      retrievedAt: string;
      confidence: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};
```

---

# Fase 5 — UI del wizard

## Objetivo

Integrar la búsqueda catastral dentro del flujo real del wizard sin romper la experiencia actual.

## Archivos del paquete relevantes

```txt
components/cadastre/CadastreSearch.tsx
components/cadastre/CadastreMap.tsx
components/cadastre/CadastreMatchList.tsx
```

Estos componentes son básicos y están en español hardcodeado. Deben adaptarse al diseño real, i18n y sistema de formularios actual.

## Acciones

1. Localiza el paso del wizard donde se introducen los datos de la propiedad.

2. Añade un bloque premium de búsqueda catastral con:

- input de referencia catastral,
- alternativa de búsqueda por dirección,
- botón de búsqueda,
- estado loading,
- estado error,
- estado sin resultados,
- listado de coincidencias,
- botón para confirmar coincidencia.

3. Al confirmar coincidencia:

- rellenar campos existentes del wizard,
- guardar `cadastralReference`,
- guardar superficie construida/parcela si aplica,
- guardar dirección normalizada,
- mantener trazabilidad de fuente,
- permitir edición manual posterior.

4. No bloquees al usuario si no tiene referencia catastral. Debe poder continuar manualmente.

5. Añade microcopy claro:

- la consulta puede ayudar a precargar datos,
- los datos deben ser revisados por el usuario,
- Catastro puede no devolver todos los datos energéticos necesarios.

6. Mantén mobile-first.

7. No rediseñes el wizard completo.

## i18n obligatorio

Todo el nuevo copy debe estar en:

- español,
- inglés,
- alemán.

No hardcodees textos visibles en componentes.

Ejemplos de claves:

```ts
wizard.catastro.title
wizard.catastro.description
wizard.catastro.referenceLabel
wizard.catastro.referencePlaceholder
wizard.catastro.searchButton
wizard.catastro.searching
wizard.catastro.noResults
wizard.catastro.confirmMatch
wizard.catastro.manualFallback
wizard.catastro.sourceNotice
wizard.catastro.errors.invalidReference
wizard.catastro.errors.serviceUnavailable
```

---

# Fase 6 — Unidades, moneda e integración con análisis

## Objetivo

Asegurar que los datos catastrales encajan con las reglas actuales de idioma, moneda y unidades.

## Requisitos

1. Mantén la unidad canónica interna de superficie en `m²`, salvo que el repo ya use otra.

2. En presentación:

- `ES · € · m²` debe mostrar metros cuadrados.
- `EN · £ · sq ft` debe mostrar pies cuadrados.
- `DE · € · m²` debe mostrar metros cuadrados.

3. Si Catastro devuelve superficie en m², no la conviertas destructivamente en base de datos.

4. Usa helpers centralizados como:

```ts
formatArea()
formatCurrency()
formatNumber()
```

5. El análisis energético debe usar la superficie correcta y no duplicar conversiones.

6. Añade tests para evitar el error de mostrar `m²` cuando el usuario está en inglés con `sq ft`.

---

# Fase 7 — Documentos y uploads

## Objetivo

Revisar si el paquete de Vercel Blob encaja con el flujo real de EnergyScan.

## Archivo del paquete relevante

```txt
app/api/uploads/document/route.ts
```

## Advertencia

No introduzcas Vercel Blob si el repo ya usa otro sistema o si no están configuradas las variables necesarias.

## Acciones

1. Inspecciona si el repo ya tiene upload de documentos/imágenes.

2. Si ya existe, adapta la feature a ese sistema.

3. Si no existe y tiene sentido implementarlo ahora:

- usar endpoint backend,
- validar tipo MIME,
- limitar tamaño,
- separar documentos e imágenes,
- no aceptar archivos peligrosos,
- guardar metadatos en DB,
- no exponer URLs privadas sin control.

4. Si Vercel Blob no está configurado, dejar la integración preparada pero no romper build.

## Criterio

La feature Catastro no debe depender obligatoriamente de uploads para funcionar.

---

# Fase 8 — Informe/PDF y demo assets

## Objetivo

Hacer que los datos catastrales confirmados puedan aparecer en el informe o PDF si el flujo actual lo permite.

## Acciones

1. Localiza la generación actual de informe/PDF.

2. Añade una sección discreta de trazabilidad, por ejemplo:

```txt
Datos de inmueble verificados mediante fuente catastral
Referencia catastral: XXXXX
Municipio: XXXXX
Superficie construida: XX m² / XX sq ft según configuración
Fuente: Catastro
Fecha de consulta: DD/MM/YYYY
```

3. No sobrecargues el PDF.

4. No muestres raw response completo en el PDF.

5. Asegura i18n en el PDF si ya existe soporte por idioma.

---

# Fase 9 — Testing

## Objetivo

Cubrir la feature con pruebas suficientes sin sobredimensionar.

## Tests mínimos

Añade o actualiza tests para:

1. Validación de input:
   - referencia catastral vacía,
   - referencia inválida,
   - dirección incompleta,
   - coordenadas inválidas.

2. Normalización:
   - trim,
   - uppercase,
   - espacios duplicados,
   - mapeo de superficie,
   - mapeo de dirección.

3. API:
   - resolve por referencia,
   - resolve sin resultados,
   - error controlado del servicio externo.

4. UI:
   - render del bloque Catastro,
   - búsqueda en loading,
   - listado de coincidencias,
   - confirmación de una coincidencia,
   - fallback manual.

5. i18n/unidades:
   - inglés no muestra labels en español,
   - inglés muestra `sq ft`,
   - español muestra `m²`,
   - alemán muestra `m²`.

## Comandos

Ejecuta los disponibles en `package.json`, como mínimo:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si alguno no existe, documenta el motivo y usa los equivalentes reales.

---

# Fase 10 — QA manual obligatoria

## Objetivo

Verificar que la feature funciona en navegador.

## Acciones

1. Levanta la app:

```bash
npm run dev
```

2. Entra en:

```txt
http://localhost:3000/wizard
```

3. Prueba los idiomas:

- `ES · € · m²`
- `EN · £ · sq ft`
- `DE · € · m²`

4. Verifica:

- el bloque Catastro aparece correctamente,
- el copy cambia de idioma,
- no quedan textos hardcodeados en español cuando el idioma es inglés o alemán,
- la superficie se muestra en la unidad correcta,
- la selección de coincidencia rellena el wizard,
- se puede continuar manualmente,
- no se rompe el flujo existente,
- el diseño es usable en mobile.

5. Si existe Playwright, añade una prueba e2e básica del flujo.

---

# Fase 11 — Gate final y documentación

## Objetivo

Cerrar la feature con trazabilidad técnica y de producto.

## Entregables

Crea un informe en una ubicación coherente del repo, por ejemplo:

```txt
sdd/features/catastro-integration/QA_REPORT.md
```

Incluye:

1. Resumen de la feature.
2. Decisiones de arquitectura.
3. Archivos reutilizados del paquete.
4. Archivos descartados o adaptados.
5. Endpoints implementados.
6. Cambios de Prisma/migración.
7. Tests ejecutados.
8. Resultado QA manual.
9. Riesgos pendientes.
10. Variables de entorno necesarias.
11. Limitaciones conocidas.

## Commit sugerido

```bash
git add .
git commit -m "feat: integrate catastro property resolution"
```

## PR sugerida

Crear Pull Request con título:

```txt
feat: integrate Catastro property resolution into EnergyScan
```

El cuerpo del PR debe incluir:

- resumen,
- fases implementadas,
- capturas si procede,
- comandos ejecutados,
- riesgos,
- checklist QA.

---

# Restricciones fuertes

- No trabajar en `main`.
- No copiar el `schema.prisma` del paquete encima del existente.
- No migrar a Neon/Postgres si el repo actual no está preparado para ello.
- No dejar endpoints Catastro con `...` como URL final.
- No dejar componentes con copy hardcodeado.
- No introducir Vercel Blob si rompe build o despliegue.
- No acoplar frontend directamente a servicios externos de Catastro.
- No romper el wizard existente.
- No bloquear el flujo manual si Catastro falla.
- No introducir dependencias innecesarias.
- No mezclar idiomas en la UI.
- No hacer cambios cosméticos no relacionados.

---

# Criterios de aceptación finales

La integración se considera completa cuando:

- Existe una capa backend Catastro clara y testeable.
- El usuario puede buscar por referencia catastral o dirección.
- La app devuelve coincidencias normalizadas.
- El usuario puede confirmar una coincidencia.
- Los datos confirmados rellenan el wizard sin impedir edición manual.
- Los datos se persisten de forma compatible con el modelo actual.
- El flujo manual sigue funcionando si Catastro falla.
- La UI respeta español, inglés y alemán.
- Las superficies respetan `m²` / `sq ft` según configuración activa.
- Lint, typecheck, tests y build pasan o se documentan fallos previos no causados por esta feature.
- Hay QA manual en `/wizard`.
- Hay informe final de implementación.
- Hay commit y PR listos para revisión.

---

# Nota de criterio técnico

Esta feature puede aportar mucho valor al producto porque reduce fricción en la introducción de datos de la vivienda y mejora la trazabilidad del análisis. Pero también puede introducir deuda si se integra rápido y mal.

Prioridad real:

1. No romper el flujo actual.
2. Integrar Catastro como ayuda opcional.
3. Mantener datos internos consistentes.
4. Evitar dependencia directa de servicios externos en UI.
5. Dejar la base preparada para ampliar mapa, documentos y validación avanzada en fases posteriores.

