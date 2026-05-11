# Prompt maestro para Codex — Anclora EnergyScan: motor de presupuestos orientativos con referencias reales, BC3/BEDEC-ready y PDF Premium

## Rol

Actúa como agente Codex senior encargado de implementar una feature end-to-end en el repositorio **Anclora EnergyScan**.

Tu objetivo es convertir la app actual en una versión capaz de generar **estimaciones económicas orientativas más realistas** dentro del PDF Premium, tomando como base una arquitectura preparada para:

- catálogo interno de partidas,
- presupuestos reales o referencias de mercado normalizadas,
- fuentes técnicas tipo BEDEC/CYPE/PREOC/IVE/BCCA,
- futuro BC3/FIEBDC,
- trazabilidad por fuente,
- escenarios por salto energético,
- tipologías: vivienda unifamiliar, villa, piso, local comercial y comunidad de vecinos.

No debes convertir EnergyScan en un software oficial de certificación, ni en un ERP de obra, ni en un gestor BIM/MEP. La app sigue siendo un **prediagnóstico energético orientativo** con PDF Premium.

---

## Estado actual del repo comprobado

El repositorio aportado contiene una app funcional con esta base:

### Stack

- Next.js 14.2.35 con App Router.
- TypeScript strict.
- Prisma 7.8.0.
- PostgreSQL/Neon como datasource actual.
- Prisma Adapter para Auth.js/NextAuth.
- Auth.js/NextAuth beta con credenciales, Google/GitHub y recuperación por token.
- Vercel Blob para adjuntos pesados con fallback local.
- `@react-pdf/renderer` para PDF Premium.
- Jest + ts-jest.
- Tailwind CSS.
- Zod.

### Scripts relevantes

```json
{
  "dev": "next dev",
  "build": "next build",
  "lint": "next lint",
  "test": "jest",
  "db:generate": "prisma generate",
  "db:migrate:deploy": "prisma migrate deploy",
  "migrate:neon": "ts-node scripts/migrate-sqlite-to-neon.ts"
}
```

### Flujo funcional actual

```txt
Landing → Wizard → API assessment → scoring → resultados → PDF Premium
```

Archivos clave:

```txt
src/components/AssessmentWizard.tsx
src/app/api/assessment/route.ts
src/app/assessment/[id]/page.tsx
src/lib/scoring.ts
src/lib/simulator.ts
src/lib/regulatory.ts
src/lib/subsidies.ts
src/lib/pdf/EnerScanReport.tsx
src/lib/domain/energy-assessment.ts
src/lib/demo-assessment.ts
src/lib/demo-assets.ts
src/lib/attachments.ts
src/app/api/providers/route.ts
src/app/api/leads/route.ts
```

### Estado de dominio

El modelo `Assessment` ya guarda:

- objetivo,
- tipología,
- orientación,
- cubierta,
- año,
- superficie,
- código postal,
- calefacción,
- refrigeración,
- ACS,
- ventilación,
- ventanas,
- renovables,
- aislamiento fachada/cubierta,
- presupuesto orientativo,
- horizonte temporal,
- letra objetivo,
- resultados de scoring,
- penalizaciones,
- fortalezas,
- datos faltantes,
- adjuntos,
- leads.

El repo ya tiene partners/proveedores/leads y demo enriquecida con imágenes + CEE demo sin validez oficial.

### SDD existente

Ya existen features documentadas:

```txt
sdd/features/enerscan-v0-2-hardening/
sdd/features/enerscan-v0-3-ui-improvements/
sdd/features/energyscan-plan-end-to-end/
sdd/features/energyscan-partners-demo-assets-mobile-qa/
```

La feature `energyscan-plan-end-to-end` ya dejó implementado:

- normativa actualizada,
- scoring v2.1 modular,
- timeline regulatorio,
- simulador enriquecido,
- ayudas informativas,
- PDF Premium,
- adjuntos endurecidos,
- leads con fallback observable,
- Auth.js/NextAuth,
- Neon/Postgres,
- Blob.

Por tanto, **no repitas esa feature**. Esta nueva feature debe construirse sobre ella.

---

## Documentos analizados y decisiones extraídas

### 1. Presupuestos reales y escenarios PDF Premium

La app debe construir una **biblioteca de presupuestos orientativos por tipología y salto energético**.

Debe cubrir:

- vivienda unifamiliar,
- villa,
- piso,
- local comercial,
- comunidad de vecinos.

Debe permitir escenarios:

- salto de 1 letra,
- salto de 2 letras,
- salto de 3 letras,
- salto de 4 letras,
- actuación ligera,
- actuación media,
- actuación integral,
- rehabilitación profunda.

Rangos base útiles para seed MVP:

```txt
Reforma integral vivienda/casa de pueblo: 400–1.200 €/m²
Reforma vivienda media: 18.000–30.000 €
Reforma integral local simple: 300–700 €/m²
Local en bruto / acondicionamiento completo: 600–1.200 €/m²
Local comercial sencillo: 500–750 €/m²
Rehabilitación estructural/profunda: desde 1.400 €/m² en casos complejos
Fachada: 100–400 €/m²
Cubierta: 90–180 €/m²
Instalación eléctrica: 15–40 €/m²
Fontanería: 20–50 €/m²
Baño básico: 3.500–4.500 €
Baño medio: 5.000–7.000 €
Baño premium: 8.000–15.000 €
Terraza básica: 15–40 €/m²
Terraza media: 30–80 €/m²
Terraza integral: 80–150 €/m²
Terraza premium: >150 €/m²
```

Estos rangos son **seed inicial**, no fuente maestra definitiva.

### 2. Idea de producto validada

La idea correcta es que el PDF Premium incluya una nota de este tipo:

```txt
Estimación económica orientativa. El presupuesto mostrado en este informe ha sido calculado a partir de referencias reales de mercado y bases de precios técnicas de rehabilitación y construcción, normalizadas por Anclora EnergyScan y ajustadas según la tipología del inmueble, el alcance de la intervención y el escenario energético analizado. Este importe es orientativo, no constituye una oferta vinculante ni sustituye a un presupuesto emitido por un técnico, industrial o contratista tras visita y medición in situ.
```

Debe aparecer en PDF y, de forma resumida, en resultados.

### 3. Fuentes de precios recomendadas

Para España, la arquitectura debe preparar fuentes:

```txt
IVE — Base de Datos de Construcción
BCCA — Junta de Andalucía
Base de Precios de Extremadura 2026
Comunidad de Madrid — Base de precios
BEDEC / ITeC
CYPE Generador de Precios
PREOC / PREMETI
Índices públicos de costes de construcción
```

Estrategia recomendada:

- MVP: catálogo interno con 30–50 partidas base.
- Fase siguiente: importación controlada de BC3/CSV/PDF.
- Fase avanzada: ETL versionado con fuentes oficiales y privadas.

Evitar:

- scraping agresivo,
- precios sin fecha,
- blogs como fuente principal,
- presupuestos aislados como verdad maestra,
- llamadas en vivo a BEDEC/CYPE/PREOC desde el PDF.

### 4. BC3/FIEBDC

No integrar `bc3reader` como dependencia principal del core. Es antiguo y no encaja bien como pieza crítica.

Decisión técnica:

- Para MVP: no instalar parser BC3 si no se usa todavía.
- Preparar arquitectura `BC3/CSV/PDF → import run → normalizer → price tables`.
- Para futuro: preferir paquete TypeScript `bc3` o importador externo aislado.
- Si se usa `bc3reader`, hacerlo como adaptador externo/CLI, no dentro de las requests del usuario.

Modelo futuro recomendado:

```txt
bc3_import_runs
bc3_concepts
bc3_decompositions
source_mappings
price_sources
price_items
measure_price_map
estimate_runs
```

### 5. BEDEC / CYPE / PREOC

La forma correcta no es consultar una API pública en vivo, sino:

1. seleccionar partidas relevantes,
2. exportar/adaptar a BC3/FIEBDC, CSV o tabla interna,
3. normalizar,
4. versionar,
5. calcular offline desde la base interna.

Modelo mínimo:

```txt
price_sources
price_items
price_adjustments
energy_measures
measure_price_map
estimate_runs
estimate_lines
```

### 6. TeKton3D

Usar como referencia técnica, no como dependencia.

Ideas útiles:

- GUID persistente para elementos constructivos y partidas.
- Exportación BC3 con líneas de medición e IfcGuid para trazabilidad futura.
- Condiciones operacionales: ocupación, iluminación, equipos, ventilación, ACS, temperaturas.
- Energía generada y autoconsumida en usos EPB separada de otros consumos.
- Aerotermia doméstica con configuraciones: monobloc, bibloc conexión agua, bibloc conexión refrigerante y equipos mixtos.
- Recuperadores de calor y ventilación como medidas energéticas.
- MCP y GLB/GLTF quedan solo como roadmap, no se implementan ahora.

### 7. Bomba de calor / aerotermia

El documento de bomba de calor aporta información útil para copy técnico y reglas del simulador:

- La bomba de calor aprovecha energía del aire, agua o suelo y usa electricidad en cantidades reducidas.
- Tipos:
  - aire-aire,
  - aire-agua,
  - geotérmica,
  - híbrida.
- Una bomba de calor puede cubrir calefacción, refrigeración y ACS.
- COP orientativo: 3–4, es decir, produce 3–4 kWh térmicos por cada kWh eléctrico consumido.
- Ahorro potencial indicado: hasta 60–70% frente a sistemas convencionales, pero debe mostrarse como potencial, no garantía.
- Consumo aerotermia orientativo: 2.000–4.000 kWh/año, equivalente aproximado a 300–600 €/año según precio eléctrico.
- Más rentable en viviendas con buen aislamiento, casas unifamiliares con espacio, hogares que buscan climatización integral y climas templados/moderados.
- Limitaciones: inversión inicial elevada, menor rendimiento en climas muy fríos y necesidad de espacio para equipos, depósitos o perforaciones.

Usar esta información para enriquecer:

- medidas `install_heat_pump`,
- escenarios de sistemas,
- PDF Premium,
- disclaimers de ahorro,
- dependencias técnicas.

---

## Objetivo de esta feature

Implementar una feature nueva llamada:

```txt
energyscan-real-cost-estimates
```

Objetivo:

Crear la primera versión productiva del **motor de presupuestos orientativos reales** de Anclora EnergyScan, conectando:

```txt
medidas energéticas → partidas de precio → escenarios por tipología/salto de letra → estimación orientativa → resultados → PDF Premium → trazabilidad
```

---

## Rama de trabajo

Crea una rama nueva desde `main`:

```bash
git checkout main
git pull --ff-only
git checkout -b feat/energyscan-real-cost-estimates
```

No trabajes sobre `main`.

---

## Fase 0 — Inventario real antes de tocar código

### Tareas

1. Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
```

2. Revisa los archivos actuales:

```txt
prisma/schema.prisma
prisma/seed.ts
src/lib/simulator.ts
src/lib/scoring.ts
src/lib/regulatory.ts
src/lib/subsidies.ts
src/lib/domain/energy-assessment.ts
src/lib/pdf/EnerScanReport.tsx
src/app/assessment/[id]/page.tsx
src/app/api/assessment/route.ts
src/components/AssessmentWizard.tsx
src/lib/demo-assessment.ts
src/lib/demo-assets.ts
tests/regulatory-simulator-subsidies.test.ts
tests/scoring-v2.test.ts
```

3. Crea SDD:

```txt
sdd/features/energyscan-real-cost-estimates/
  feature-energyscan-real-cost-estimates-index.md
  feature-energyscan-real-cost-estimates-spec-v1.md
  test-plan-v1.md
  execution-report.md
  GATE_FINAL.md
```

4. Documenta que esta feature se apoya en `energyscan-plan-end-to-end` y `energyscan-partners-demo-assets-mobile-qa`.

### Criterios de aceptación

- Rama creada.
- Estado del repo documentado.
- SDD creado antes de cambios grandes.
- Fuera de alcance documentado.

---

## Fase 1 — Prisma: modelo de catálogo de precios, medidas y estimaciones

### Objetivo

Añadir persistencia para fuentes, partidas, mapeos y estimaciones generadas.

### Modelos Prisma sugeridos

Adapta nombres y relaciones al estilo real del repo. Como el datasource es PostgreSQL, puedes usar `Json` si encaja con Prisma 7 y el setup actual. Si prefieres mínima fricción, usa `String` con JSON serializado para campos flexibles.

```prisma
model PriceSource {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  name           String
  providerType   String   // INTERNAL_SEED, OFFICIAL_PUBLIC, TECHNICAL_PRIVATE, MARKET_REFERENCE, MANUAL, BC3_IMPORT, CSV_IMPORT
  sourceKind     String   // PRICE_DATABASE, REAL_QUOTE, MARKET_GUIDE, INDEX, INTERNAL
  versionLabel   String?
  region         String?  // ES, Baleares, Madrid, Andalucia, Extremadura...
  url            String?
  licenseNote    String?
  reliability    String   // LOW, MEDIUM, HIGH
  capturedAt     DateTime?
  validFrom      DateTime?
  validTo        DateTime?
  notes          String?

  items          PriceItem[]
}

model PriceItem {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  guid           String   @unique
  sourceId       String
  source         PriceSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  code           String
  externalCode   String?
  title          String
  description    String?
  unit           String   // m2, ud, ml, kW, fixed, percent
  minUnitPrice   Float
  midUnitPrice   Float?
  maxUnitPrice   Float
  currency       String   @default("EUR")
  region         String?
  category       String   // ENVELOPE, HVAC, RENEWABLE, VENTILATION, ACS, ELECTRICAL, PLUMBING, TERRACE, BATHROOM, LOCAL, COMMUNITY, STRUCTURE, OTHER
  applicableTo   String   // JSON array: FLAT, SINGLE_FAMILY, VILLA, LOCAL, COMMUNITY
  tags           String   // JSON array
  confidence     String   // LOW, MEDIUM, HIGH
  isActive       Boolean  @default(true)

  mappings       MeasurePriceMap[]
}

model EnergyMeasure {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  guid           String   @unique
  code           String   @unique
  title          String
  description    String?
  category       String   // ENVELOPE, HVAC, RENEWABLE, VENTILATION, ACS, DEEP_RETROFIT, LOCAL, COMMUNITY
  impactArea     String   // ENERGY_SCORE, COMFORT, RISK, MAINTENANCE, REGULATORY_GAP
  defaultPriority String  // RECOMMENDED, OPTIONAL, LONG_TERM
  complexity     String   // LOW, MEDIUM, HIGH
  typicalLetterGainMin Int?
  typicalLetterGainMax Int?
  isActive       Boolean  @default(true)

  priceMappings  MeasurePriceMap[]
}

model MeasurePriceMap {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  measureId       String
  priceItemId     String
  quantityFormula String   // floor_area_m2, window_area_m2, roof_area_m2, facade_area_m2, terrace_area_m2, local_area_m2, community_facade_area_m2, fixed_1, custom
  defaultFactor   Float    @default(1.0)
  minFactor       Float?
  maxFactor       Float?
  notes           String?

  measure         EnergyMeasure @relation(fields: [measureId], references: [id], onDelete: Cascade)
  priceItem       PriceItem @relation(fields: [priceItemId], references: [id], onDelete: Cascade)
}

model EstimateRun {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())

  assessmentId    String?
  assessment      Assessment? @relation(fields: [assessmentId], references: [id], onDelete: SetNull)

  scenarioId      String?
  scenarioTitle   String?
  propertyType    String?
  profile         String?  // PARTICULAR, PROFESIONAL, PARTNER, UNKNOWN
  letterGainTarget Int?

  currency        String   @default("EUR")
  minTotal        Float
  midTotal        Float?
  maxTotal        Float
  confidence      String
  sourceSummary   String?
  assumptions     String
  disclaimer      String

  lines           EstimateLine[]
}

model EstimateLine {
  id              String   @id @default(cuid())
  estimateRunId   String
  estimateRun     EstimateRun @relation(fields: [estimateRunId], references: [id], onDelete: Cascade)

  measureCode     String
  priceItemCode   String
  title           String
  unit            String
  quantity        Float
  minUnitPrice    Float
  midUnitPrice    Float?
  maxUnitPrice    Float
  minSubtotal     Float
  midSubtotal     Float?
  maxSubtotal     Float
  sourceLabel     String?
  confidence      String
  assumptions     String?
}
```

Además, añade relación opcional en `Assessment`:

```prisma
costEstimateRuns EstimateRun[]
```

### Migración

Crear migración:

```bash
npx prisma migrate dev --name energyscan_real_cost_estimates
```

Si el entorno local no tiene Postgres, documenta el bloqueo y crea la migración SQL manualmente solo si el flujo del repo lo permite. No inventes un PASS.

---

## Fase 2 — Seed inicial de fuentes, partidas y medidas

### Objetivo

Crear un catálogo MVP interno, idempotente y trazable.

### Archivos sugeridos

```txt
src/lib/costs/seed-data.ts
prisma/seed-price-catalog.ts
```

O integrar en `prisma/seed.ts` con cuidado, sin borrar partners/providers existentes.

### Regla importante

El `prisma/seed.ts` actual borra leads/providers/partners antes de sembrar. No añadas borrado agresivo de precios si no es necesario. Los seeds de precios deben ser **upsert idempotente por código/guid**.

### Fuentes seed mínimas

Crear estas fuentes:

```txt
ANCLORA_INTERNAL_COST_SEED_2026_05
providerType: INTERNAL_SEED
sourceKind: INTERNAL
reliability: MEDIUM

MARKET_REFORM_REFERENCE_2026_05
providerType: MARKET_REFERENCE
sourceKind: MARKET_GUIDE
reliability: LOW/MEDIUM

TECHNICAL_PRICE_DATABASE_PLACEHOLDER
providerType: TECHNICAL_PRIVATE
sourceKind: PRICE_DATABASE
reliability: HIGH
notes: Placeholder para BEDEC/CYPE/PREOC/IVE/BCCA normalizados en futuras ingestas.
```

### Energy measures seed

Crear medidas iniciales:

```txt
replace_windows
roof_insulation
facade_insulation
terrace_waterproofing
install_heat_pump_air_air
install_heat_pump_air_water
install_heat_pump_geothermal
install_hybrid_heat_pump
install_pv
install_solar_thermal_acs
install_heat_recovery_ventilation
electrical_upgrade
plumbing_upgrade
bathroom_efficiency_reform
local_hvac_lighting_upgrade
community_facade_rehab
community_roof_rehab
community_central_heating_upgrade
deep_energy_retrofit
```

### Price items seed mínimos

Crear partidas:

```txt
ENV_WINDOWS_DOUBLE_GLAZING_M2
ENV_ROOF_INSULATION_M2
ENV_FACADE_INSULATION_M2
ENV_TERRACE_WATERPROOFING_M2
HVAC_HEAT_PUMP_AIR_AIR_UNIT
HVAC_HEAT_PUMP_AIR_WATER_UNIT
HVAC_HEAT_PUMP_GEOTHERMAL_UNIT
HVAC_HYBRID_HEAT_PUMP_UNIT
REN_PV_BASIC_KWP
REN_SOLAR_THERMAL_ACS_UNIT
VENT_HEAT_RECOVERY_UNIT
ELEC_RENEWAL_M2
PLUMBING_RENEWAL_M2
BATHROOM_REFORM_BASIC_UNIT
BATHROOM_REFORM_MEDIUM_UNIT
BATHROOM_REFORM_PREMIUM_UNIT
LOCAL_REFORM_SIMPLE_M2
LOCAL_REFORM_FULL_M2
COMMUNITY_FACADE_REHAB_M2
COMMUNITY_ROOF_REHAB_M2
DEEP_RETROFIT_BASIC_M2
DEEP_RETROFIT_MEDIUM_M2
DEEP_RETROFIT_PREMIUM_M2
STRUCTURAL_REHAB_M2
CONTINGENCY_PERCENT
```

### Rangos seed orientativos

Usa estos rangos cuando apliquen:

```txt
LOCAL_REFORM_SIMPLE_M2: 300–700 €/m²
LOCAL_REFORM_FULL_M2: 600–1.200 €/m²
LOCAL_REFORM_LIGHT_M2 si lo creas: 500–750 €/m²
DEEP_RETROFIT_BASIC_M2: 400–600 €/m²
DEEP_RETROFIT_MEDIUM_M2: 600–900 €/m²
DEEP_RETROFIT_PREMIUM_M2: 900–1.200 €/m²
STRUCTURAL_REHAB_M2: 1.400–1.800 €/m² como rango inicial prudente
FACADE/COMMUNITY_FACADE_REHAB_M2: 100–400 €/m²
COMMUNITY_ROOF_REHAB_M2 / ROOF_RENOVATION: 90–180 €/m²
ELEC_RENEWAL_M2: 15–40 €/m²
PLUMBING_RENEWAL_M2: 20–50 €/m²
BATHROOM_REFORM_BASIC_UNIT: 3.500–4.500 €
BATHROOM_REFORM_MEDIUM_UNIT: 5.000–7.000 €
BATHROOM_REFORM_PREMIUM_UNIT: 8.000–15.000 €
ENV_TERRACE_WATERPROOFING_M2 o TERRACE_BASIC: 15–40 €/m²
TERRACE_MEDIUM: 30–80 €/m²
TERRACE_INTEGRAL: 80–150 €/m²
TERRACE_PREMIUM: 150–250 €/m²
```

Para ventanas, aislamiento, PV, aerotermia y ventilación, si no hay rango exacto fiable en documentos, define rangos internos prudentes marcados como `confidence: LOW/MEDIUM` y `source: ANCLORA_INTERNAL_COST_SEED_2026_05`. No simules precisión falsa.

---

## Fase 3 — Motor de cantidades y costes

### Objetivo

Crear el motor que calcula rangos económicos desde medidas.

### Archivos sugeridos

```txt
src/lib/costs/types.ts
src/lib/costs/quantity-resolver.ts
src/lib/costs/cost-engine.ts
src/lib/costs/cost-disclaimers.ts
src/lib/costs/source-summary.ts
src/lib/costs/scenario-matrix.ts
src/lib/costs/__tests__/quantity-resolver.test.ts
src/lib/costs/__tests__/cost-engine.test.ts
```

Si el repo centraliza tests en `/tests`, usa:

```txt
tests/cost-engine.test.ts
tests/quantity-resolver.test.ts
tests/scenario-cost-matrix.test.ts
```

### Tipos mínimos

```ts
export type CostConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type CostQuality = 'BASIC' | 'MEDIUM' | 'PREMIUM';
export type CostComplexity = 'LOW' | 'MEDIUM' | 'HIGH';
export type CostPropertyType = 'FLAT' | 'SINGLE_FAMILY' | 'VILLA' | 'LOCAL' | 'COMMUNITY' | 'UNKNOWN';

export type ResolvedQuantity = {
  formula: string;
  quantity: number;
  unit: string;
  confidence: CostConfidence;
  assumptions: string[];
};

export type CostEstimateLine = {
  measureCode: string;
  priceItemCode: string;
  title: string;
  unit: string;
  quantity: number;
  minUnitPrice: number;
  midUnitPrice?: number;
  maxUnitPrice: number;
  minSubtotal: number;
  midSubtotal?: number;
  maxSubtotal: number;
  sourceLabel?: string;
  confidence: CostConfidence;
  assumptions: string[];
};

export type ScenarioCostEstimate = {
  scenarioId: string;
  scenarioTitle: string;
  currency: 'EUR';
  minTotal: number;
  midTotal?: number;
  maxTotal: number;
  confidence: CostConfidence;
  lines: CostEstimateLine[];
  assumptions: string[];
  disclaimers: string[];
  sourceSummary: string;
};
```

### Quantity resolver MVP

Implementa fórmulas:

```txt
floor_area_m2 = assessment.area
local_area_m2 = assessment.area
roof_area_m2 = assessment.area para SINGLE_FAMILY/VILLA; 0 o baja confianza para FLAT salvo dato explícito
window_area_m2 = assessment.area * 0.15
facade_area_m2 = assessment.area * 0.8 para SINGLE_FAMILY/VILLA; para FLAT usar assessment.area * 0.25 con baja confianza
community_facade_area_m2 = assessment.area * 1.2 como proxy solo si propertyType COMMUNITY o se documenta baja confianza
terrace_area_m2 = si no existe dato específico, no calcular salvo escenario demo
fixed_1 = 1
kwp_estimated = min(max(assessment.area / 25, 2), 8) si cubierta viable
heat_pump_unit = 1
bathroom_unit = 1 solo si la medida aplica
```

Cada proxy debe añadir assumption explícita.

### Factores

```ts
qualityFactor = {
  BASIC: 0.85,
  MEDIUM: 1.0,
  PREMIUM: 1.25,
};

complexityFactor = {
  LOW: 0.9,
  MEDIUM: 1.0,
  HIGH: 1.2,
};

regionFactor = {
  ES: 1.0,
  BALEARES: 1.12,
  MALLORCA: 1.12,
  MADRID: 1.05,
  DEFAULT: 1.0,
};
```

No expandas provincias sin datos. Deja la tabla pequeña y extensible.

### Costes indirectos

Implementa opcionalmente:

```txt
contingency: 8–12%
technical/admin/indirect: 5–13%
VAT: no incluir por defecto salvo que se muestre como estimación separada
```

Para MVP, mejor mostrar:

```txt
Subtotal actuaciones
Rango con contingencia orientativa
IVA/licencias/impuestos: no incluidos salvo indicación expresa
```

### Reglas de seguridad

- Nunca devolver una cifra única sin rango.
- Nunca decir “presupuesto real cerrado”.
- Si faltan datos, bajar confianza y mostrar assumptions.
- Si una medida no aplica, no calcularla.
- Si `maxTotal < minTotal`, lanzar error o corregir.

---

## Fase 4 — Matriz de escenarios por salto energético y tipología

### Objetivo

Crear una matriz inicial para traducir mejoras a presupuesto orientativo.

### Archivo sugerido

```txt
src/lib/costs/scenario-matrix.ts
```

### Estructura sugerida

```ts
export type CostScenarioTemplate = {
  id: string;
  propertyTypes: CostPropertyType[];
  letterGainMin: number;
  letterGainMax: number;
  interventionLevel: 'LIGHT' | 'MEDIUM' | 'INTEGRAL' | 'DEEP';
  budgetLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM';
  measureCodes: string[];
  description: string;
  technicalNote: string;
};
```

### Templates mínimos

Crear 12–20 templates. Mínimos obligatorios:

```txt
flat_letter_gain_1_light
flat_letter_gain_2_medium
flat_letter_gain_3_deep
single_family_letter_gain_1_light
single_family_letter_gain_2_medium
single_family_letter_gain_3_deep
villa_letter_gain_2_premium
villa_letter_gain_4_deep
local_light_hvac_lighting
local_medium_hvac_envelope
local_full_reform
community_facade_roof_letter_gain_1_2
community_deep_rehab_letter_gain_3_4
```

### Lógica de selección

Crear función:

```ts
export function selectCostScenarioTemplates(input: {
  propertyType: CostPropertyType;
  currentLetter?: string;
  targetLetter?: string;
  simulatorScenarioId?: string;
  budgetRange?: string;
}): CostScenarioTemplate[]
```

Debe mapear:

- `simulator.ts` actual: envelope, systems, renewables, deep.
- salto estimado según `estimatedLetterImprovement` cuando exista.
- presupuesto del wizard si existe.

---

## Fase 5 — Integración con `src/lib/simulator.ts`

### Objetivo

El simulador ya genera escenarios con campos cualitativos. Hay que enriquecerlos con coste orientativo calculado.

### Tareas

1. Revisar el tipo real de `ImprovementScenario`.
2. Añadir campo opcional:

```ts
costEstimate?: ScenarioCostEstimate;
```

O si no quieres acoplar tipos pesados:

```ts
costEstimateSummary?: {
  minTotal: number;
  midTotal?: number;
  maxTotal: number;
  confidence: string;
  sourceSummary: string;
};
```

3. Mapear escenarios actuales:

```txt
envelope → replace_windows, roof_insulation, facade_insulation
systems → install_heat_pump_air_water / install_heat_pump_air_air / install_hybrid_heat_pump
renewables → install_pv, install_solar_thermal_acs
deep → deep_energy_retrofit + envelope + heat pump + ventilation + renewables
```

4. Si el escenario ya incluye `estimatedCostRange: "Inversión media"`, conservarlo como texto cualitativo pero añadir rango económico si hay datos suficientes.

### Criterios

- No romper tests existentes de simulator.
- Si falla el motor de costes, el simulador debe seguir devolviendo escenarios cualitativos.
- Añadir tests.

---

## Fase 6 — Resultados UI

### Objetivo

Mostrar al usuario una sección de costes sin saturar.

### Archivo principal

```txt
src/app/assessment/[id]/page.tsx
```

Si hay componentes extraíbles, crear:

```txt
src/components/CostEstimateCard.tsx
src/components/ScenarioCostTable.tsx
```

### UI recomendada

Añadir bloque:

```txt
Estimación económica orientativa
```

Para cada escenario:

```txt
Escenario: Mejora de envolvente
Rango estimado: 8.500–18.400 €
Confianza: Media
Incluye: ventanas, aislamiento de fachada/cubierta
Basado en: catálogo interno Anclora + referencias de mercado normalizadas
Nota: no incluye visita técnica, licencias, impuestos ni presupuesto cerrado.
```

Añadir detalle desplegable o compacto:

```txt
Factores que pueden modificar el precio:
- superficie real de huecos,
- estado inicial,
- calidades,
- accesibilidad,
- ubicación,
- permisos,
- comunidad de propietarios,
- disponibilidad de materiales,
- visita técnica.
```

### Reglas UX

- No mostrar tabla de partidas enorme en pantalla principal.
- Mostrar rango y confianza.
- El detalle completo va mejor en PDF.
- Mobile-first.

---

## Fase 7 — PDF Premium

### Objetivo

Actualizar `src/lib/pdf/EnerScanReport.tsx` para incluir presupuesto orientativo más sólido.

### Secciones nuevas o actualizadas

1. **Resumen económico por escenario**

```txt
Escenario
Salto estimado de letra
Nivel de intervención
Coste mínimo / recomendado / alto
Confianza
```

2. **Detalle de actuaciones estimadas**

Tabla ligera:

```txt
Medida | Unidad | Cantidad estimada | Rango unitario | Subtotal orientativo | Fuente/confianza
```

3. **Matriz de presupuestos posibles**

Mostrar tres niveles:

```txt
Conservador
Recomendado
Premium
```

4. **Nota de trazabilidad de precios**

Texto obligatorio:

```txt
Los importes orientativos se han estimado a partir de bases de precios técnicas y referencias de mercado del sector construcción en España, normalizadas por Anclora EnergyScan. Cada referencia se versiona internamente por fuente, fecha, ámbito geográfico y nivel de confianza. El resultado no constituye presupuesto cerrado ni oferta vinculante.
```

5. **Nota sobre fuentes futuras**

```txt
En futuras versiones, el catálogo podrá incorporar partidas normalizadas desde BC3/FIEBDC, BEDEC, CYPE, PREOC/PREMETI, IVE, BCCA u otras bases técnicas autorizadas.
```

6. **Bloque bomba de calor/aerotermia**

Si el escenario incluye heat pump:

```txt
La bomba de calor puede cubrir calefacción, refrigeración y ACS según configuración. Su rendimiento depende del tipo de equipo, aislamiento, clima, emisores y uso real. En condiciones favorables, puede alcanzar COP/SCOP elevados, pero el ahorro real debe validarse con estudio técnico y consumos reales.
```

Usar datos del documento:

```txt
COP orientativo: 3–4.
Ahorro potencial: hasta 60–70% frente a sistemas convencionales, no garantizado.
Consumo anual orientativo aerotermia: 2.000–4.000 kWh/año, sujeto a vivienda, clima, uso y tarifa.
```

7. **Disclaimer legal reforzado**

```txt
Esta estimación no sustituye una medición profesional, visita técnica, proyecto, licencia, presupuesto de contratista ni Certificado de Eficiencia Energética oficial. Los importes reales pueden variar por ubicación, estado inicial, calidades, accesibilidad, alcance final, impuestos, licencias, disponibilidad de materiales y criterio del técnico o industrial.
```

### Criterios

- PDF sigue generándose.
- No parece presupuesto contractual.
- No parece CEE oficial.
- No se rompe anexo documental demo.
- Mantener estética Premium.

---

## Fase 8 — ETL BC3/CSV/PDF: solo preparación, no importador completo

### Objetivo

Dejar preparada una arquitectura clara para futura ingesta.

### Crear documentación

```txt
docs/etl/price-catalog-etl-roadmap.md
```

Contenido mínimo:

```txt
1. Objetivo.
2. Fuentes permitidas.
3. Fuentes descartadas o secundarias.
4. Pipeline:
   BC3/CSV/PDF → staging → parser → normalizer → price_sources/price_items → measure_price_map → estimate engine.
5. Reglas legales/licencia.
6. Campos obligatorios por fuente.
7. Política de actualización y versionado.
8. Estrategia de rollback.
9. Futuro parser TypeScript `bc3`.
10. Riesgos de `bc3reader` y por qué no va al core.
```

### Crear stubs seguros opcionales

```txt
src/lib/price-import/types.ts
src/lib/price-import/normalizer.ts
```

Sin dependencias externas todavía.

Tipos mínimos:

```ts
export type RawImportedPriceItem = {
  sourceName: string;
  sourceVersion?: string;
  externalCode?: string;
  title: string;
  description?: string;
  unit: string;
  unitPrice?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  region?: string;
  capturedAt?: string;
};
```

### Criterios

- No instalar `bc3` todavía salvo que implementes un parser real y tests.
- No crear ruta admin pública sin auth.
- No meter credenciales ni fuentes privadas.

---

## Fase 9 — Demo assessment enriquecido

### Objetivo

Actualizar la demo para que muestre costes realistas y coherentes con su CEE demo/clasificación.

### Tareas

1. Revisar:

```txt
src/lib/demo-assessment.ts
src/lib/demo-assets.ts
scripts/generate-demo-assets.mjs
```

2. La demo actual representa vivienda unifamiliar ficticia de 1998, 185 m², letra E, sin renovables y con sistemas convencionales.

3. Alinear escenarios:

```txt
Escenario 1: envolvente parcial → salto 1 letra.
Escenario 2: bomba de calor + ACS eficiente → salto 1–2 letras.
Escenario 3: fotovoltaica + aerotermia + envolvente → salto 2–3 letras.
Escenario 4: reforma profunda → salto potencial 3–4 letras, solo como escenario premium y con baja/media confianza.
```

4. Asegurar que el PDF demo muestra costes orientativos con disclaimer.

---

## Fase 10 — Tests

### Tests nuevos mínimos

Crear o ampliar:

```txt
tests/cost-engine.test.ts
tests/quantity-resolver.test.ts
tests/scenario-cost-matrix.test.ts
tests/pdf-cost-estimates.test.ts si viable
tests/price-import-normalizer.test.ts si creas stubs
```

### Casos obligatorios

1. Piso con 90 m² no calcula cubierta como si fuera unifamiliar sin disclaimer.
2. Unifamiliar 185 m² calcula cubierta, huecos y envolvente con assumptions.
3. Local comercial usa escenarios de local, no de vivienda.
4. Comunidad usa fachada/cubierta común y muestra baja/media confianza.
5. Salto 1 letra devuelve escenario ligero/medio.
6. Salto 3–4 letras devuelve escenario profundo con advertencia.
7. Bomba de calor incluye dependencias: aislamiento, espacio, revisión eléctrica/acústica.
8. Falta superficie → no calcula coste o devuelve confianza baja controlada.
9. Rango mínimo nunca supera rango máximo.
10. Disclaimers obligatorios presentes.
11. Fuente seed incluye versión/fecha/confianza.
12. A/B/pricing si lo tocas: no romper base existente.

### Comandos obligatorios

```bash
npm test
npm run lint
npm run build
npx prisma validate
npx prisma generate
```

Si algún comando falla por entorno externo, documentar con precisión.

---

## Fase 11 — SDD y cierre

Actualizar todos los documentos SDD.

### `feature-energyscan-real-cost-estimates-index.md`

Debe incluir:

- objetivo,
- estado,
- archivos principales,
- relación con features anteriores,
- resumen funcional.

### `feature-energyscan-real-cost-estimates-spec-v1.md`

Debe incluir:

- contexto,
- alcance,
- fuera de alcance,
- modelo de datos,
- motor de costes,
- matriz de escenarios,
- integración con PDF,
- riesgos,
- decisiones.

### `test-plan-v1.md`

Debe incluir:

- tests unitarios,
- tests integración,
- QA PDF,
- QA demo,
- validación mobile básica.

### `execution-report.md`

Debe incluir:

- rama,
- cambios implementados,
- migraciones,
- seeds,
- tests,
- build,
- errores encontrados,
- deuda pendiente.

### `GATE_FINAL.md`

Checklist:

```md
# GATE FINAL — EnergyScan Real Cost Estimates

- [ ] Rama creada desde main.
- [ ] Estado inicial del repo documentado.
- [ ] SDD creado.
- [ ] Prisma schema ampliado con catálogo de precios y estimaciones.
- [ ] Migración creada o bloqueo documentado.
- [ ] Seed de fuentes/precios/medidas creado e idempotente.
- [ ] Motor de cantidades implementado.
- [ ] Motor de costes por rango implementado.
- [ ] Matriz de escenarios por tipología/salto energético creada.
- [ ] Integración con simulator realizada sin romper escenarios actuales.
- [ ] Resultados UI muestran costes orientativos con confianza.
- [ ] PDF Premium incluye resumen económico, detalle de actuaciones y trazabilidad.
- [ ] Nota de referencias reales/mercado añadida al PDF.
- [ ] Bomba de calor/aerotermia enriquecida en escenarios y PDF.
- [ ] Roadmap ETL BC3/FIEBDC documentado.
- [ ] No se integró bc3reader en el core.
- [ ] Demo assessment alineado con costes y escenarios.
- [ ] Tests de coste/cantidad/matriz añadidos.
- [ ] npm test ejecutado.
- [ ] npm run lint ejecutado.
- [ ] npm run build ejecutado.
- [ ] npx prisma validate ejecutado.
- [ ] npx prisma generate ejecutado.
- [ ] Riesgos pendientes documentados.
```

---

## Fuera de alcance obligatorio

No implementar en esta feature:

- Stripe real.
- Panel admin completo.
- Multi-tenant/white-label completo.
- Parser BC3 productivo completo.
- Integración real con BEDEC/CYPE/PREOC con credenciales.
- Scraping automático.
- MCP real.
- GLTF/GLB real.
- IFC/BIM real.
- Certificación energética oficial.
- Presupuesto contractual.
- Promesa de salto de letra garantizado.
- Promesa de ahorro económico garantizado.

Sí preparar:

- base de datos,
- catálogo seed,
- motor de costes,
- matriz de escenarios,
- integración UI/PDF,
- trazabilidad,
- roadmap ETL.

---

## Criterios de aceptación globales

La feature es válida si:

1. El wizard sigue funcionando.
2. La creación de assessment sigue funcionando.
3. La página de resultados sigue cargando.
4. El PDF sigue generándose.
5. Los escenarios actuales siguen existiendo.
6. Los escenarios ahora pueden mostrar rango económico si hay datos suficientes.
7. El PDF incluye presupuesto orientativo por escenario.
8. El PDF incluye nota de fuentes/referencias reales normalizadas.
9. El PDF distingue estimación orientativa de presupuesto cerrado.
10. Existe catálogo seed versionado.
11. Existe trazabilidad de fuente/confianza.
12. Existe matriz por tipología y salto energético.
13. Existe preparación para BC3/FIEBDC sin acoplar parser antiguo al core.
14. Tests y build pasan o los bloqueos quedan documentados sin ocultarlos.

---

## Salida final esperada de Codex

Al terminar, responde con:

1. Rama usada.
2. Resumen ejecutivo.
3. Estado inicial detectado.
4. Archivos modificados.
5. Archivos creados.
6. Migraciones Prisma.
7. Seeds añadidos.
8. Tests añadidos.
9. Comandos ejecutados y resultado.
10. Qué queda fuera de alcance.
11. Riesgos pendientes.
12. Próximo paso recomendado.

No devuelvas solo explicación. Debes modificar el repositorio y dejar la feature verificable.

---

## Nota de calidad

Prioriza una implementación sobria, trazable y mantenible. El valor de esta feature no es prometer costes exactos, sino hacer que EnergyScan entregue una estimación económica más creíble, defendible y accionable dentro del PDF Premium, manteniendo el carácter orientativo del producto.

