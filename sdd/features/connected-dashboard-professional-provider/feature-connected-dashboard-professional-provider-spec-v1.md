# Feature: Connected Dashboard, Professional Beta and Provider Operations

## Scope

Build the logged-in EnergyScan experience into an operational MVP across three roles:

- Residential users: history, payment state, Premium PDF access, budget review state, quick actions and role entry points.
- Professionals: beta access request state and a protected professional dashboard using the user's own assessments as MVP cases.
- Providers: provider account status, lead KPIs, credits, Stripe credit packs, locked personal data, explicit contact unlock and commercial status management.

## Out of Scope

- Official Energy Performance Certificate issuance.
- Full professional Stripe Billing or recurring subscription management.
- White-label PDFs, client CRM, invoicing, or provider guarantee logic.
- Global design-system rewrite.
- New heavy Prisma model changes unless a flow cannot be closed with the existing schema.

## Current Audit Summary

- Implemented: Auth.js session plumbing, `Assessment.userId`, Premium `paidAt`, BudgetReview checkout/payment, provider account association, provider credit checkout/webhook idempotency, provider ledger, lead contact unlock field, professional access request model, ES/EN/DE monetization copy groups.
- Placeholder/basic: `/dashboard`, `/provider/dashboard`, `/provider/leads`, `/provider/billing`, `/profesional`, `/profesional/solicitar`.
- Existing but incomplete flow: `PATCH /api/provider/leads/[id]` can unlock/status but lacks dedicated explicit endpoints, rich response, UI integration and tests for idempotent unlock/security.
- Models covering the use case: `Assessment`, `BudgetReview`, `Lead`, `Provider`, `ProviderAccount`, `ProviderLeadCreditLedger`, `ProviderSubscription`, `ProfessionalAccessRequest`, `User`.
- Migrations present: monetization fields and provider credit idempotency already exist through `20260516224500_harden_provider_credit_idempotency`.
- Tests present: checkout, budget review checkout, premium access, provider credit checkout, Stripe webhook and provider helper tests. Missing focused dashboard/professional/provider lead unlock tests.
- Manual/code gap: docs describe connected areas, but current pages are mostly lists/cards and do not close provider unlock/status or professional dashboard flows.

## Affected Routes

- Residential: `/dashboard`, `/assessment/[id]`, `/checkout/success`, `/budget-review`, `/pricing`.
- Professional: `/profesional`, `/profesional/solicitar`, `/profesional/dashboard`, `/api/professional-access`, `/api/professional-access/me`.
- Provider: `/provider/register`, `/provider/dashboard`, `/provider/leads`, `/provider/billing`, `/api/provider/me`, `/api/provider/leads`, `/api/provider/leads/[id]/unlock`, `/api/provider/leads/[id]/status`, `/api/provider/credits/checkout`, `/api/provider/credits/status`, `/api/webhook/stripe`.

## Residential Flow

1. Anonymous user sees a clear login CTA.
2. Logged-in user sees quick KPIs, actions and own records only.
3. Each assessment shows property summary, confidence and Premium state: free, Premium, demo or pending.
4. Paid/demo assessments expose PDF download; unpaid assessments expose Premium unlock.
5. Budget reviews show file, total, confidence, status and view/unlock action.
6. Dashboard links into provider or professional areas according to account/request state.

## Professional Flow

1. Anonymous users are guided to login/request access.
2. Logged-in users can request beta access.
3. Duplicate requests by email return the existing request state instead of creating noise.
4. `/api/professional-access/me` resolves state from the session email.
5. `/profesional/dashboard` shows NONE/PENDING/APPROVED/REJECTED states.
6. Approved users see MVP cases from `Assessment.userId = session.user.id`.

## Provider Flow

1. Registered provider account sees provider status, credits and lead KPIs.
2. Leads list shows non-personal technical/request data by default.
3. Contact data remains hidden until `contactUnlockedAt` exists.
4. Unlock is an explicit POST, scoped to provider ownership, transacted with credit decrement and `ProviderLeadCreditLedger` consumption.
5. Repeated unlock on an already unlocked lead returns contact without consuming another credit.
6. Commercial status changes are explicit, enum-validated and scoped to provider ownership.
7. Billing remains Stripe test/local compatible and webhook idempotency stays based on `stripeSessionId`.

## Legal and Privacy Risks

- EnergyScan must remain framed as an indicative prediagnosis, not an official CEE.
- Costs, savings, grants, confidence and budget findings are estimates.
- Lead personal data must not render until explicit unlock.
- Lead personal data may only be used with consent and for the requested commercial purpose.
- Provider states such as verified/preferred may be shown, but must not imply guaranteed quality unless backed by the model status.

## Acceptance Criteria

- `/dashboard` is useful on mobile and desktop, with KPIs, history, budget reviews, role entry points and next steps.
- Professional beta request avoids duplicate submissions and exposes a session-scoped status endpoint.
- `/profesional/dashboard` gates access by request state and shows cases only for the current user.
- Provider dashboard and leads are operational, not static.
- Contact unlock is idempotent, transacted, ledger-backed and tested.
- Lead status mutation is provider-scoped, enum-validated and tested.
- Provider credit Stripe flow remains idempotent and tested.
- All new visible copy uses existing ES/EN/DE monetization i18n.
- No new visible copy suggests official CEE issuance.
- Tests, lint and build are run or blockers are documented.
- Visual QA is performed and documented for the new connected surfaces.
