# QA Visual Report

## Environment

- Local dev server: `http://localhost:3000`
- Browser automation: Playwright CLI
- Date: 2026-05-18

## Routes Reviewed

- `/dashboard`
- `/provider/dashboard`
- `/provider/leads`
- `/provider/billing`
- `/profesional`
- `/profesional/solicitar`
- `/profesional/dashboard`
- `/assessment/[id]`
- `/budget-review`

## Viewports

- Mobile: `390x844`
- Desktop: `1440x900`
- Tablet target included in layout checks through responsive grid behavior; no separate screenshot artifact was kept.

## Languages

- ES reviewed on dashboard/provider/professional.
- EN reviewed on dashboard after setting `enerscan-language=en`.
- DE reviewed on dashboard after setting `enerscan-language=de`.

## Themes

- Dark mode reviewed on dashboard/provider/professional.
- Light mode reviewed on dashboard.

## States Reviewed

- Anonymous dashboard state.
- Authenticated residential user with no data.
- Authenticated residential user with free and paid assessments.
- Paid and unpaid budget reviews.
- Approved professional beta access with cases.
- Verified provider with credits.
- Provider leads with one locked and one unlocked contact.

## Captures

- `output/playwright/connected-dashboard-desktop.png`
- `output/playwright/connected-dashboard-mobile.png`
- `output/playwright/provider-leads-desktop.png`
- `output/playwright/professional-dashboard-desktop.png`
- `output/playwright/connected-dashboard-light-de.png`

## Issues Found

- Mixed language appeared in connected pages when server-rendered pages reused client preference components for PDF/checkout labels.
- Fixed by passing localized labels into `CheckoutButton` and `PdfDownloadLink`.

## Residual Notes

- Some persisted raw values such as `house`, `flat` and `DRAFT` are displayed as data values. They do not expose personal data, but should be normalized in a future UI polish pass.
- No horizontal overflow or illegible mobile table layout was observed on the reviewed core surfaces.
