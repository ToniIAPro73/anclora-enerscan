# Prompt para Gemini CLI — Mejoras Catastro en Anclora EnergyScan: autocomplete, búsqueda por dirección y detalle de inmueble

## Contexto

Estás trabajando en el repositorio local de **Anclora EnergyScan**.

Ya existe una primera integración del buscador catastral dentro del wizard de la aplicación. Actualmente se observa este comportamiento:

1. La búsqueda por **referencia catastral** sí devuelve información.
2. La búsqueda por **dirección** no encuentra coincidencias aunque los datos existan en la Sede Electrónica del Catastro.
3. En la búsqueda por dirección, el campo `Calle / vía` funciona como input libre, pero debería comportarse como el buscador real del Catastro: al escribir, deben aparecer las vías/calles que contienen el texto introducido.
4. Al pulsar sobre una coincidencia recuperada por referencia catastral, aparentemente no ocurre nada. El usuario espera ver detalle, confirmar la vivienda, o que se rellenen los datos del wizard.
5. Hay que mantener coherencia con i18n, unidades y diseño premium/mobile-first de EnergyScan.

Las capturas de referencia muestran:

- En Catastro oficial, al escribir `MIQUEL`, aparecen vías como `MIQUEL ANGEL COLOMAR`, `MIQUEL ANGEL LLAUGER`, `MIQUEL ROSSELLO I ALEMANY`, etc.
- En EnergyScan, al introducir provincia `ILLES BALEARS`, municipio `PALMA`, vía `MIQUEL ROSSELLO I ALEMANY` y número `48`, la app no encuentra coincidencias.
- En EnergyScan, al introducir la RC `6485534DD6768E0003QD`, sí aparece una coincidencia, pero al pulsarla no se abre detalle ni se confirma visualmente la selección.

## Objetivo

Implementar mejoras end-to-end en la feature Catastro para que el buscador sea realmente usable:

1. Añadir autocompletado de calles/vías por provincia y municipio.
2. Corregir la búsqueda por dirección para que encuentre inmuebles cuando los datos son válidos.
3. Hacer funcional la interacción al pulsar una coincidencia recuperada.
4. Añadir una vista o panel de detalle de inmueble antes de confirmar.
5. Permitir confirmar una coincidencia y rellenar el wizard con los datos recuperados.
6. Mantener fallback manual si Catastro no devuelve resultados.
7. Añadir tests y QA manual.

## Rama de trabajo

Crea una rama específica desde el estado actual:

```bash
git checkout -b fix/catastro-address-autocomplete-detail
```

No trabajes directamente sobre `main`.

---

# Fase 0 — Auditoría inicial

## Objetivo

Entender el estado exacto de la integración actual antes de modificar código.

## Comandos iniciales

Ejecuta:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
cat package.json
find app components lib prisma tests src -maxdepth 4 -type f 2>/dev/null | sort | sed 's#^./##' | head -300
```

## Localiza como mínimo

- Componente actual del buscador Catastro.
- Endpoint de búsqueda por referencia catastral.
- Endpoint de búsqueda por dirección.
- Endpoint de calles/vías si existe.
- Cliente Catastro backend.
- Normalizadores actuales.
- Tipos actuales de `CadastralMatch` o equivalente.
- Estado del wizard y función que rellena datos tras confirmar.
- Sistema i18n actual.
- Tests existentes de Catastro.

## Entregable interno de esta fase

Antes de tocar código, deja claro:

- qué está implementado,
- qué está incompleto,
- qué endpoint falla,
- qué datos reales se están enviando a Catastro,
- qué respuesta se recibe,
- por qué no funciona el click sobre la coincidencia.

No empieces con cambios a ciegas.

---

# Fase 1 — Reproducir los errores actuales

## Caso A — Búsqueda por dirección que falla

Usa como caso de prueba:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY
Número: 48
```

La app actualmente muestra:

```txt
No se encontraron coincidencias. Revisa los datos o continúa manualmente.
```

Debes inspeccionar:

- payload enviado desde frontend,
- payload recibido por `/api/catastro/resolve` o endpoint equivalente,
- llamada real al cliente Catastro,
- normalización de provincia/municipio/vía,
- si Catastro necesita tipo de vía separado, por ejemplo `CL`, `CALLE`, etc.,
- si el número se está enviando en el campo correcto,
- si la vía requiere una clave/código interno y no solo texto libre.

## Caso B — Búsqueda por referencia catastral con click inerte

Usa:

```txt
Referencia catastral: 6485534DD6768E0003QD
```

La app devuelve coincidencia con:

```txt
6485534DD6768E
MIQUEL ROSSELLO I ALEMANY
PALMA
2003
```

Pero al pulsar sobre la tarjeta/flecha no pasa nada.

Debes inspeccionar:

- si hay `onClick` conectado,
- si existe estado `selectedMatch`,
- si falta modal/panel de detalle,
- si falta handler de confirmación,
- si el botón/flecha no es accesible,
- si hay un error silencioso en consola,
- si la tarjeta está renderizada como elemento visual sin acción.

---

# Fase 2 — Autocomplete de calles/vías

## Objetivo

Implementar un autocompletado de vía similar al del Catastro oficial.

Cuando el usuario escriba en `Calle / vía`, a partir de 3 caracteres, deben aparecer sugerencias de calles que contengan el texto escrito para la provincia y municipio seleccionados.

## Comportamiento esperado

1. El usuario selecciona provincia.
2. El usuario selecciona municipio.
3. El usuario empieza a escribir en `Calle / vía`.
4. A partir de 3 caracteres, se llama a un endpoint interno.
5. Se muestran sugerencias debajo del input.
6. Las sugerencias deben incluir todas las vías relevantes que contengan el texto, no solo las que empiezan exactamente igual.
7. Al seleccionar una sugerencia, el input se rellena con el nombre normalizado.
8. Si la API devuelve tipo de vía o código interno, debe guardarse en estado oculto para usarlo en la búsqueda posterior.
9. El usuario debe poder seguir escribiendo manualmente si no selecciona sugerencia.

## Endpoint interno sugerido

Implementa o corrige:

```txt
GET /api/catastro/streets?province=ILLES%20BALEARS&municipality=PALMA&query=MIQUEL
```

Respuesta sugerida:

```ts
type CatastroStreetSuggestion = {
  id: string;
  name: string;
  normalizedName: string;
  type?: string;
  typeCode?: string;
  municipality: string;
  province: string;
  displayName: string;
};
```

Ejemplo visual:

```txt
MIQUEL ANGEL COLOMAR (CALLE)
MIQUEL ANGEL LLAUGER (CALLE)
MIQUEL ANGEL RIERA (CALLE)
MIQUEL ARCAS (CALLE)
MIQUEL BOVER (CALLE)
MIQUEL ROSSELLO I ALEMANY (CALLE)
```

## Requisitos técnicos

- Debounce de 250-400 ms.
- No llamar al endpoint con menos de 3 caracteres.
- Cancelar o ignorar respuestas obsoletas si el usuario sigue escribiendo.
- Estado loading discreto.
- Estado sin sugerencias.
- Manejo de error sin bloquear formulario.
- Navegación con teclado si es razonable.
- Accesibilidad básica: `role="listbox"`, `role="option"`, `aria-expanded`, etc., si encaja con el sistema actual.
- No llamar directamente a Catastro desde cliente. Siempre backend.

## Nota crítica

El Catastro oficial probablemente no busca inmuebles por dirección usando texto libre de vía exactamente como lo está enviando ahora EnergyScan. Puede requerir primero resolver/listar la vía y luego usar el valor/código devuelto para consultar número o inmueble.

Implementa el flujo correcto si la API lo requiere.

---

# Fase 3 — Corregir búsqueda por dirección

## Objetivo

Hacer que la búsqueda por dirección funcione con datos válidos.

## Caso mínimo que debe funcionar

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY
Número: 48
```

## Acciones

1. Revisar cómo se llama actualmente a Catastro por dirección.
2. Ajustar normalización de:
   - provincia,
   - municipio,
   - vía,
   - tipo de vía,
   - número.
3. Si el endpoint oficial requiere códigos internos, usa los datos de la sugerencia seleccionada.
4. Si el usuario escribe la vía manualmente sin seleccionar sugerencia:
   - intenta resolver la vía automáticamente antes de buscar inmueble,
   - si hay varias vías candidatas, muestra selección de vía,
   - si no hay vía, muestra error claro.
5. Implementar mensajes de error útiles:
   - dirección incompleta,
   - vía no encontrada,
   - número no encontrado,
   - múltiples coincidencias,
   - servicio Catastro no disponible.
6. Normalizar la respuesta para que coincida con el mismo tipo de `CadastralMatch` usado por RC.

## Resultado esperado

La búsqueda por dirección debe devolver al menos una coincidencia normalizada cuando Catastro tenga datos para esa dirección.

Si el servicio oficial no devuelve datos para el número exacto, la UI debe explicar el motivo sin romper el flujo manual.

---

# Fase 4 — Detalle de coincidencia y confirmación

## Objetivo

Hacer funcional el click sobre una coincidencia recuperada.

## Comportamiento esperado

Al pulsar una tarjeta de coincidencia o su flecha:

1. Debe abrirse un panel, acordeón, modal o drawer con el detalle del inmueble.
2. Deben mostrarse los datos disponibles.
3. Debe existir una acción clara: `Usar esta vivienda` / `Confirmar vivienda`.
4. Al confirmar, los datos deben rellenar el wizard.
5. Debe quedar visualmente claro que la vivienda ha sido seleccionada.
6. El usuario debe poder cambiar de selección o continuar manualmente.

## Detalle mínimo a mostrar

Mostrar únicamente datos seguros y útiles:

```txt
Referencia catastral
Dirección normalizada
Municipio
Provincia
Código postal si existe
Año de construcción si existe
Superficie construida si existe
Superficie de parcela si existe
Uso/tipo de inmueble si existe
Fuente: Sede Electrónica del Catastro
Fecha de consulta
```

No mostrar raw JSON completo en UI.

## Integración con wizard

Al confirmar una coincidencia:

- rellenar dirección,
- rellenar código postal si existe,
- rellenar año de construcción si existe,
- rellenar superficie útil/construida solo si el campo de destino es compatible,
- guardar referencia catastral,
- guardar fuente `catastro`,
- no sobrescribir campos que el usuario ya haya editado manualmente sin confirmación si la arquitectura distingue dirty fields.

Si no existe esa distinción, prioriza el flujo más simple: confirmación explícita sobrescribe los campos relacionados.

---

# Fase 5 — i18n y unidades

## Objetivo

No introducir nueva deuda de idioma ni unidades.

## Requisitos

Todo el nuevo copy debe estar en:

- español,
- inglés,
- alemán.

No hardcodees textos visibles.

Claves sugeridas:

```ts
wizard.catastro.streetAutocomplete.loading
wizard.catastro.streetAutocomplete.noResults
wizard.catastro.streetAutocomplete.minChars
wizard.catastro.streetAutocomplete.error
wizard.catastro.detail.title
wizard.catastro.detail.reference
wizard.catastro.detail.address
wizard.catastro.detail.municipality
wizard.catastro.detail.province
wizard.catastro.detail.postalCode
wizard.catastro.detail.constructionYear
wizard.catastro.detail.builtArea
wizard.catastro.detail.plotArea
wizard.catastro.detail.source
wizard.catastro.detail.retrievedAt
wizard.catastro.detail.useThisProperty
wizard.catastro.detail.selected
wizard.catastro.errors.streetRequired
wizard.catastro.errors.streetNotFound
wizard.catastro.errors.numberNotFound
wizard.catastro.errors.addressNotResolved
```

## Unidades

- Internamente, la superficie debe mantenerse en `m²` salvo que el repo ya use otra unidad canónica.
- En español: mostrar `m²`.
- En inglés: mostrar `sq ft`.
- En alemán: mostrar `m²`.
- No duplicar conversiones.
- Usar los helpers centralizados existentes, como `formatArea`, si ya están disponibles.

---

# Fase 6 — UX y diseño

## Objetivo

Mejorar la usabilidad sin rediseñar la pantalla completa.

## Requisitos visuales

- Mantener estética premium oscura actual.
- Mantener layout mobile-first.
- Mantener el bloque Catastro como opcional.
- El autocomplete debe ser legible y usable.
- Las sugerencias no deben tapar botones de forma problemática.
- El panel de detalle debe funcionar bien en escritorio y móvil.
- La tarjeta seleccionada debe tener estado visual claro.
- Los errores deben ser concretos y no alarmistas.

## Microcopy recomendado en español

```txt
Busca la vía escribiendo al menos 3 caracteres.
Selecciona una vía de Catastro para mejorar la precisión de la búsqueda.
No hemos encontrado esa dirección exacta. Puedes revisar la vía y el número o continuar manualmente.
Datos obtenidos de la Sede Electrónica del Catastro. Revísalos antes de confirmar.
```

Traducir estos textos a inglés y alemán dentro del sistema i18n.

---

# Fase 7 — Tests

## Objetivo

Asegurar que las mejoras no se rompen en la siguiente iteración.

## Tests mínimos

Añade o actualiza tests para:

### Backend

1. `/api/catastro/streets`:
   - rechaza query con menos de 3 caracteres,
   - devuelve sugerencias normalizadas,
   - maneja servicio externo caído.

2. `/api/catastro/resolve` por dirección:
   - valida campos obligatorios,
   - usa vía seleccionada o resuelta,
   - devuelve coincidencias normalizadas,
   - devuelve error controlado cuando no hay resultados.

3. Normalización:
   - mayúsculas/minúsculas,
   - tildes si aplica,
   - espacios duplicados,
   - tipo de vía,
   - número.

### Frontend

1. El autocomplete no llama API con menos de 3 caracteres.
2. El autocomplete muestra sugerencias al escribir `MIQUEL`.
3. Seleccionar sugerencia rellena el input.
4. Buscar por dirección muestra coincidencias.
5. Pulsar una coincidencia abre detalle.
6. Confirmar coincidencia rellena el wizard.
7. El fallback manual sigue disponible.

### i18n

1. En inglés no aparecen textos nuevos en español.
2. En alemán no aparecen textos nuevos en español.
3. La superficie recuperada se muestra con unidad correcta según configuración.

## Mocking

No dependas de Catastro real para tests unitarios. Mockea respuestas del cliente Catastro.

Para QA manual sí puedes probar contra el servicio real si está configurado.

---

# Fase 8 — QA manual obligatoria

## Objetivo

Verificar en navegador que el flujo funciona de verdad.

## Arranque

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000/wizard
```

## Casos de prueba manuales

### Caso 1 — Autocomplete de vía

1. Seleccionar:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
```

2. Escribir:

```txt
MIQUEL
```

3. Verificar que aparecen sugerencias, incluyendo si Catastro las devuelve:

```txt
MIQUEL ROSSELLO I ALEMANY
```

4. Seleccionar la vía.

Resultado esperado: el input queda relleno y la app guarda el dato normalizado.

### Caso 2 — Búsqueda por dirección

Usar:

```txt
Provincia: ILLES BALEARS
Municipio: PALMA
Vía: MIQUEL ROSSELLO I ALEMANY
Número: 48
```

Resultado esperado:

- aparece una o varias coincidencias,
- no aparece el error genérico de no coincidencias si Catastro devuelve datos,
- las coincidencias tienen dirección entendible.

### Caso 3 — Búsqueda por RC

Usar:

```txt
6485534DD6768E0003QD
```

Resultado esperado:

- aparece coincidencia,
- al pulsar la tarjeta o flecha se abre detalle,
- se puede confirmar la vivienda,
- los campos del wizard se rellenan.

### Caso 4 — Fallback manual

Introducir una dirección inexistente.

Resultado esperado:

- error claro,
- el usuario puede seguir manualmente.

### Caso 5 — Idiomas

Repetir revisión visual mínima en:

- ES · € · m²
- EN · £ · sq ft
- DE · € · m²

Resultado esperado:

- no se mezclan idiomas,
- las nuevas pantallas y errores están traducidos,
- las superficies usan la unidad correcta.

---

# Fase 9 — Comandos de verificación

Ejecuta los scripts reales disponibles en `package.json`.

Intenta como mínimo:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si algún script no existe, no lo inventes. Indica el equivalente real usado.

También ejecuta pruebas específicas si existen, por ejemplo:

```bash
npm test -- catastro
npm test -- wizard
```

---

# Fase 10 — Informe final

## Objetivo

Dejar trazabilidad clara de lo implementado.

Crea o actualiza un informe en una ruta coherente, por ejemplo:

```txt
sdd/features/catastro-integration/QA_REPORT_AUTOCOMPLETE_DETAIL.md
```

Debe incluir:

1. Resumen del problema inicial.
2. Causa raíz de por qué fallaba la búsqueda por dirección.
3. Causa raíz de por qué el click sobre coincidencia no hacía nada.
4. Solución aplicada.
5. Endpoints modificados.
6. Componentes modificados.
7. Cambios i18n.
8. Tests añadidos/actualizados.
9. QA manual con resultados.
10. Limitaciones pendientes.
11. Riesgos técnicos.

## Commit sugerido

```bash
git add .
git commit -m "fix: improve catastro address search and match details"
```

## PR sugerida

Título:

```txt
fix: improve Catastro address search and match details
```

Cuerpo del PR:

```md
## Summary
- Adds street autocomplete for Catastro address search.
- Fixes address-based property resolution.
- Makes match cards interactive with a detail/confirmation flow.
- Preserves manual fallback and i18n/unit consistency.

## QA
- [ ] lint
- [ ] typecheck
- [ ] tests
- [ ] build
- [ ] manual wizard QA ES
- [ ] manual wizard QA EN
- [ ] manual wizard QA DE

## Notes
- Document any limitations of the official Catastro service or unavailable fields.
```

---

# Restricciones fuertes

- No trabajar en `main`.
- No rediseñar el wizard completo.
- No eliminar la búsqueda por referencia catastral.
- No bloquear el flujo manual.
- No llamar a Catastro directamente desde el frontend.
- No dejar URLs placeholder.
- No meter textos visibles hardcodeados.
- No romper i18n.
- No duplicar lógica de conversión de superficies.
- No mostrar raw responses al usuario final.
- No añadir dependencias pesadas salvo justificación clara.
- No cerrar la tarea sin QA manual real.

---

# Criterios de aceptación finales

La tarea estará completa cuando:

1. Al escribir al menos 3 caracteres en `Calle / vía`, aparecen sugerencias reales o mockeadas correctamente desde backend según provincia/municipio.
2. La búsqueda por dirección funciona para el caso `ILLES BALEARS / PALMA / MIQUEL ROSSELLO I ALEMANY / 48` si Catastro devuelve datos.
3. Si no hay resultados, el mensaje explica el problema y permite continuar manualmente.
4. La búsqueda por RC sigue funcionando.
5. Al pulsar una coincidencia recuperada, se abre detalle o se confirma de forma clara.
6. Existe botón o acción explícita para usar esa vivienda.
7. Al confirmar, el wizard queda rellenado con los datos disponibles.
8. Todo el nuevo copy está traducido a ES/EN/DE.
9. Las superficies se muestran con `m²` o `sq ft` según configuración activa.
10. Tests relevantes pasan.
11. Build pasa.
12. Hay informe QA final.
13. Hay commit y PR listos para revisión.

---

# Nota técnica final

La prioridad no es añadir más pantallas. La prioridad es cerrar el flujo real:

```txt
buscar vía → seleccionar vía → buscar inmueble por dirección → ver coincidencia → ver detalle → confirmar → rellenar wizard → continuar análisis
```

Ese flujo debe quedar sólido, claro y probado.

