-- Premium Checkout monetization fields for one-time Stripe payments.

ALTER TABLE "Assessment" ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "stripePaymentIntent" TEXT,
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "paidAmountCents" INTEGER,
ADD COLUMN "paidCurrency" TEXT,
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';

CREATE UNIQUE INDEX "Assessment_stripeSessionId_key" ON "Assessment"("stripeSessionId");
