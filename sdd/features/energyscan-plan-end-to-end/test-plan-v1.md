# Test Plan v1 — EnergyScan Plan End-to-End

## Tests unitarios

- Scoring:
  - Código postal desconocido.
  - Datos mínimos válidos.
  - Vivienda nueva con bomba de calor y fotovoltaica.
  - Vivienda antigua sin aislamiento ni renovables.
  - Ventanas mejoradas con sistema fósil.
  - Renovables con envolvente deficiente.
  - Clamping 0-100.
  - Explicación, penalizaciones, fortalezas y trazabilidad por categorías.
- Normativa:
  - Directiva (UE) 2024/1275 como marco vigente.
  - Real Decreto 390/2021 como regulación española del CEE oficial.
  - Ausencia de redacción EPBD como borrador.
- Simulador:
  - Escenarios accionables con medidas, racional, prioridad, complejidad y disclaimers.
- Ayudas:
  - Items informativos sin prometer elegibilidad ni importes.
- Adjuntos:
  - Tipos permitidos.
  - Rechazo de extensiones no permitidas.
  - Límites por archivo y total.
- Leads:
  - Validación Zod de consentimiento y contacto mínimo.

## Validación manual

- Wizard -> API -> Resultados.
- Resultados mobile-first: score, confianza, normativa, escenarios, ayudas, adjuntos y proveedores.
- Descarga PDF.
- Descarga de adjuntos demo.
- Lead form en resultados.

## Comandos

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
