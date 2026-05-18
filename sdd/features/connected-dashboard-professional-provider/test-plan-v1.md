# Test Plan: Connected Dashboard, Professional Beta and Provider Operations

## Automated Tests

- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`

## Focus Areas

- Residential dashboard:
  - anonymous state shows login CTA,
  - authenticated empty state,
  - free assessment exposes Premium unlock,
  - paid assessment exposes PDF,
  - budget reviews show paid/unpaid state,
  - records are scoped by `session.user.id`.
- Professional:
  - invalid access request fails,
  - duplicate email does not create a second request,
  - `/api/professional-access/me` requires session,
  - status resolves by session email,
  - dashboard gates NONE/PENDING/REJECTED and shows cases for APPROVED.
- Provider:
  - provider account required,
  - provider sees only own leads,
  - locked lead hides personal contact,
  - unlock consumes one credit and writes ledger,
  - repeated unlock is idempotent,
  - unlock without credits fails,
  - status update accepts only allowed states,
  - cross-provider mutation fails.
- Stripe credits:
  - checkout metadata includes providerId,
  - webhook increments credits once,
  - duplicate webhook does not duplicate credits.

## Manual Visual QA

- Viewports: `390x844`, `768x1024`, `1440x900`.
- Themes: dark and light.
- Languages: ES, EN, DE.
- Routes: `/dashboard`, `/provider/dashboard`, `/provider/leads`, `/provider/billing`, `/profesional`, `/profesional/solicitar`, `/profesional/dashboard`, `/assessment/[id]`, `/budget-review`, `/checkout/success`.

## Acceptance Checks

- No horizontal overflow on dashboard/provider/professional core pages.
- Primary CTAs visible on mobile.
- Leads table uses card layout on mobile.
- No contact name/email/phone is visible before unlock.
- Legal/indicative copy remains present.
- No new copy claims official CEE issuance.
