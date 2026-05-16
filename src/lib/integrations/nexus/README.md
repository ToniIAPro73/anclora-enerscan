# Nexus integration

EnergyScan prepares `EnergyAssessmentLead` payloads for future ingestion by Anclora Nexus.

The client is server-side only and runs in no-op mode unless `NEXUS_API_URL` and `NEXUS_SERVICE_TOKEN` are configured. Payloads intentionally exclude attachments, images and heavy documents.
