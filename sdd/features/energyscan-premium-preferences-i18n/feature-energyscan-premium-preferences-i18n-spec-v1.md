# Feature: EnergyScan premium preferences and i18n

## Scope

Implement a coherent preference layer for Anclora EnergyScan:

- Theme: dark, light, system.
- Language: ES, EN, DE.
- Currency: EUR, GBP.
- Measurement: metric m², imperial sq ft.

Default remains Spanish, EUR, metric, dark. Language changes apply predictable presets: ES/DE use EUR and m²; EN uses GBP and sq ft.

## Product constraints

EnergyScan remains an indicative pre-assessment tool. It does not issue official Spanish CEE documents or administrative certificates.

The CEE annex is a special case: when a user-provided CEE is included in the premium PDF, the CEE document content remains in Spanish and keeps euros/m² because it represents a Spanish official document supplied by the user.

## Main changes

- Centralized preferences in `src/lib/preferences.ts`.
- Formatting helpers in `src/lib/formatters.ts`.
- Localized app copy in `src/lib/i18n.ts` and legal content in `src/lib/legal-content.ts`.
- Premium preference toggles in `src/components/PreferenceToggles.tsx`.
- Client provider persistence via localStorage and cookies in `src/components/AppPreferencesProvider.tsx`.
- PDF generation accepts `lang`, `currency` and `units`.
- PDF cost and area formatting adapts to the active preferences.
- Official CEE annex is appended as original PDF pages after the CEE summary.
- Social OAuth env aliases expanded for Google/GitHub.

## Out of scope

- Full professional translation of every underlying regulatory source string.
- Official CEE generation.
- Live FX rates.
- New payment flow.
