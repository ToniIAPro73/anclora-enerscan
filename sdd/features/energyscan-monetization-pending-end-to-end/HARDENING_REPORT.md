# Hardening report - monetization flows

## Scope

Reviewed commit `a4cbdf5` on the monetization branch for staging hardening. Changes were limited to functional QA, Stripe checkout/webhook behavior, i18n usage in new pages/components, and admin protection.

No public API, white-label, Stripe Billing for professional plans, or new monetization feature was added.

## Branch

`fix/monetization-stripe-i18n-hardening`

## Stripe audit

### Premium report

- Checkout route: `src/app/api/checkout/route.ts`.
- Metadata now includes:
  - `productType=premium_report`
  - `assessmentId`
  - `userId` when available
  - `amountCents`
  - `currency`
- Webhook marks only `Assessment.paidAt`.
- Webhook uses `paidAt: null` in the update guard to avoid duplicated paid transitions.
- Email and analytics side effects only run after a successful first paid transition.
- Repeated completed events for an already paid assessment are ignored safely.

### Budget review

- Checkout route: `src/app/api/budget-review/checkout/route.ts`.
- Metadata now includes:
  - `productType=budget_review`
  - `budgetReviewId`
  - `userId` when available
  - `amountCents`
  - `currency`
- Webhook marks only `BudgetReview.paidAt`.
- Webhook uses `paidAt: null` to avoid duplicated paid transitions.
- Unknown or repeated events do not update `Assessment`.

### Provider lead pack

- Checkout route: `src/app/api/provider/credits/checkout/route.ts`.
- Metadata now includes:
  - `productType=provider_lead_pack`
  - `providerId`
  - `userId`
  - `amountCents`
  - `currency`
  - `credits`
- Webhook credits only `Provider.leadCreditsBalance`.
- Credit purchase ledger is checked before incrementing credits.
- `ProviderLeadCreditLedger.stripeSessionId` is now unique to harden idempotency.
- Credit increment and ledger creation run in a Prisma transaction.

## Webhook behavior

- `checkout.session.completed` routes by `metadata.productType`.
- Unknown `productType` values are ignored safely.
- Unknown Stripe event types still return `{ received: true }` without writes.
- `checkout.session.expired` updates Premium assessments or BudgetReview status only when unpaid.
- Analytics and email calls remain non-blocking at integration level through the existing abstractions.

## Admin metrics protection

- Added `middleware.ts` with server-side guard for `/admin/metrics`.
- Non-admin users receive an HTTP `403` JSON response before page rendering.
- Page-level guard remains as a fallback view.
- No auxiliary metrics API was added or exposed.

## i18n hardening

- Added `src/lib/monetization/i18n.ts` with ES/EN/DE copy groups for monetization pages.
- Replaced visible hardcoded text in the new pages/components with i18n copy lookups:
  - `/ciudad/[slug]`
  - `/calculadora-ahorro`
  - `/budget-review`
  - `/proveedores`
  - `/provider/register`
  - `/provider/dashboard`
  - `/provider/leads`
  - `/provider/billing`
  - `/partner/[slug]`
  - `/profesional`
  - `/profesional/solicitar`
  - `/dashboard`
  - `/admin/metrics`
- Existing legal framing remains: EnergyScan is an indicative pre-assessment and does not replace the official CEE or qualified technical review.

## Prisma changes

- `ProviderLeadCreditLedger.stripeSessionId` changed to `@unique`.
- New migration:
  - `prisma/migrations/20260516224500_harden_provider_credit_idempotency/migration.sql`

## Tests added or adjusted

- `tests/checkout.test.ts`
  - Premium checkout metadata now asserts `productType`, `assessmentId`, `userId`, `amountCents`, and `currency`.
- `tests/budget-review-checkout.test.ts`
  - Covers BudgetReview checkout metadata and checkout persistence.
- `tests/provider-credits-checkout.test.ts`
  - Covers provider lead pack checkout metadata.
- `tests/stripe-webhook.test.ts`
  - Covers Premium paid transition.
  - Covers duplicate Premium completed event.
  - Covers BudgetReview paid transition without touching Assessment.
  - Covers provider credit purchase.
  - Covers duplicate provider credit webhook.
  - Covers unknown event safe ignore.

## QA commands

- `npx prisma generate`: passed.
- `npx tsc --noEmit`: passed.
- `npm test`: passed, 39 suites / 153 tests.
- `npm run lint`: passed.
- `npm run build`: passed.

## Remaining staging checks

- Run a Stripe CLI webhook replay for the three products against a staging database.
- Verify `ADMIN_EMAILS` is set before exposing `/admin/metrics`.
- Verify there are no existing duplicate non-null `ProviderLeadCreditLedger.stripeSessionId` rows before applying the unique index in a non-empty environment.
