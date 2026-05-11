# Prompt maestro para Codex — Anclora EnergyScan: restaurar toggle de idioma + toggles premium de tema, idioma, moneda y unidades

## Contexto

Estás trabajando en el repositorio local:

```bash
/home/toni/projects/anclora-energyscan
```

Proyecto: **Anclora EnergyScan**, aplicación Premium del ecosistema Anclora Group orientada al prediagnóstico energético orientativo de viviendas.

El usuario lanzará este prompt desde un workspace donde también estará disponible el repositorio:

```bash
/home/toni/projects/anclora-nexus
```

Debes usar `anclora-nexus` únicamente como referencia de implementación/UX para toggles de idioma, moneda y unidad de medida, no para copiar sin adaptar ni romper contratos de EnergyScan.

También debes respetar:

- Contratos de la Bóveda Anclora si están disponibles localmente.
- Contratos de `anclora-design-system` si están disponibles localmente.
- Estilo visual actual de EnergyScan.
- Aspecto premium actual del toggle de tema de EnergyScan.
- Mobile-first.
- TypeScript strict.
- Flujo existente: landing → wizard → assessment → results → PDF.

Regla de producto no negociable:

> Anclora EnergyScan no genera Certificados de Eficiencia Energética oficiales. Es una herramienta de prediagnóstico energético orientativo. Ningún texto, PDF o pantalla debe inducir a pensar que se emite un CEE oficial.

---

## Problema actual

El usuario pidió anteriormente revisar los idiomas porque había mezcla lingüística en la aplicación. La intención era que:

- Si el idioma es español, **todo** debe estar en español.
- Si el idioma es inglés, **todo** debe estar en inglés.
- Si el idioma es alemán, **todo** debe estar en alemán.

Sin embargo, la implementación resultante dejó todo en español y eliminó el toggle de idioma que antes existía.

Ahora hay que:

1. Restaurar el toggle de idioma `ES | EN | DE`, recuperándolo de un commit anterior si es posible.
2. Asegurar coherencia lingüística completa por idioma.
3. Añadir una capa de preferencias similar conceptualmente a Anclora Nexus, pero adaptada a EnergyScan.
4. Incorporar 4 toggles premium:
   - Tema.
   - Idioma.
   - Moneda.
   - Sistema de medición.
5. Mantener la apariencia visual del toggle actual de tema de EnergyScan: premium, compacto, sin textos largos, basado en símbolos/iconos.

---

## Objetivo general

Implementar end-to-end un sistema coherente de preferencias de usuario en EnergyScan:

```txt
Tema: dark | light | system
Idioma: ES | EN | DE
Moneda: EUR | GBP
Medición: m² | sq ft
```

Valores por defecto:

```txt
Tema: dark
Idioma: ES
Moneda: EUR
Medición: m²
```

Reglas automáticas por idioma:

```txt
ES → EUR + m²
DE → EUR + m²
EN → GBP + sq ft
```

El usuario podrá cambiar explícitamente moneda y sistema de medición si la UI lo permite, pero al cambiar idioma debe aplicarse el preset anterior, salvo que el código tenga ya una lógica robusta de preferencias manuales. Si no existe esa lógica, prioriza comportamiento simple y predecible:

- Cambiar a EN activa GBP + sq ft.
- Cambiar a ES o DE activa EUR + m².

---

## Rama de trabajo

Primero inspecciona el estado actual:

```bash
cd /home/toni/projects/anclora-energyscan
git status --short
git branch --show-current
git log --oneline --decorate -12
```

Crea una rama nueva desde `main`:

```bash
git checkout main
git pull --ff-only
git checkout -b feat/energyscan-premium-preferences-i18n
```

No trabajes directamente sobre `main`.

Si hay cambios sin commit, no los borres. Documenta el estado inicial en SDD.

---

# FASE 0 — Inspección y recuperación histórica

## 0.1 Revisar implementación actual en EnergyScan

Inspecciona como mínimo:

```txt
src/components/AppPreferencesProvider.tsx
src/components/PreferenceToggles.tsx
src/components/Navbar.tsx
src/components/Footer.tsx
src/app/layout.tsx
src/app/page.tsx
src/app/wizard/page.tsx
src/app/assessment/[id]/page.tsx
src/app/auth/page.tsx
src/app/auth/AuthForm.tsx
src/app/legal/page.tsx
src/app/privacy/page.tsx
src/app/terms/page.tsx
src/components/LegalDocumentLayout.tsx
src/lib/preferences.ts
src/lib/i18n.ts
src/lib/pdf/EnerScanReport.tsx
public/locales/es/common.json
public/locales/en/common.json
public/locales/de/common.json
```

Busca cualquier texto hardcodeado en español, inglés o alemán:

```bash
rg "Iniciar|Ver ejemplo|Prediagnóstico|Certificado|Ayudas|Download|Start|Assessment|Legal|Privacy|Terms|Datenschutz|Deutsch|English|Español|€|EUR|GBP|£|m²|m2|sq ft|sqm" src public README.md
```

No te limites a los diccionarios: revisa botones, headers, footer, formularios, políticas, términos, legal, resultados y PDF.

## 0.2 Recuperar toggle anterior desde Git

El toggle de idioma existía antes y fue eliminado. Debes intentar recuperarlo desde commits anteriores.

Ejecuta búsquedas históricas:

```bash
git log --oneline -- src/components/PreferenceToggles.tsx src/components/AppPreferencesProvider.tsx src/lib/preferences.ts src/lib/i18n.ts public/locales

git log -S"enerscan-language" -- src

git log -S"ES" -- src/components src/lib public/locales

git log -S"DE" -- src/components src/lib public/locales
```

Si encuentras el commit anterior correcto, revisa el archivo sin cambiar aún:

```bash
git show <commit>:src/components/PreferenceToggles.tsx
git show <commit>:src/components/AppPreferencesProvider.tsx
git show <commit>:src/lib/preferences.ts
```

Recupera la lógica útil, pero no hagas un checkout ciego si el repo evolucionó. Integra manualmente preservando cambios posteriores.

Documenta en `execution-report.md`:

- Commit o commits revisados.
- Qué se recuperó.
- Qué se descartó.
- Por qué.

## 0.3 Consultar Anclora Nexus como referencia

Inspecciona el repo Nexus:

```bash
cd /home/toni/projects/anclora-nexus
git status --short
rg "currency|EUR|GBP|unit|measurement|language|locale|toggle|theme|m²|sq ft|preferences" src app components lib public -S
```

Identifica:

- Cómo gestiona idioma.
- Cómo gestiona moneda.
- Cómo gestiona unidad de medida.
- Cómo persiste preferencias.
- Cómo representa visualmente los toggles.

No copies dependencias o arquitectura innecesaria. Usa Nexus como referencia conceptual.

---

# FASE 1 — Modelo de preferencias

## 1.1 Tipos y defaults

Revisa o crea en:

```txt
src/lib/preferences.ts
```

Debe existir un modelo claro:

```ts
export type AppTheme = 'dark' | 'light' | 'system';
export type AppLanguage = 'es' | 'en' | 'de';
export type AppCurrency = 'EUR' | 'GBP';
export type MeasurementSystem = 'metric' | 'imperial';

export type AppPreferences = {
  theme: AppTheme;
  language: AppLanguage;
  currency: AppCurrency;
  measurementSystem: MeasurementSystem;
};
```

Defaults obligatorios:

```ts
export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  language: 'es',
  currency: 'EUR',
  measurementSystem: 'metric',
};
```

Regla de idioma:

```ts
export function getPreferencesForLanguage(language: AppLanguage): Pick<AppPreferences, 'currency' | 'measurementSystem'> {
  if (language === 'en') return { currency: 'GBP', measurementSystem: 'imperial' };
  return { currency: 'EUR', measurementSystem: 'metric' };
}
```

Normalizadores requeridos:

```ts
normalizeTheme(value: unknown): AppTheme
normalizeLanguage(value: unknown): AppLanguage
normalizeCurrency(value: unknown): AppCurrency
normalizeMeasurementSystem(value: unknown): MeasurementSystem
```

Persistencia esperada:

- `localStorage` para cliente.
- Cookies para SSR/hidratación inicial y PDF/API si ya se usa ese patrón.

Nombres sugeridos:

```txt
enerscan-theme
enerscan-language
enerscan-currency
enerscan-measurement-system
```

Mantén compatibilidad con nombres anteriores si existen.

## 1.2 Provider de preferencias

Revisa:

```txt
src/components/AppPreferencesProvider.tsx
```

Debe exponer:

```ts
preferences
theme
language
currency
measurementSystem
dictionary
setTheme
setLanguage
setCurrency
setMeasurementSystem
setPreferences
formatCurrency
formatArea
formatNumber
convertArea
convertCurrency
```

Si el Provider actual es más simple, extiéndelo sin romper consumidores existentes.

Al cambiar idioma:

```ts
setLanguage('en') → language='en', currency='GBP', measurementSystem='imperial'
setLanguage('es') → language='es', currency='EUR', measurementSystem='metric'
setLanguage('de') → language='de', currency='EUR', measurementSystem='metric'
```

Debe actualizar localStorage, cookies y estado React de forma consistente.

## 1.3 Evitar flash visual/idioma incorrecto

Revisa:

```txt
src/app/layout.tsx
```

El script inicial debe leer tema, idioma, moneda y medición antes de hidratación.

Debe aplicar por defecto:

```txt
html lang="es"
class dark
```

Si hay preferencia guardada, usarla.

---

# FASE 2 — UI de toggles premium

## 2.1 Crear o restaurar `PreferenceToggles`

Revisa o crea:

```txt
src/components/PreferenceToggles.tsx
```

Debe renderizar cuatro toggles visualmente coherentes:

1. Tema.
2. Idioma.
3. Moneda.
4. Medición.

Requisito visual:

- Mismo carácter premium que el toggle actual de tema de EnergyScan.
- Sin textos largos en la vista compacta.
- Solo símbolos/códigos/iconos:
  - Tema: iconos tipo luna/sol/sistema.
  - Idioma: `ES`, `EN`, `DE` o icono globo + opción seleccionada.
  - Moneda: `€` / `£` o `EUR` / `GBP` según quepa, pero el estado visible debe mostrar símbolo o código reconocible.
  - Medición: `m²` / `sq ft`.
- Deben tener `aria-label` accesibles.
- Deben funcionar en móvil.
- No deben romper header/navbar.
- Evitar menús enormes. Si se usa dropdown, mantener estética similar a los adjuntos: panel oscuro premium, borde suave, selección resaltada.

El usuario ha adjuntado referencias visuales donde se ven toggles compactos para:

```txt
EUR
ES
M²
```

y dropdowns de moneda y medición. Usa esas referencias como inspiración, pero adapta al look actual de EnergyScan.

## 2.2 Ubicación en Navbar

Revisa:

```txt
src/components/Navbar.tsx
```

Debe mostrar los cuatro toggles sin saturar.

Sugerencia:

- Desktop: fila compacta en header.
- Mobile: dentro del menú o fila compacta responsive.
- Mantener el CTA principal visible.

## 2.3 El toggle de idioma debe volver a existir

Condición obligatoria:

- El usuario debe poder elegir `ES`, `EN`, `DE` desde la UI.
- Al cambiar idioma se actualiza todo el copy de la página actual.
- La preferencia se mantiene al recargar.
- Por defecto es `ES`.

---

# FASE 3 — I18N completo y coherente

## 3.1 Diccionarios

Revisa y amplía:

```txt
public/locales/es/common.json
public/locales/en/common.json
public/locales/de/common.json
src/lib/i18n.ts
```

El objetivo no es traducir solo la landing. Debe cubrir, como mínimo:

- Navbar.
- Footer.
- Landing completa.
- CTAs.
- Wizard.
- Auth.
- Resultados.
- Adjuntos.
- OCR si existe o placeholders si no.
- Proveedores/leads.
- Ayudas/subvenciones.
- Estimaciones económicas.
- Disclaimers legales.
- Política de privacidad.
- Términos de servicio.
- Aviso legal.
- PDF.
- Mensajes de error principales.

## 3.2 No hardcodear copy visible

Busca y elimina textos hardcodeados cuando correspondan a UI visible:

```bash
rg "[A-Za-zÁÉÍÓÚáéíóúñÑüÜ]{4,}" src/app src/components src/lib/pdf -S
```

No hace falta mover a diccionario textos internos técnicos, IDs, enums o logs, pero sí todo texto visible al usuario.

## 3.3 Alemán

EnergyScan por ahora solo necesita `ES`, `EN`, `DE`.

El usuario ha indicado que:

> El alemán es igual que el español.

Interpreta esto así:

- En alemán se usa EUR.
- En alemán se usa m².
- El copy visible debe estar en alemán, no en español, salvo que actualmente no haya traducción disponible.

Si no puedes traducir todo al alemán de forma fiable en esta pasada, haz una traducción funcional y documenta cualquier deuda. No dejes mezcla ES/DE en botones principales.

## 3.4 Validación lingüística manual obligatoria

Debes entrar en la aplicación y comprobar por ti mismo los tres idiomas.

Usa el entorno local:

```bash
npm run dev
```

Después abre la app con navegador/herramienta disponible y revisa:

```txt
/
/wizard
/auth
/privacy
/terms
/legal
/api/assessment/demo → página de assessment demo
```

Si tienes Playwright o navegador disponible, úsalo. Si no, usa inspección del HTML/render y documenta la limitación.

Validación mínima por idioma:

- Header/navbar.
- Footer.
- Botones.
- Landing.
- Wizard.
- Resultados demo.
- Políticas.
- Términos.
- Legal.
- PDF demo.

No basta con pasar tests; hay que revisar visualmente o por render real.

---

# FASE 4 — Moneda y unidades

## 4.1 Formateadores centralizados

Crear o ampliar:

```txt
src/lib/formatters.ts
```

o integrar en `src/lib/preferences.ts` si es más simple.

Debe incluir:

```ts
const SQFT_PER_M2 = 10.76391041671;

formatCurrency(valueEur: number, currency: AppCurrency, options?: { rate?: number }): string
formatArea(valueM2: number, measurementSystem: MeasurementSystem): string
formatNumber(value: number, locale: AppLanguage): string
convertArea(valueM2: number, measurementSystem: MeasurementSystem): number
convertCurrencyFromEur(valueEur: number, currency: AppCurrency, rate?: number): number
```

Reglas de formato:

### Español / Euro

Formato habitual:

```txt
64,50 €
1.234,56 €
185 m²
```

Usa `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })` si encaja.

### Alemán / Euro

```txt
64,50 €
1.234,56 €
185 m²
```

Usa `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`.

### Inglés británico / Libra

Formato obligatorio:

```txt
£64.50
£1,234.56
1,991 sq ft
```

Usa `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.

Superficies en inglés:

```txt
m² → sq ft
1 m² = 10.76391041671 sq ft
```

Redondeo recomendado:

- Superficies: 0 decimales si son grandes, 1 decimal si son pequeñas.
- Importes: 2 decimales.

## 4.2 Tipo de cambio EUR → GBP

El usuario solicita usar el cambio más actualizado si es posible.

No introduzcas dependencia fuerte a una API externa obligatoria.

Implementa una estrategia segura:

1. Variable de entorno opcional:

```env
NEXT_PUBLIC_EUR_GBP_RATE="0.86"
EUR_GBP_RATE="0.86"
```

2. Fallback interno documentado:

```ts
DEFAULT_EUR_GBP_RATE = 0.86
```

3. Si existe una fuente interna o endpoint seguro ya disponible en el repo, úsalo.
4. No hagas llamadas externas en cada render ni durante build.

El código debe dejar claro que es una conversión orientativa para visualización, no una cotización financiera garantizada.

Actualiza `.env.example`:

```env
EUR_GBP_RATE="0.86"
NEXT_PUBLIC_EUR_GBP_RATE="0.86"
```

Si usas solo una de las dos, justifica la decisión.

## 4.3 Aplicar conversiones en toda la app

Revisa todos los lugares donde se muestren:

- Importes.
- Rangos económicos.
- Costes de escenarios.
- Presupuestos orientativos.
- Superficie de vivienda.
- Unidades de coste por m².
- PDF Premium.
- PDF demo.

Busca:

```bash
rg "€|EUR|euro|euros|m²|m2|sq ft|cost|price|amount|area|surface|superficie|importe|presupuesto" src -S
```

Aplica formateadores centralizados. No hagas conversiones dispersas en componentes.

---

# FASE 5 — PDF demo y PDF Premium por idioma

## 5.1 PDF Premium dinámico

El PDF Premium entregado debe generarse en el idioma actual de la app.

Revisa:

```txt
src/app/api/assessment/[id]/pdf/route.ts
src/lib/pdf/EnerScanReport.tsx
src/lib/stateless-assessment.ts
src/lib/demo-assets.ts
```

Debe tomar idioma, moneda y medición desde:

1. Query params si existen:

```txt
?lang=es&currency=EUR&units=metric
?lang=en&currency=GBP&units=imperial
?lang=de&currency=EUR&units=metric
```

2. Cookies si no hay query params.
3. Defaults si no hay nada.

## 5.2 Tres PDFs demo

El usuario quiere que haya tres PDFs demo:

```txt
ES → español, EUR, m²
EN → inglés, GBP, sq ft
DE → alemán, EUR, m²
```

Interpreta esto de forma mantenible:

- No dupliques tres plantillas completas si el PDF se puede generar dinámicamente por idioma.
- Si existen assets PDF demo estáticos, crea tres variantes solo si el flujo actual realmente las necesita.
- Preferencia técnica: un único generador dinámico que entregue el PDF demo en función de idioma/preferencias.
- Si el repo exige assets estáticos para demo, crea:

```txt
public/demo-assets/property-demo/cee-demo-es.pdf
public/demo-assets/property-demo/cee-demo-en.pdf
public/demo-assets/property-demo/cee-demo-de.pdf
```

Pero no generes documentos que parezcan CEE oficiales reales. Deben marcarse como demo/sin validez.

## 5.3 PDF demo según idioma de app

Desde la UI, al descargar el PDF demo:

- Si app está en ES → PDF en español, EUR, m².
- Si app está en EN → PDF en inglés, GBP, sq ft.
- Si app está en DE → PDF en alemán, EUR, m².

El PDF debe mantener coherencia en:

- Portada.
- Disclaimers.
- Datos de vivienda.
- Escenarios.
- Costes.
- Superficies.
- Anexos.
- Footer.

---

# FASE 6 — Legal, privacidad y términos por idioma

Revisa:

```txt
src/app/privacy/page.tsx
src/app/terms/page.tsx
src/app/legal/page.tsx
src/components/LegalDocumentLayout.tsx
```

Debe cumplirse:

- Si idioma ES: todo en español.
- Si idioma EN: todo en inglés.
- Si idioma DE: todo en alemán.
- No mezclar títulos en español con cuerpo en inglés, ni botones en español dentro de página inglesa.
- Footer y navegación también deben cambiar.

Si actualmente esas páginas son Server Components sin acceso al provider cliente, puedes:

- Convertirlas a Client Components si es razonable.
- O leer cookies en servidor y renderizar contenido adecuado.
- Prioriza solución simple y robusta.

---

# FASE 7 — Tests

Añade o amplía tests.

## 7.1 Tests de preferencias

Crear:

```txt
tests/preferences.test.ts
```

Casos mínimos:

- Defaults: ES, EUR, metric, dark.
- `normalizeLanguage` acepta solo `es`, `en`, `de`.
- `getPreferencesForLanguage('en')` devuelve GBP + imperial.
- `getPreferencesForLanguage('es')` devuelve EUR + metric.
- `getPreferencesForLanguage('de')` devuelve EUR + metric.

## 7.2 Tests de formatters

Crear:

```txt
tests/formatters.test.ts
```

Casos mínimos:

- `64.5 EUR es` → `64,50 €` o formato equivalente `Intl` español.
- `64.5 GBP en` → `£64.50`.
- `1234.56 GBP en` → `£1,234.56`.
- `185 m² metric` → contiene `185` y `m²`.
- `185 m² imperial` → aproximadamente `1,991 sq ft`.

No hagas tests demasiado frágiles si `Intl` introduce espacios no separables. Normaliza espacios antes de comparar.

## 7.3 Tests de diccionarios

Crear:

```txt
tests/i18n-dictionaries.test.ts
```

Casos mínimos:

- ES, EN y DE tienen las mismas claves obligatorias.
- No faltan claves principales usadas por Navbar/Footer/Landing/Auth/Legal/PDF.
- No hay valores vacíos.

## 7.4 Tests PDF/preferences

Si existe test de PDF, ampliarlo.

Validar al menos:

- PDF en EN usa `£` y `sq ft`.
- PDF en ES usa `€` y `m²`.
- PDF en DE usa `€` y `m²`.

Si extraer texto de PDF en test es costoso, documenta validación manual obligatoria y añade test unitario sobre la data preparada para PDF.

---

# FASE 8 — Validación manual obligatoria en navegador

Debes entrar en la aplicación y comprobarlo por ti mismo.

## 8.1 Levantar app

```bash
npm run dev
```

## 8.2 Rutas a revisar

Revisar en `ES`, `EN`, `DE`:

```txt
/
/wizard
/auth
/privacy
/terms
/legal
/api/assessment/demo → página de resultados demo
```

## 8.3 Checklist visual

Para cada idioma:

- Header/navbar en idioma correcto.
- Footer en idioma correcto.
- Botones en idioma correcto.
- Landing sin mezcla lingüística.
- Wizard sin mezcla lingüística.
- Resultados sin mezcla lingüística.
- Legal/privacy/terms sin mezcla lingüística.
- PDF demo coherente con idioma.

Para preferencias:

- Default: ES + EUR + m² + dark.
- Al cambiar a EN: GBP + sq ft.
- Al cambiar a DE: EUR + m².
- Al cambiar a ES: EUR + m².
- Tema se mantiene.
- Preferencias persisten tras recarga.
- Visual de toggles premium y coherente.
- Mobile no rompe layout.

Si no puedes usar navegador real, documenta exactamente la limitación y usa el mejor método disponible: render HTML, screenshots, tests o inspección manual por componentes.

---

# FASE 9 — SDD obligatorio

Crear feature SDD:

```txt
sdd/features/energyscan-premium-preferences-i18n/
  feature-energyscan-premium-preferences-i18n-index.md
  feature-energyscan-premium-preferences-i18n-spec-v1.md
  test-plan-v1.md
  execution-report.md
  GATE_FINAL.md
```

## `feature-energyscan-premium-preferences-i18n-index.md`

Debe incluir:

- Objetivo.
- Estado.
- Archivos afectados.
- Relación con restauración del toggle eliminado.
- Relación con Anclora Nexus como referencia.

## `feature-energyscan-premium-preferences-i18n-spec-v1.md`

Debe incluir:

- Contexto.
- Problema.
- Alcance.
- Fuera de alcance.
- Contratos visuales.
- Contratos i18n.
- Reglas moneda/unidades.
- Riesgos.

## `test-plan-v1.md`

Debe incluir:

- Tests unitarios.
- Tests de formatters.
- Tests de diccionarios.
- Validación manual navegador.
- Validación PDF.
- Validación mobile.

## `execution-report.md`

Debe documentar:

- Estado inicial del repo.
- Commits históricos revisados para recuperar el toggle.
- Qué se recuperó.
- Qué se implementó nuevo.
- Qué se revisó en Anclora Nexus.
- Comandos ejecutados.
- Resultado de tests/build.
- Validación manual real.
- Riesgos pendientes.

## `GATE_FINAL.md`

Checklist obligatorio:

```md
# GATE FINAL — EnergyScan Premium Preferences + I18N

- [ ] Rama creada desde main.
- [ ] Estado inicial inspeccionado.
- [ ] Toggle anterior de idioma localizado en histórico o imposibilidad documentada.
- [ ] Toggle de idioma ES/EN/DE restaurado.
- [ ] Referencia de Anclora Nexus revisada.
- [ ] Modelo de preferencias extendido a tema, idioma, moneda y medición.
- [ ] Defaults: ES, EUR, m², dark.
- [ ] EN aplica GBP + sq ft.
- [ ] ES aplica EUR + m².
- [ ] DE aplica EUR + m².
- [ ] Los cuatro toggles tienen apariencia premium coherente.
- [ ] Toggless sin textos largos, basados en iconos/símbolos/códigos.
- [ ] Navbar no se rompe en desktop.
- [ ] Navbar no se rompe en mobile.
- [ ] Landing revisada en ES/EN/DE.
- [ ] Wizard revisado en ES/EN/DE.
- [ ] Auth revisado en ES/EN/DE.
- [ ] Assessment demo revisado en ES/EN/DE.
- [ ] Footer revisado en ES/EN/DE.
- [ ] Privacy revisado en ES/EN/DE.
- [ ] Terms revisado en ES/EN/DE.
- [ ] Legal revisado en ES/EN/DE.
- [ ] PDF demo ES generado o validado.
- [ ] PDF demo EN generado o validado con £ y sq ft.
- [ ] PDF demo DE generado o validado.
- [ ] PDF Premium usa idioma/preferencias actuales.
- [ ] Importes centralizados mediante formatter.
- [ ] Superficies centralizadas mediante formatter.
- [ ] `.env.example` actualizado con EUR_GBP_RATE si aplica.
- [ ] Tests de preferencias añadidos.
- [ ] Tests de formatters añadidos.
- [ ] Tests de diccionarios añadidos.
- [ ] `npm test` ejecutado.
- [ ] `npm run lint` ejecutado si existe.
- [ ] `npm run build` ejecutado.
- [ ] SDD creado.
- [ ] Riesgos pendientes documentados.
```

---

# Criterios de aceptación funcional

La tarea se considera completada si:

1. El toggle de idioma `ES | EN | DE` vuelve a estar disponible.
2. La app arranca por defecto en español.
3. La moneda por defecto es Euro.
4. La unidad por defecto es m².
5. El tema por defecto es dark.
6. Hay cuatro toggles: tema, idioma, moneda y medición.
7. Los cuatro toggles tienen estética premium coherente con EnergyScan.
8. Al seleccionar inglés, la app usa inglés, libras y sq ft.
9. Al seleccionar español, la app usa español, euros y m².
10. Al seleccionar alemán, la app usa alemán, euros y m².
11. Los importes en inglés usan formato británico: `£64.50`, `£1,234.56`.
12. Las superficies en inglés se convierten correctamente a sq ft.
13. Las políticas, términos y aviso legal respetan el idioma seleccionado.
14. El PDF demo se entrega coherente con el idioma/preferencias actuales.
15. El PDF Premium se entrega coherente con el idioma/preferencias actuales.
16. No hay mezcla evidente de idiomas en header, footer, botones, landing, wizard, resultados, legal, privacy, terms o PDF.
17. Tests principales pasan.
18. Build de producción pasa.
19. SDD documenta la ejecución.

---

# Criterios de aceptación técnica

- No duplicar lógica de conversión de moneda/superficie.
- No hardcodear `€`, `£`, `m²`, `sq ft` en múltiples componentes si puede centralizarse.
- No introducir APIs externas obligatorias para tipo de cambio.
- No romper cookies/localStorage existentes.
- No romper SSR/hidratación.
- No romper generación de PDF.
- No romper demo assessment.
- No romper Auth.
- No romper tests existentes.
- No convertir toda la app a client components innecesariamente.
- No copiar arquitectura de Nexus sin adaptar.
- No mezclar alemán con español en copy principal.

---

# Comandos obligatorios

Ejecuta y documenta:

```bash
npm test
npm run lint
npm run build
npx tsc --noEmit
```

Si algún comando no existe o falla por deuda previa, documenta:

- Comando.
- Error.
- Si está relacionado con esta feature.
- Riesgo.
- Recomendación.

No ocultes fallos.

---

# Salida final esperada de Codex

Al finalizar, devuelve:

1. Rama usada.
2. Estado inicial del repo.
3. Commit histórico usado para recuperar el toggle o explicación si no se encontró.
4. Qué se revisó en Anclora Nexus.
5. Archivos modificados.
6. Archivos creados.
7. Cambios en preferencias.
8. Cambios en UI/toggles.
9. Cambios en i18n.
10. Cambios en moneda/unidades.
11. Cambios en PDF demo/Premium.
12. Tests ejecutados y resultado.
13. Build ejecutado y resultado.
14. Validación manual en navegador.
15. Riesgos pendientes.
16. Próximo paso recomendado.

No devuelvas solo explicación. Debes modificar el código y dejar la implementación end-to-end en el repositorio.

---

## Nota final

La prioridad no es añadir más elementos visuales, sino restaurar control real de preferencias y eliminar la mezcla lingüística. Si hay que elegir entre una implementación vistosa y una coherente, prioriza coherencia, accesibilidad, persistencia y funcionamiento correcto en PDF.

