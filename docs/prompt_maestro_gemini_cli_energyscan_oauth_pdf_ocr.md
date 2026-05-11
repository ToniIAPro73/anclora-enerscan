# Prompt maestro para Gemini CLI — Anclora EnergyScan: cerrar trabajo incompleto de Codex + OCR end-to-end

## Contexto operativo

Estás trabajando en el repositorio local:

```bash
/home/toni/projects/anclora-energyscan
```

Proyecto: **Anclora EnergyScan**, aplicación Premium del ecosistema Anclora Group para prediagnóstico energético orientativo de viviendas.

Stack actual esperado:

- Next.js 14 App Router.
- TypeScript strict.
- Prisma 7 + Neon/PostgreSQL.
- Auth.js / NextAuth v5 beta.
- `@react-pdf/renderer` para generar el informe PDF Premium.
- Adjuntos vía Vercel Blob si existe `BLOB_READ_WRITE_TOKEN`, con fallback local.
- Scoring rule-based, resultados, PDF Premium, demo assets, providers/leads y estimaciones económicas ya implementados.

Regla de producto no negociable:

> Anclora EnergyScan no genera Certificados de Eficiencia Energética oficiales. Es una herramienta de prediagnóstico energético orientativo. Todo contenido extraído de documentos debe presentarse como dato aportado o extraído, no como certificación ni validación oficial.

## Situación heredada de Codex

El usuario pidió a Codex:

> “Ya he metido las variables de Google y GitHub OAuth pero siguen sin activarse sus botones. Además, en el PDF no se muestra el contenido del certificado energético que he subido.”

Codex empezó a trabajar y se quedó sin tokens.

Lo que alcanzó a hacer:

1. Revisó `src/auth.ts`, `src/app/auth/actions.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/pdf/EnerScanReport.tsx`, `package.json` y búsquedas relacionadas con PDF/OAuth.
2. Verificó documentación actual de Auth.js.
3. Detectó que Auth.js espera variables tipo:
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
4. Propuso hacer el código más tolerante con aliases habituales:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `NEXTAUTH_URL` si aplica.
5. Confirmó que el pipeline actual del PDF intenta rasterizar PDFs del CEE con `pdfjs-dist` + `@napi-rs/canvas` y fallback a `pdftoppm`.
6. Reprodujo localmente que `pdfjs-dist` puede fallar al renderizar el CEX/CEE por problemas de fuentes estándar.
7. Concluyó correctamente que en Vercel no se debe depender de `pdftoppm`.
8. Decidió que la solución fiable para mostrar el CEE en el PDF Premium es **anexar las páginas originales del PDF subido al final del informe usando `pdf-lib`**, preservando el contenido exacto.
9. Ejecutó `npm install pdf-lib`.
10. Modificó `package.json` y `package-lock.json`.
11. Creó `src/lib/auth-env.ts`.
12. No terminó la integración.

Tu primera tarea es inspeccionar el estado actual real del repo y cerrar correctamente ese trabajo incompleto antes de implementar OCR.

---

## Objetivo general

Implementar en dos bloques secuenciales:

1. **Bloque A — Reparación inmediata**
   - Activar correctamente botones OAuth Google/GitHub cuando las variables estén configuradas.
   - Corregir el PDF Premium para que el certificado energético subido por el usuario se incluya con su contenido real, no como resumen vacío ni como rasterización frágil.
   - Cerrar, limpiar o completar los cambios parciales de Codex: `package.json`, `package-lock.json`, `src/lib/auth-env.ts` y cualquier archivo relacionado.

2. **Bloque B — OCR end-to-end**
   - Implementar extracción OCR/documental para PDFs de CEE, presupuestos y fotos de instalaciones.
   - Persistir estado y resultado OCR en base de datos.
   - Exponer endpoints internos.
   - Integrarlo en UI, PDF y documentación.
   - Mantener el flujo actual sin bloquear la creación del assessment.

No avances al Bloque B hasta que el Bloque A esté resuelto y validado.

---

## Rama de trabajo

Primero inspecciona el estado actual:

```bash
cd /home/toni/projects/anclora-energyscan
git status --short
git branch --show-current
git log --oneline --decorate -5
```

Después crea una rama nueva desde la rama actual estable, salvo que ya exista una rama específica en curso:

```bash
git checkout main
git pull --ff-only
git checkout -b feat/energyscan-oauth-pdf-ocr
```

Si hay cambios sin commit heredados de Codex, no los borres. Analízalos, intégralos si son correctos o corrígelos dejando constancia en el execution report.

---

# BLOQUE A — Reparación inmediata

## A1. OAuth Google/GitHub: diagnóstico y corrección

### Archivos a revisar

Revisa como mínimo:

```txt
src/auth.ts
src/lib/auth-env.ts
src/app/auth/AuthForm.tsx
src/app/auth/actions.ts
src/app/api/auth/[...nextauth]/route.ts
src/types/next-auth.d.ts
.env.example
README.md
```

Busca también cualquier uso de:

```txt
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
NEXTAUTH_URL
AUTH_URL
NEXT_PUBLIC_APP_URL
```

### Problema esperado

Los botones sociales pueden no activarse porque la UI probablemente depende de una detección incompleta de variables, o porque `NextAuth` está usando providers no configurados explícitamente.

### Implementación esperada

Crea o completa `src/lib/auth-env.ts` como fuente única de verdad para OAuth:

```ts
type OAuthProviderStatus = {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  missing: string[];
};

export function getOAuthEnv() {
  const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;

  return {
    google: {
      enabled: Boolean(googleClientId && googleClientSecret),
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      missing: [
        !googleClientId ? 'AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID' : null,
        !googleClientSecret ? 'AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET' : null,
      ].filter(Boolean) as string[],
    },
    github: {
      enabled: Boolean(githubClientId && githubClientSecret),
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      missing: [
        !githubClientId ? 'AUTH_GITHUB_ID or GITHUB_CLIENT_ID' : null,
        !githubClientSecret ? 'AUTH_GITHUB_SECRET or GITHUB_CLIENT_SECRET' : null,
      ].filter(Boolean) as string[],
    },
  } satisfies Record<'google' | 'github', OAuthProviderStatus>;
}
```

Ajusta `src/auth.ts` para configurar providers explícitamente y solo incluirlos cuando están completos:

```ts
const oauth = getOAuthEnv();

const providers = [
  oauth.google.enabled
    ? Google({
        clientId: oauth.google.clientId!,
        clientSecret: oauth.google.clientSecret!,
      })
    : null,
  oauth.github.enabled
    ? GitHub({
        clientId: oauth.github.clientId!,
        clientSecret: oauth.github.clientSecret!,
      })
    : null,
  Credentials(...),
].filter(Boolean);
```

No dejes providers OAuth incompletos dentro del array.

### Endpoint de estado OAuth

Si la UI necesita saber si mostrar o activar botones, crea o corrige un endpoint interno seguro:

```txt
src/app/api/auth/providers-status/route.ts
```

Debe devolver solo booleans y nombres de providers, nunca secretos:

```json
{
  "google": { "enabled": true },
  "github": { "enabled": true }
}
```

Alternativa válida: calcular el estado en Server Component y pasarlo al formulario. Escoge la opción más simple y mantenible según la arquitectura actual.

### UI Auth

En `src/app/auth/AuthForm.tsx`:

- Los botones de Google y GitHub deben aparecer habilitados si el provider está configurado.
- Si no está configurado, pueden mostrarse deshabilitados con texto claro o directamente ocultarse. Prioridad: claridad.
- No debe exponerse ningún secreto al cliente.
- No debe depender de `NEXT_PUBLIC_*` para saber si OAuth está activo.

### `.env.example` y README

Actualiza `.env.example` y README con una sección precisa:

```env
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Aliases compatibles, opcionales:
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

Incluye callback URLs esperadas:

```txt
Local Google: http://localhost:3000/api/auth/callback/google
Local GitHub: http://localhost:3000/api/auth/callback/github
Vercel Google: https://<dominio-vercel-o-custom>/api/auth/callback/google
Vercel GitHub: https://<dominio-vercel-o-custom>/api/auth/callback/github
```

### Tests mínimos OAuth

Añade tests unitarios para `getOAuthEnv()`:

```txt
tests/auth-env.test.ts
```

Casos mínimos:

- Sin variables: Google/GitHub disabled.
- Variables `AUTH_*`: enabled.
- Aliases `GOOGLE_CLIENT_*` / `GITHUB_CLIENT_*`: enabled.
- Falta secret: disabled y `missing` informa el campo.
- Nunca se devuelven secrets desde endpoint público.

---

## A2. PDF Premium: anexar CEE subido como PDF real con `pdf-lib`

### Problema actual

El repo actual intenta convertir el PDF subido a imágenes para incluirlo en `@react-pdf/renderer`. Ese camino es frágil porque:

- `pdfjs-dist` puede fallar con fuentes estándar o PDFs reales de certificados.
- `@napi-rs/canvas` añade complejidad nativa.
- `pdftoppm` no está garantizado en Vercel.
- El usuario necesita que el contenido real del CEE subido aparezca en el PDF final.

### Decisión técnica obligatoria

No rasterices el CEE para el PDF final.

Genera primero el informe principal con `@react-pdf/renderer` como ya hace el repo. Después usa `pdf-lib` para:

1. Cargar el PDF principal generado por React PDF.
2. Cargar cada PDF adjunto relevante, especialmente categoría `CEE`.
3. Copiar todas sus páginas originales.
4. Añadirlas al final del PDF principal.
5. Guardar y devolver el PDF combinado.

### Implementación sugerida

Crea un módulo específico:

```txt
src/lib/pdf/append-pdf-annex.ts
```

Con una función similar a:

```ts
import { PDFDocument } from 'pdf-lib';

export type PdfAnnex = {
  name: string;
  bytes: Buffer | Uint8Array;
  category?: string | null;
};

export async function appendPdfAnnexes(mainPdfBytes: Uint8Array, annexes: PdfAnnex[]) {
  const outputPdf = await PDFDocument.load(mainPdfBytes);

  for (const annex of annexes) {
    try {
      const sourcePdf = await PDFDocument.load(annex.bytes, { ignoreEncryption: true });
      const pages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      for (const page of pages) outputPdf.addPage(page);
    } catch (error) {
      // No rompas todo el informe por un adjunto corrupto.
      // Registra el error para observabilidad y sigue.
      console.error('Could not append PDF annex', { name: annex.name, error });
    }
  }

  return outputPdf.save();
}
```

Si quieres añadir una página separadora antes del CEE, hazlo dentro del PDF principal generado por `EnerScanReport.tsx`, indicando:

> “Anexo documental: certificado energético aportado por el usuario. Se incorpora tal como fue subido. Anclora EnergyScan no valida su autenticidad ni sustituye su registro oficial.”

No intentes modificar internamente el CEE original.

### Cambios en ruta PDF

Revisa:

```txt
src/app/api/assessment/[id]/pdf/route.ts
```

Refactor esperado:

1. Generar `reportData` como ahora.
2. Enriquecer imágenes/textos si aplica.
3. Renderizar PDF principal a bytes.
4. Buscar adjuntos PDF reales:
   - `attachment.type === 'application/pdf'`
   - o `attachment.name.toLowerCase().endsWith('.pdf')`
   - priorizar `category === 'CEE'`.
5. Leer bytes desde Blob o fallback local usando utilidades existentes.
6. Pasar esos bytes a `appendPdfAnnexes()`.
7. Devolver el PDF combinado.

### Eliminar o aislar lógica frágil

Revisa funciones actuales tipo:

```txt
renderPdfBytesToDataUris
renderPdfBytesWithPdftoppm
ceePagePreviews
```

Acción esperada:

- No deben usarse para PDFs reales en producción.
- Si se conservan para previews visuales demo, documenta que son best-effort y no esenciales.
- El PDF final debe funcionar aunque `pdfjs-dist`, canvas o `pdftoppm` fallen.

### Tests mínimos PDF

Añade tests unitarios para `appendPdfAnnexes`:

```txt
tests/pdf-annex.test.ts
```

Casos mínimos:

- PDF principal de 1 página + anexo de 2 páginas → resultado de 3 páginas.
- Anexo corrupto → no rompe generación del PDF principal.
- Múltiples anexos PDF → se anexan en orden.

Puedes usar `pdf-lib` para crear PDFs mínimos en memoria dentro del test.

### Validación manual PDF

Haz una prueba real con un PDF CEE de ejemplo del repo si existe en:

```txt
public/demo-assets/
public/demo-assets/property-demo/
```

O usa cualquier PDF de prueba ya presente. No añadas documentos privados reales al repo.

---

# BLOQUE B — OCR end-to-end

## B1. Objetivo OCR

Implementar una primera versión productiva-MVP de OCR/document intelligence para:

1. **PDF de CEE**
   - Extraer texto por página con `pdfjs-dist`.
   - Parsear datos energéticos básicos mediante regex y heurísticas.
   - No usar OCR de imagen si el PDF ya contiene texto.

2. **PDF de presupuesto**
   - Extraer texto.
   - Detectar importes, partidas, unidades, conceptos y proveedor si es posible.
   - `pdf-parse` es opcional. Si añade fricción, usa `pdfjs-dist` también para texto.

3. **Imágenes de instalaciones o documentación fotografiada**
   - Preprocesar con `sharp`.
   - OCR con `tesseract.js`.
   - Extraer texto y señales útiles: caldera, bomba de calor, aerotermia, placa, ventana, etiqueta, etc.

## B2. Dependencias permitidas

Evalúa primero lo ya instalado.

Dependencias aceptadas:

```bash
npm install tesseract.js sharp
```

`pdf-lib` ya debe estar instalado por el Bloque A.

`pdf-parse` es opcional. No lo añadas si `pdfjs-dist` resuelve suficiente.

No introduzcas servicios externos obligatorios ni APIs de pago.

## B3. Modelo de datos Prisma

Ampliar `AssessmentAttachment`:

```prisma
model AssessmentAttachment {
  id           String     @id @default(cuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  name         String
  type         String
  category     String?
  size         Int
  path         String
  createdAt    DateTime   @default(now())

  ocrStatus    String     @default("pending") // pending, processing, done, failed, skipped
  ocrData      Json?
  ocrProcessedAt DateTime?
  ocrError     String?
}
```

Crea migración Prisma:

```bash
npx prisma migrate dev --name add_attachment_ocr
```

Si el entorno local no permite conectar a Postgres, crea manualmente la carpeta de migración siguiendo el estilo del repo y valida con:

```bash
npx prisma validate
npx prisma generate
```

Actualiza cualquier script de migración heredada, especialmente:

```txt
scripts/migrate-sqlite-to-neon.ts
```

para no romper al crear `AssessmentAttachment`.

## B4. Tipos OCR

Crear:

```txt
src/lib/ocr/types.ts
```

Tipos mínimos:

```ts
export type OcrStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

export type OcrSourceKind = 'cee_pdf' | 'budget_pdf' | 'image' | 'unknown';

export type OcrResult = {
  sourceKind: OcrSourceKind;
  status: OcrStatus;
  text?: string;
  pages?: Array<{ pageNumber: number; text: string }>;
  confidence?: number;
  extracted?: CeeData | BudgetData | ImageOcrData;
  warnings?: string[];
  error?: string;
  processedAt: string;
};

export type CeeData = {
  certificateReference?: string;
  address?: string;
  municipality?: string;
  province?: string;
  cadastralReference?: string;
  buildingUse?: string;
  year?: number;
  areaM2?: number;
  energyLetter?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  emissionsLetter?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  primaryEnergyKwhM2Year?: number;
  emissionsKgCo2M2Year?: number;
  finalEnergyKwhM2Year?: number;
  heatingDemandKwhM2Year?: number;
  coolingDemandKwhM2Year?: number;
  issueDate?: string;
  expiryDate?: string;
  technicianName?: string;
  rawMatches?: Record<string, string>;
};

export type BudgetData = {
  providerName?: string;
  issueDate?: string;
  totalAmount?: number;
  currency?: 'EUR';
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    amount?: number;
  }>;
  detectedMeasures?: string[];
};

export type ImageOcrData = {
  detectedText?: string;
  detectedSignals?: string[];
  probableCategory?: 'heating' | 'cooling' | 'water_heating' | 'windows' | 'envelope' | 'renewables' | 'unknown';
};
```

## B5. Arquitectura de módulos OCR

Crear:

```txt
src/lib/ocr/
  index.ts
  types.ts
  pdf-extractor.ts
  image-ocr.ts
  cee-parser.ts
  budget-parser.ts
  attachment-classifier.ts
```

### `attachment-classifier.ts`

Debe decidir el tipo de documento:

- `category === 'CEE'` o nombre contiene `cee`, `certificado`, `energetic`, `energetico`, `cex` → `cee_pdf`.
- PDF que contiene `presupuesto`, `oferta`, `quote`, `invoice`, `factura` → `budget_pdf`.
- MIME image → `image`.
- Otro → `unknown`.

### `pdf-extractor.ts`

Usar `pdfjs-dist` para texto:

- Cargar bytes con `getDocument`.
- Recorrer páginas.
- `page.getTextContent()`.
- Unir `item.str`.
- Devolver texto por página y texto completo.

No uses canvas para OCR de PDF textual.

### `cee-parser.ts`

Parser heurístico para CEE español:

Debe intentar extraer:

- Letra de consumo energético.
- Letra de emisiones.
- Consumo de energía primaria no renovable kWh/m² año.
- Emisiones kgCO₂/m² año.
- Referencia catastral.
- Dirección / municipio / provincia si aparece.
- Superficie.
- Año construcción si aparece.
- Fecha de emisión y caducidad.
- Técnico certificador si aparece.

Debe ser tolerante con variaciones:

- `kWh/m² año`
- `kWh/m2 año`
- `kWh/m²·año`
- `kgCO2/m² año`
- decimales con coma o punto.

No fuerces campos si no hay match. Devuelve `warnings`.

### `budget-parser.ts`

Primera versión ligera:

- Detectar importes con regex.
- Detectar conceptos energéticos:
  - aerotermia
  - bomba de calor
  - ventanas
  - aislamiento
  - SATE
  - fotovoltaica
  - solar térmica
  - caldera
  - ACS
- Detectar total probable.
- No presentar importes como presupuesto validado.

### `image-ocr.ts`

Usar `sharp` para preprocesar:

- Convertir a escala de grises.
- Normalizar tamaño si es muy grande.
- Mejorar contraste si es razonable.

Luego `tesseract.js`:

- Idioma inicial: `spa+eng` si está disponible.
- Si da problemas de peso, usa `spa` o `eng` y documenta.
- Debe devolver texto y confianza.

No ejecutes OCR pesado automáticamente sobre todas las imágenes durante el POST principal si puede bloquear.

## B6. Orquestador OCR

Crear en `src/lib/ocr/index.ts`:

```ts
export async function processAttachmentOcr(input: {
  attachment: {
    id: string;
    name: string;
    type: string;
    category?: string | null;
    path: string;
  };
  bytes: Buffer;
}): Promise<OcrResult>;
```

Comportamiento:

- Si `ENABLE_OCR !== 'true'`, devolver `skipped`.
- Si demo asset, devolver mock fijo o `skipped` según convenga, pero no procesar OCR real.
- Clasificar adjunto.
- Procesar según tipo.
- Capturar errores y devolver `failed`, no lanzar errores no controlados salvo en errores de programación.

## B7. Endpoint OCR

Crear:

```txt
src/app/api/assessment/[id]/ocr/route.ts
```

### `GET`

Devuelve estado OCR de todos los adjuntos de un assessment:

```json
{
  "assessmentId": "...",
  "attachments": [
    {
      "id": "...",
      "name": "cee.pdf",
      "ocrStatus": "done",
      "ocrData": { ... },
      "ocrProcessedAt": "...",
      "ocrError": null
    }
  ]
}
```

### `POST`

Permite disparar OCR:

Payload opcional:

```json
{
  "attachmentId": "..."
}
```

Si no se indica `attachmentId`, procesa los adjuntos pendientes del assessment.

Reglas:

- Respetar `ENABLE_OCR=true`.
- Si está desactivado, responder claro con `skipped`.
- Actualizar estado:
  - `processing`
  - `done`
  - `failed`
  - `skipped`
- Leer bytes desde Blob o fallback local usando utilidades existentes.
- No bloquear ni romper el assessment si OCR falla.

### Timeout / Vercel

Añade, si procede:

```ts
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
```

Documenta que `tesseract.js` en Vercel Functions puede ser límite y que una fase posterior debería mover OCR a worker/queue.

## B8. Integración en creación de assessment

Revisa:

```txt
src/app/api/assessment/route.ts
```

No bloquees el POST principal.

Opciones aceptadas:

1. Dejar OCR manual vía endpoint y marcar adjuntos como `pending`.
2. Intentar OCR best-effort solo si `ENABLE_OCR_AUTO=true`, con timeout corto, sin bloquear errores.

Preferencia para MVP: opción 1.

Cuando se creen adjuntos, inicializa:

```ts
ocrStatus: process.env.ENABLE_OCR === 'true' ? 'pending' : 'skipped'
```

## B9. UI de resultados

Revisa:

```txt
src/app/assessment/[id]/page.tsx
src/components/AttachmentList.tsx
```

Añade visualización simple:

- Estado OCR por adjunto:
  - Pendiente.
  - Procesando.
  - Completado.
  - Fallido.
  - Desactivado.
- Botón “Analizar documento” o “Extraer datos” si OCR está activo.
- Mostrar datos extraídos del CEE si existen:
  - Letra energética detectada.
  - Consumo primario.
  - Emisiones.
  - Fecha/caducidad si aparece.
- Diferenciar claramente:
  - Datos declarados por usuario.
  - Datos extraídos del documento.
  - Estimación inferida por EnergyScan.

No satures la UI. Usa cards compactas.

## B10. Integración en PDF Premium

Revisa:

```txt
src/lib/pdf/EnerScanReport.tsx
src/app/api/assessment/[id]/pdf/route.ts
```

El PDF debe incluir una sección:

```txt
Datos extraídos de documentación aportada
```

Reglas:

- Si hay OCR CEE completado, mostrar resumen estructurado.
- Si OCR no está disponible, mostrar: “Documento aportado incluido en anexo. Extracción automática no disponible o no ejecutada.”
- No mezclar como dato oficial validado.
- Añadir disclaimer:

> “Los datos extraídos automáticamente pueden contener errores. Deben contrastarse con el documento original y, en su caso, con un técnico competente.”

Además, mantener el anexado real del PDF CEE original implementado en Bloque A.

## B11. Tests OCR

Añadir tests unitarios:

```txt
tests/ocr-cee-parser.test.ts
tests/ocr-budget-parser.test.ts
tests/ocr-attachment-classifier.test.ts
tests/pdf-annex.test.ts
tests/auth-env.test.ts
```

Casos mínimos CEE parser:

- Letra E detectada.
- Consumo `245 kWh/m² año` detectado.
- Emisiones `48 kgCO2/m² año` detectadas.
- Decimal con coma.
- Texto sin datos → no falla y devuelve warnings.

Casos mínimos budget parser:

- Detecta total en EUR.
- Detecta medidas como aerotermia, ventanas, aislamiento, fotovoltaica.
- Texto ambiguo → no inventa.

Casos classifier:

- PDF CEE por categoría.
- PDF CEE por nombre.
- Presupuesto por nombre.
- Imagen por MIME.
- Unknown.

Tests de endpoint si el setup actual lo permite. Si no, documenta validación manual.

## B12. Documentación SDD

Crear feature SDD:

```txt
sdd/features/energyscan-oauth-pdf-ocr/
  feature-energyscan-oauth-pdf-ocr-index.md
  feature-energyscan-oauth-pdf-ocr-spec-v1.md
  test-plan-v1.md
  execution-report.md
  GATE_FINAL.md
```

### `feature-energyscan-oauth-pdf-ocr-index.md`

Debe incluir:

- Objetivo.
- Estado.
- Archivos afectados.
- Relación con trabajo incompleto de Codex.
- Relación con roadmap Fase 2: parser automático de CEE y OCR.

### `feature-energyscan-oauth-pdf-ocr-spec-v1.md`

Debe incluir:

- Contexto.
- Alcance.
- Fuera de alcance.
- Decisiones técnicas.
- Riesgos.
- Contratos de producto.

### `test-plan-v1.md`

Debe incluir:

- OAuth.
- PDF annex.
- OCR parser.
- Endpoint OCR.
- UI resultados.
- PDF Premium.
- Build/lint/test.

### `execution-report.md`

Debe documentar:

- Estado inicial del repo.
- Cambios heredados de Codex encontrados.
- Qué se conservó.
- Qué se corrigió.
- Qué se eliminó o aisló.
- Comandos ejecutados.
- Resultado de tests/build.
- Riesgos pendientes.

### `GATE_FINAL.md`

Checklist obligatorio:

```md
# GATE FINAL — EnergyScan OAuth + PDF Annex + OCR

- [ ] Estado inicial del repo inspeccionado.
- [ ] Cambios parciales de Codex revisados.
- [ ] `src/lib/auth-env.ts` completado o corregido.
- [ ] OAuth Google se habilita si hay variables completas.
- [ ] OAuth GitHub se habilita si hay variables completas.
- [ ] UI de Auth no expone secretos.
- [ ] `.env.example` actualizado.
- [ ] README actualizado con callback URLs.
- [ ] `pdf-lib` integrado correctamente.
- [ ] CEE PDF subido se anexa como PDF original al informe final.
- [ ] PDF final no depende de `pdftoppm`.
- [ ] Lógica frágil de rasterización queda eliminada o best-effort no crítica.
- [ ] Modelo Prisma ampliado con campos OCR.
- [ ] Migración OCR creada.
- [ ] Módulo `src/lib/ocr` creado.
- [ ] Parser CEE implementado.
- [ ] Parser presupuesto implementado.
- [ ] OCR de imagen implementado con `sharp` + `tesseract.js`.
- [ ] Endpoint `GET/POST /api/assessment/[id]/ocr` creado.
- [ ] Creación de assessment no queda bloqueada por OCR.
- [ ] UI muestra estado y datos OCR.
- [ ] PDF muestra resumen OCR cuando existe.
- [ ] Disclaimers de datos extraídos añadidos.
- [ ] Tests OAuth añadidos.
- [ ] Tests PDF annex añadidos.
- [ ] Tests OCR añadidos.
- [ ] `npm test` ejecutado.
- [ ] `npm run lint` ejecutado si existe.
- [ ] `npm run build` ejecutado.
- [ ] `npx prisma validate` ejecutado.
- [ ] `npx prisma generate` ejecutado.
- [ ] Riesgos pendientes documentados.
```

---

## Criterios de aceptación funcional

La feature se considera aceptada si:

1. En local, con variables OAuth completas, los botones Google/GitHub aparecen activos.
2. Sin variables OAuth, la app no rompe y los botones no inducen a error.
3. El login por credenciales sigue funcionando.
4. La generación de PDF Premium sigue funcionando.
5. Si el usuario sube un PDF CEE, el PDF final incluye las páginas originales del CEE como anexo.
6. El PDF final no depende de `pdftoppm`.
7. El assessment se puede crear con adjuntos aunque OCR esté desactivado.
8. Con `ENABLE_OCR=true`, se puede ejecutar OCR vía endpoint.
9. El OCR de un CEE textual extrae al menos letra, consumo/emisiones si están en el texto.
10. El OCR de imagen no bloquea el flujo principal.
11. La UI diferencia dato declarado, dato OCR y dato inferido.
12. El PDF incluye resumen OCR si existe.
13. Tests principales pasan.
14. Build de producción pasa.
15. SDD refleja todo lo realizado.

---

## Criterios de aceptación técnica

- No exponer secretos en cliente ni logs.
- No usar `NEXT_PUBLIC_*` para secretos o estado sensible.
- No depender de binarios del sistema como `pdftoppm`.
- No romper compatibilidad con Vercel.
- No bloquear requests principales con OCR pesado.
- No introducir scraping ni servicios externos obligatorios.
- No inventar datos si OCR/parser no encuentra evidencia.
- No presentar OCR como validación oficial.
- No duplicar lógica de lectura de adjuntos: reutilizar `blob-storage` y utilidades existentes.
- Mantener TypeScript strict.
- Mantener diseño mobile-first.

---

## Comandos obligatorios

Ejecuta y documenta:

```bash
npm test
npm run lint
npm run build
npx prisma validate
npx prisma generate
```

Si `npm run lint` no existe o falla por deuda previa, documenta exactamente:

- Comando.
- Error.
- Si está relacionado o no.
- Riesgo.
- Recomendación.

No ocultes fallos.

---

## Orden recomendado de ejecución

1. Inspeccionar repo, rama, cambios sin commit y últimos commits.
2. Revisar cambios parciales de Codex: `package.json`, `package-lock.json`, `src/lib/auth-env.ts`.
3. Corregir OAuth y tests.
4. Validar UI Auth.
5. Implementar `pdf-lib` annex y tests.
6. Refactorizar ruta PDF para devolver PDF combinado.
7. Validar PDF con CEE real/demo.
8. Crear migración OCR.
9. Crear módulos OCR.
10. Crear endpoint OCR.
11. Integrar estado OCR en creación de adjuntos.
12. Integrar UI resultados.
13. Integrar resumen OCR en PDF.
14. Añadir tests OCR.
15. Actualizar `.env.example`, README y SDD.
16. Ejecutar validaciones.
17. Corregir errores.
18. Actualizar `execution-report.md` y `GATE_FINAL.md`.
19. Entregar resumen final.

---

## Salida final esperada de Gemini CLI

Devuelve un resumen claro con:

1. Rama usada.
2. Estado inicial encontrado.
3. Cambios parciales de Codex detectados.
4. Cambios implementados en OAuth.
5. Cambios implementados en PDF annex.
6. Cambios implementados en OCR.
7. Archivos modificados.
8. Archivos creados.
9. Migraciones creadas.
10. Tests ejecutados y resultado.
11. Build ejecutado y resultado.
12. Riesgos pendientes.
13. Próximo paso recomendado.

No devuelvas solo explicación. Debes modificar el código y dejar la feature implementada en el repositorio.

---

## Nota de cautela

Prioriza una solución sólida y simple. El problema del CEE en PDF no se arregla intentando que `pdfjs-dist` renderice mejor; se arregla anexando el PDF original con `pdf-lib`. El OCR es una capa adicional para extraer datos, no el mecanismo para preservar el documento original en el informe final.

