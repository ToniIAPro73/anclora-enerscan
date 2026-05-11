# Test plan

## Automated checks

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## Unit coverage

- Preference normalization for ES/EN/DE.
- Language presets for currency and measurement.
- Currency formatting for EUR/GBP.
- Area formatting for m²/sq ft.
- Cost line unit formatting for sq ft.
- Dictionary key alignment across ES/EN/DE.
- Demo asset consistency from existing tests.

## Manual and browser QA

- Landing mobile viewport 390x844.
- Wizard mobile viewport 390x844.
- Language toggle ES -> EN updates currency to GBP and units to sq ft.
- Landing pricing and regulatory blocks checked for obvious Spanish text leakage in EN.
- Demo PDF generated with `lang=en&currency=GBP&units=imperial`.
- Generated PDF text checked for `£` and `sq ft`.
- CEE annex checked to remain Spanish with m²/euro units because it is a Spanish official-document attachment.

## Acceptance notes

The user-provided CEE is not translated or unit-converted. Only the EnergyScan report wrapper follows active preferences.
