ALTER TABLE "Assessment" ADD COLUMN "source" TEXT,
ADD COLUMN "partnerSlug" TEXT,
ADD COLUMN "providerId" TEXT,
ADD COLUMN "attributionOwner" TEXT,
ADD COLUMN "attributionExpiresAt" TIMESTAMP(3);

ALTER TABLE "Provider" ADD COLUMN "leadCreditsBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "contactUnlockedAt" TIMESTAMP(3);

CREATE TABLE "EmailLog" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL,
  "toEmailHash" TEXT,
  "userId" TEXT,
  "assessmentId" TEXT,
  "provider" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "externalId" TEXT,
  "error" TEXT,
  "metadataJson" JSONB,
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckoutRecovery" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "stripeSessionId" TEXT,
  "userEmailHash" TEXT,
  "recoverySentAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "CheckoutRecovery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutRecovery_assessmentId_key" ON "CheckoutRecovery"("assessmentId");
ALTER TABLE "CheckoutRecovery" ADD CONSTRAINT "CheckoutRecovery_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AnalyticsEventLog" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event" TEXT NOT NULL,
  "userId" TEXT,
  "assessmentId" TEXT,
  "productType" TEXT,
  "source" TEXT,
  "metadataJson" JSONB,
  CONSTRAINT "AnalyticsEventLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEventLog_event_createdAt_idx" ON "AnalyticsEventLog"("event", "createdAt");
ALTER TABLE "AnalyticsEventLog" ADD CONSTRAINT "AnalyticsEventLog_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BudgetReview" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT,
  "source" TEXT,
  "fileName" TEXT,
  "filePath" TEXT,
  "rawTextHash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "extractionConfidence" DOUBLE PRECISION,
  "totalAmountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "summaryJson" JSONB,
  "lineItemsJson" JSONB,
  "findingsJson" JSONB,
  "paidAt" TIMESTAMP(3),
  "stripeSessionId" TEXT,
  "stripePaymentIntent" TEXT,
  "paidAmountCents" INTEGER,
  "paidCurrency" TEXT,
  CONSTRAINT "BudgetReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetReview_stripeSessionId_key" ON "BudgetReview"("stripeSessionId");

CREATE TABLE "ProviderAccount" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OWNER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "ProviderAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderAccount_userId_key" ON "ProviderAccount"("userId");
CREATE UNIQUE INDEX "ProviderAccount_providerId_key" ON "ProviderAccount"("providerId");
ALTER TABLE "ProviderAccount" ADD CONSTRAINT "ProviderAccount_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProviderLeadCreditLedger" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "providerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "leadId" TEXT,
  "stripeSessionId" TEXT,
  "notes" TEXT,
  CONSTRAINT "ProviderLeadCreditLedger_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProviderLeadCreditLedger" ADD CONSTRAINT "ProviderLeadCreditLedger_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProviderSubscription" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'INACTIVE',
  "plan" TEXT,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "currentPeriodEnd" TIMESTAMP(3),
  CONSTRAINT "ProviderSubscription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProviderSubscription" ADD CONSTRAINT "ProviderSubscription_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProfessionalAccessRequest" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "role" TEXT,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "ProfessionalAccessRequest_pkey" PRIMARY KEY ("id")
);
