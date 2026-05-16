# Test plan v1 - EnergyScan ecosystem integrations

## Nexus

- Construye `EnergyAssessmentLead` valido.
- No incluye adjuntos ni imagenes.
- Marca demos.
- Omite contacto sin privacidad.
- Cliente no-op sin configuracion.

## Data Lab

- Agrupa por provincia/municipio/prefijo postal.
- Genera buckets de ano y superficie.
- Respeta `minGroupSize`.
- No emite PII ni IDs.
- Cliente no-op sin configuracion.

## Synergi

- Rechaza handoff sin consentimiento.
- Incluye snapshot de consentimiento.
- Valida i18n ES/EN/DE.
- No incluye adjuntos ni imagenes.
- Cliente no-op sin configuracion.
