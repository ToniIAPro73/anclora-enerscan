# Execution report

## Initial state

- Branch created: `feat/energyscan-premium-preferences-i18n`.
- Main was synced before the feature branch.
- Existing untracked files were preserved and not cleaned.

## Historical recovery

- Reviewed previous language/preference implementation in commit `de1e7b620070e01b2677338407666352dad8a4cb`.
- Reused the useful preference concept and toggle structure.
- Did not blindly restore old files because current app has newer auth, PDF, legal and attachment behavior.

## Nexus reference

`/home/toni/projects/anclora-nexus` was inspected conceptually for preference terms. No dependency or architecture was copied into EnergyScan.

## Implemented

- Restored language toggle ES/EN/DE.
- Added currency toggle EUR/GBP.
- Added measurement toggle m²/sq ft.
- Preserved theme toggle dark/light/system.
- Added cookies for SSR/PDF preference handoff.
- Added localized landing, auth, legal, footer, result and PDF copy.
- Added dynamic PDF query support: `lang`, `currency`, `units`.
- Added GBP and sq ft formatting in Premium PDF.
- Kept Spanish CEE annex content unchanged with m²/euro units.
- Expanded OAuth env aliases for Google/GitHub.
- Updated `.env.example`.

## Validation

- `npm test`: PASS, 17 suites, 76 tests.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

## PDF validation

Generated `/tmp/energyscan-demo-en-v2.pdf` from local server with:

```txt
lang=en&currency=GBP&units=imperial
```

Observed:

- 23 pages.
- EnergyScan wrapper contains GBP (`£`) and sq ft.
- Cost line quantities convert m² to sq ft where relevant.
- Appended CEE pages remain in Spanish and include m², as required for the Spanish official-document attachment.

## Mobile-first QA

Tooling:

- Playwright CLI via local skill.
- Browser installed during QA because Chrome was missing.

Viewport reviewed:

- 390x844.

Screens reviewed:

- Landing.
- Wizard.
- Language/currency/unit toggles.

Findings:

- Initial EN landing review showed Spanish text leakage in regulatory timeline and pricing bullets.
- Corrected those blocks.
- Wizard top flow renders in EN with GBP/sq ft toggles active after language switch.

## Remaining risks

- Some technical source strings from regulatory/cost engines are still Spanish internally and are summarized or replaced in visible EN/DE surfaces where practical.
- Full professional translation pass is still recommended before a premium public launch.
