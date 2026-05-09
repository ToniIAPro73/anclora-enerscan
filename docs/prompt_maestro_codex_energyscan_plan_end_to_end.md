# Prompt maestro para Codex — Implementación end-to-end del plan de mejora de Anclora EnergyScan

## Contexto

Estás trabajando en el repositorio de **Anclora EnergyScan**, una aplicación Premium del ecosistema Anclora Group orientada al **prediagnóstico energético orientativo de viviendas**.

El producto sigue un flujo principal:

`wizard → API → scoring → resultados → PDF premium`

Stack actual esperado:

- Next.js 14 con App Router.
- TypeScript.
- Prisma + SQLite/libsql.
- React Hook Form + Zod.
- `@react-pdf/renderer` para generación de PDF.
- Sistema de scoring rule-based v2.
- Módulos existentes de dominio energético, normativa, simulador, providers, leads, adjuntos y demo assets.

El objetivo de esta tarea es implementar **end-to-end** el plan de mejora elaborado para consolidar el MVP, mejorar robustez técnica, actualizar normativa, reforzar el scoring, enriquecer el simulador, mejorar resultados/PDF y dejar una base preparada para fases futuras.

Importante: Anclora EnergyScan **no emite Certificados de Eficiencia Energética oficiales**. El producto debe posicionarse siempre como herramienta de **prediagnóstico orientativo**, apoyo informativo y generación de informes no oficiales.

---

## Objetivo general

Implementar una mejora integral del MVP de Anclora EnergyScan cubriendo:

1. Hardening normativo y legal.
2. Refactor del scoring a versión 2.1.
3. Mejora del motor regulatorio.
4. Enriquecimiento del simulador de mejoras.
5. Bloque informativo de ayudas y subvenciones.
6. Robustez básica en leads y adjuntos.
7. Mejora de UX de resultados.
8. Mejora del informe PDF premium.
9. Tests unitarios y de integración mínimos.
10. Documentación SDD de la ejecución.

La implementación debe ser incremental, segura y verificable, evitando romper el flujo actual del MVP.

---

## Rama de trabajo

Crea una rama nueva desde `main`:

```bash
git checkout main
git pull
git checkout -b feat/energyscan-plan-end-to-end
```

No trabajes directamente sobre `main`.

---

## Alcance prioritario

Implementa principalmente **Fase 0** y una primera versión práctica de **Fase 1**.

No implementes todavía Stripe real, autenticación completa, parser productivo de CEE ni modelos ML. Deben quedar documentados como fases futuras, pero fuera del alcance de esta tarea salvo que ya existan estructuras preparadas y sólo sea necesario no romperlas.

---

## Fase 0 — Hardening inmediato

### 1. Actualización normativa y legal

Revisa y actualiza todos los textos normativos en:

- `src/lib/regulatory.ts`
- README si contiene disclaimers legales.
- Textos visibles en UI relacionados con el carácter orientativo del informe.
- Textos legales o disclaimers del PDF.

Cambios obligatorios:

- Sustituir cualquier referencia a la EPBD como “borrador” por una redacción actualizada: la **Directiva (UE) 2024/1275** está en vigor como marco europeo.
- Diferenciar claramente:
  - Marco europeo vigente.
  - Transposición española pendiente o sujeta a actualización normativa.
  - Certificación oficial regulada en España por el **Real Decreto 390/2021**.
- Reforzar que EnergyScan no sustituye a un CEE oficial ni tiene validez administrativa.
- Evitar cualquier copy que sugiera emisión oficial, certificación regulada o garantía de cumplimiento legal.

Redacción orientativa:

> Anclora EnergyScan ofrece un prediagnóstico energético orientativo basado en los datos aportados por el usuario y reglas técnicas de estimación. No sustituye al Certificado de Eficiencia Energética oficial regulado por el Real Decreto 390/2021 ni tiene validez administrativa. Las referencias a la Directiva (UE) 2024/1275 y a la evolución normativa europea se incluyen como contexto informativo y pueden variar según su transposición y desarrollo normativo en España.

---

### 2. Refactor de scoring v2.1

Refactoriza `calculateScoreV2` o el módulo equivalente en `src/lib/scoring.ts` para separar las reglas en módulos claros.

Estructura recomendada:

```ts
type ScoreRuleContext = {
  property: PropertyDataV2;
  climateZone?: string | null;
};

type ScoreRule = {
  id: string;
  category: 'envelope' | 'systems' | 'renewables' | 'climate' | 'typology' | 'data_quality';
  label: string;
  apply: (context: ScoreRuleContext) => ScoreRuleResult | null;
};

type ScoreRuleResult = {
  delta: number;
  reason: string;
  type: 'penalty' | 'bonus' | 'neutral';
};
```

Crea arrays separados, por ejemplo:

- `envelopeRules`
- `systemRules`
- `renewableRules`
- `climateRules`
- `typologyRules`
- `dataQualityRules`

Requisitos:

- Mantener compatibilidad con el shape actual de `ScoreResultV2`, salvo que sea imprescindible ampliar tipos.
- No cambiar la API pública sin adaptar todos los consumidores.
- Mantener clamping 0–100.
- Mantener mapeo a letra energética.
- Mantener explicación de penalizaciones, fortalezas y confianza.
- Añadir trazabilidad por categoría si no existe.
- Facilitar tests unitarios por reglas.

---

### 3. Tests de scoring

Completa o crea tests en:

- `tests/scoring-v2.test.ts`
- o ubicación equivalente ya usada por el proyecto.

Casos mínimos obligatorios:

1. Código postal desconocido o clima no resoluble.
2. Datos mínimos válidos.
3. Vivienda muy nueva con bomba de calor y fotovoltaica.
4. Vivienda antigua sin aislamiento ni renovables.
5. Vivienda con ventanas mejoradas pero sistema térmico fósil.
6. Vivienda con renovables pero envolvente deficiente.
7. Validación de clamping inferior y superior.
8. Validación de explicación de penalizaciones y fortalezas.

Los tests no deben ser frágiles por valores exactos si el scoring actual es heurístico. Usa rangos razonables cuando sea mejor.

---

### 4. Robustez de adjuntos

Localiza la lógica de carga, persistencia o gestión de adjuntos.

Implementa validaciones básicas:

- Tamaño máximo por archivo.
- Tamaño total máximo por assessment.
- Extensiones permitidas.
- MIME types permitidos.
- Rechazo explícito con error claro.

Tipos permitidos sugeridos:

- PDF.
- JPG/JPEG.
- PNG.
- WEBP si ya se usa en el proyecto.

Constantes sugeridas:

```ts
MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
```

Asegúrate de no romper los demo assets existentes.

---

### 5. Robustez de leads

Revisa `POST /api/leads`.

Implementa mejoras mínimas sin añadir servicios externos obligatorios:

- Logging estructurado de errores.
- Registro claro de cuándo se usa fallback no persistente.
- Validación estricta del payload con Zod.
- Protección básica anti-spam si es viable sin infraestructura adicional.
- Respuestas consistentes de error.

Si se implementa rate limiting en memoria, debe estar claramente marcado como **dev/MVP only** y no como solución productiva definitiva.

No bloquees el flujo si la base de datos falla, salvo que el comportamiento actual ya lo requiera. Respeta el fallback existente, pero hazlo más observable.

---

## Fase 1 — Producto orientado a usuario final

### 6. Motor normativo v1.1

Extiende `REGULATORY_TIMELINE` o crea una estructura equivalente con campos más ricos.

Modelo sugerido:

```ts
type RegulatoryJurisdiction = 'EU' | 'ES' | 'AUTONOMIC' | 'LOCAL';

type RegulatoryTimelineItem = {
  id: string;
  title: string;
  dateLabel: string;
  status: 'current' | 'upcoming' | 'future' | 'informative';
  riskLevel: 'low' | 'medium' | 'high';
  jurisdiction: RegulatoryJurisdiction;
  legalReference: string;
  url?: string;
  impactOnUser: string;
  disclaimer?: string;
};
```

Debe incluir, como mínimo:

- Real Decreto 390/2021.
- Directiva (UE) 2024/1275.
- PNIEC como referencia estratégica/informativa si ya existe contexto en el proyecto.
- Horizonte 2030/2033 asociado a presión regulatoria europea, sin convertirlo en obligación individual directa si no procede.
- Objetivo 2050 Net Zero como contexto de largo plazo.

El resultado/PDF debe mostrar estos datos de forma comprensible para usuario no técnico.

---

### 7. Simulador de mejoras v1.1

Revisa `src/lib/simulator.ts`.

Mejora los escenarios para que sean más útiles y accionables.

Medidas mínimas a contemplar:

- Mejora de aislamiento/envolvente.
- Sustitución de ventanas.
- Sustitución de caldera fósil por bomba de calor/aerotermia.
- Instalación fotovoltaica.
- Solar térmica para ACS si encaja con el modelo actual.
- Reforma profunda combinada: envolvente + bomba de calor + fotovoltaica.

Cada escenario debería incluir, si el modelo lo permite:

```ts
type ImprovementScenario = {
  id: string;
  title: string;
  description: string;
  measures: string[];
  estimatedScoreDelta?: number;
  estimatedLetterImprovement?: string;
  complexity: 'low' | 'medium' | 'high';
  investmentRange?: 'low' | 'medium' | 'high';
  priority: 'recommended' | 'optional' | 'long_term';
  rationale: string;
  disclaimers?: string[];
};
```

No inventes ahorros económicos exactos si no existe una base de cálculo en el repo. Puedes usar rangos cualitativos.

---

### 8. Ayudas y subvenciones — capa informativa

Añade una sección informativa en resultados y PDF:

**“Ayudas y subvenciones potencialmente relevantes”**

Debe incluir referencias de alto nivel a:

- Programas estatales o autonómicos para autoconsumo y almacenamiento derivados del marco del RD 477/2021 o sucesores.
- Programas IDAE relacionados con renovables, rehabilitación energética o bombas de calor, cuando se presenten como información general.
- Posibles deducciones fiscales o bonificaciones municipales como categoría general, sin prometer disponibilidad.

Modelo sugerido:

```ts
type SubsidyInfoItem = {
  id: string;
  title: string;
  scope: 'state' | 'regional' | 'local' | 'eu';
  appliesTo: string[];
  description: string;
  eligibilityDisclaimer: string;
  referenceUrl?: string;
};
```

Reglas:

- No afirmar elegibilidad automática.
- No prometer importes.
- No mostrar convocatorias como vigentes si no hay verificación dinámica.
- Presentarlo como orientación informativa y remitir a fuentes oficiales.

---

### 9. UX de resultados

Revisa `src/app/assessment/[id]/page.tsx` y componentes relacionados.

La vista de resultados debe separar claramente:

- Letra estimada.
- Score.
- Nivel de confianza.
- Factores que penalizan.
- Factores que ayudan.
- Brecha regulatoria / timeline.
- Escenarios de mejora.
- Ayudas potencialmente relevantes.
- Adjuntos aportados.
- Proveedores/marketplace si ya está integrado.
- CTA de descarga de PDF.

No satures la pantalla. Prioriza jerarquía visual y mobile-first.

Si existen componentes reutilizables, no dupliques lógica.

---

### 10. PDF premium

Revisa `EnerScanReport.tsx` o la plantilla equivalente.

El PDF debe incluir:

1. Portada con marca Anclora EnergyScan.
2. Disclaimer claro de carácter orientativo.
3. Resumen ejecutivo.
4. Datos principales de la vivienda.
5. Resultado energético estimado.
6. Confianza del análisis.
7. Factores de penalización y fortalezas.
8. Timeline regulatorio actualizado.
9. Escenarios de mejora.
10. Ayudas y subvenciones potencialmente relevantes.
11. Proveedores o siguientes pasos si ya existe marketplace.
12. Anexos documentales.
13. Anexos con imágenes si existen assets asociados.
14. Pie de página con marca, disclaimer breve y numeración si ya está soportado.

Condición importante:

- Si se incluye un certificado demo o simulado, debe indicar claramente que es **documento de prueba/simulación sin validez oficial**.
- No debe parecer un CEE oficial real emitido por técnico competente.

---

## Documentación SDD obligatoria

Crea una carpeta de feature:

```txt
sdd/features/energyscan-plan-end-to-end/
```

Incluye al menos:

```txt
feature-energyscan-plan-end-to-end-index.md
feature-energyscan-plan-end-to-end-spec-v1.md
test-plan-v1.md
execution-report.md
GATE_FINAL.md
```

Contenido mínimo:

### `feature-energyscan-plan-end-to-end-index.md`

- Nombre de la feature.
- Objetivo.
- Estado.
- Archivos principales afectados.
- Relación con el plan de mejora.

### `feature-energyscan-plan-end-to-end-spec-v1.md`

- Contexto.
- Alcance.
- Fuera de alcance.
- Cambios funcionales.
- Cambios técnicos.
- Riesgos.
- Decisiones tomadas.

### `test-plan-v1.md`

- Tests unitarios de scoring.
- Tests de normativa si aplica.
- Tests de simulador si aplica.
- Validación manual de wizard → results → PDF.
- Validación mobile básica.
- Validación de adjuntos.
- Validación de leads.

### `execution-report.md`

- Qué se ha implementado.
- Qué no se ha implementado y por qué.
- Comandos ejecutados.
- Resultado de tests/build.
- Riesgos pendientes.

### `GATE_FINAL.md`

Checklist obligatorio:

```md
# GATE FINAL — EnergyScan Plan End-to-End

- [ ] Rama creada desde main.
- [ ] Normativa actualizada.
- [ ] Disclaimers revisados en UI/PDF/README.
- [ ] Scoring refactorizado a reglas modulares.
- [ ] Tests de scoring ampliados.
- [ ] Adjuntos con validaciones básicas.
- [ ] Leads con logging/fallback más observable.
- [ ] Timeline regulatorio enriquecido.
- [ ] Simulador de mejoras ampliado.
- [ ] Sección de ayudas informativas añadida.
- [ ] Vista de resultados revisada.
- [ ] PDF premium actualizado.
- [ ] SDD creado.
- [ ] `npm test` ejecutado.
- [ ] `npm run build` ejecutado.
- [ ] Riesgos pendientes documentados.
```

---

## Criterios de aceptación funcional

La tarea se considera válida si:

1. El wizard sigue permitiendo crear un assessment.
2. La página de resultados carga correctamente.
3. El score se calcula sin errores.
4. El resultado explica penalizaciones y fortalezas.
5. La normativa ya no aparece como borrador de EPBD.
6. El usuario entiende que el informe no es un CEE oficial.
7. El PDF se genera correctamente.
8. El PDF contiene el nuevo bloque normativo.
9. El PDF contiene escenarios de mejora.
10. El PDF contiene ayudas potencialmente relevantes con disclaimer.
11. Los adjuntos inválidos se rechazan de forma clara.
12. Los leads siguen funcionando o mantienen fallback observable.
13. Los tests principales pasan.
14. El build de producción pasa.
15. La documentación SDD refleja lo realizado.

---

## Criterios de aceptación técnica

- No introducir dependencias innecesarias.
- No romper tipos TypeScript.
- No duplicar lógica de scoring entre UI y backend.
- No hardcodear textos normativos dispersos si puede centralizarse en `regulatory.ts`.
- No introducir llamadas externas obligatorias para ayudas o normativa en esta fase.
- No implementar scraping.
- No implementar Stripe real en esta feature.
- No implementar autenticación completa en esta feature.
- No convertir el informe en un documento que pueda confundirse con un CEE oficial.

---

## Comandos de validación obligatorios

Ejecuta los comandos disponibles en el repo. Como mínimo intenta:

```bash
npm test
npm run build
```

Si existen comandos específicos, ejecútalos también:

```bash
npm run lint
npm run typecheck
```

Si algún comando no existe, documentarlo en `execution-report.md`.

Si algún test falla por deuda previa no relacionada, documentar:

- Test fallido.
- Motivo.
- Por qué no está relacionado.
- Riesgo.
- Recomendación.

No ocultes fallos.

---

## Orden recomendado de implementación

1. Inspeccionar estructura actual del repo.
2. Crear rama.
3. Revisar `src/lib/regulatory.ts`, `src/lib/scoring.ts`, `src/lib/simulator.ts` y tipos de dominio.
4. Actualizar normativa y disclaimers.
5. Refactorizar scoring.
6. Añadir/ampliar tests de scoring.
7. Mejorar simulador.
8. Añadir modelo informativo de ayudas.
9. Adaptar vista de resultados.
10. Adaptar PDF.
11. Robustecer adjuntos.
12. Robustecer leads.
13. Crear documentación SDD.
14. Ejecutar tests/build.
15. Corregir errores.
16. Actualizar `execution-report.md` y `GATE_FINAL.md`.
17. Mostrar resumen final con archivos modificados, comandos y estado.

---

## Restricciones legales y de producto

Usa siempre estas reglas:

- EnergyScan es orientativo.
- No sustituye a un técnico certificador.
- No emite certificado oficial.
- No garantiza elegibilidad a ayudas.
- No garantiza ahorro económico exacto.
- No convierte referencias europeas en obligaciones individuales directas sin desarrollo nacional.
- No debe generar riesgo de confusión con documentos administrativos oficiales.

---

## Salida esperada de Codex

Al finalizar, devuelve:

1. Resumen ejecutivo de cambios.
2. Rama usada.
3. Archivos modificados.
4. Nuevos archivos creados.
5. Tests ejecutados y resultado.
6. Build ejecutado y resultado.
7. Riesgos o deuda pendiente.
8. Próximo paso recomendado.

No devuelvas sólo explicación. Debes modificar el código y dejar la feature implementada en el repositorio.

---

## Nota final

Prioriza una implementación sólida, simple y mantenible frente a una implementación ambiciosa pero frágil. El objetivo es que Anclora EnergyScan pueda usarse como demo premium creíble para early adopters, partners y validación inicial de producto.

