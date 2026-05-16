# Feature spec v1 - EnergyScan ecosystem integrations

## Objetivo

Preparar integraciones incrementales con Nexus, Data Lab y Synergi sin romper el MVP actual.

## Nexus

Contrato: `EnergyAssessmentLead`.

Incluye assessment, contexto de inmueble, consentimiento, estado comercial y routing. Excluye adjuntos, imagenes y documentos pesados. El contacto solo se incluye si existe consentimiento de privacidad.

## Data Lab

Contrato: `EnergySignalAggregate`.

Solo emite senales agregadas/anonimizadas con umbral minimo de grupo. No incluye nombres, email, telefono, direccion exacta, referencia catastral completa ni IDs de assessment.

## Synergi

Contrato: `ProviderHandoffRequest`.

Requiere consentimiento explicito de privacidad y contacto con proveedores. El checkbox no esta premarcado. Demo assessments se marcan como demo y no deben tratarse como oportunidades reales.

## Variables de entorno

- `NEXUS_API_URL`
- `NEXUS_SERVICE_TOKEN`
- `NEXUS_ENERGY_LEAD_ENDPOINT`
- `DATA_LAB_API_URL`
- `DATA_LAB_SERVICE_TOKEN`
- `DATA_LAB_ENERGY_SIGNALS_ENDPOINT`
- `DATA_LAB_MIN_GROUP_SIZE`
- `SYNERGI_API_URL`
- `SYNERGI_SERVICE_TOKEN`
- `SYNERGI_PROVIDER_HANDOFF_ENDPOINT`
- `PROVIDER_HANDOFF_CONSENT_VERSION`

## Riesgos

- PII enviada sin consentimiento.
- Grupos Data Lab demasiado pequenos.
- Confundir prediagnostico con CEE oficial.
- Tratar demos como oportunidades reales.

## Criterios de aceptacion

- Tests unitarios de contratos pasan.
- Clientes quedan en no-op si faltan variables.
- Synergi exige consentimiento.
- Data Lab respeta agregacion minima.
- Nexus excluye adjuntos e imagenes.
