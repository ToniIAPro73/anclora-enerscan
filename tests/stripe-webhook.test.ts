jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    budgetReview: {
      updateMany: jest.fn(),
    },
    provider: {
      update: jest.fn(),
    },
    providerLeadCreditLedger: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

const mockConstructEvent = jest.fn();

jest.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendPremiumPurchaseEmail: jest.fn(),
}));

import { POST } from '@/app/api/webhook/stripe/route';
import { prisma } from '@/lib/prisma';
import { sendPremiumPurchaseEmail } from '@/lib/email';

describe('POST /api/webhook/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 400 for invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'bad' },
      body: '{}',
    }));

    expect(response.status).toBe(400);
  });

  it('marks checkout.session.completed as paid', async () => {
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue({ paidAt: null, user: { email: 'buyer@example.com' } });
    (prisma.assessment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { assessmentId: 'assess_123', productType: 'premium_report', userId: 'user_123', amountCents: '990', currency: 'eur' },
          payment_intent: 'pi_123',
          customer: 'cus_123',
          amount_total: 990,
          currency: 'eur',
          customer_details: { email: 'buyer@example.com' },
        },
      },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.assessment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'assess_123', paidAt: null },
      data: expect.objectContaining({
        isPremium: true,
        paymentStatus: 'paid',
        stripeSessionId: 'cs_test_123',
        stripePaymentIntent: 'pi_123',
        paidAmountCents: 990,
        paidCurrency: 'eur',
      }),
    }));
    expect(sendPremiumPurchaseEmail).toHaveBeenCalledWith(expect.objectContaining({ assessmentId: 'assess_123' }));
  });

  it('does not duplicate premium payment side effects', async () => {
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue({ paidAt: new Date(), user: { email: 'buyer@example.com' } });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_repeat', metadata: { assessmentId: 'assess_123', productType: 'premium_report' } } },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.assessment.updateMany).not.toHaveBeenCalled();
    expect(sendPremiumPurchaseEmail).not.toHaveBeenCalled();
  });

  it('marks budget review paid without touching assessment', async () => {
    (prisma.budgetReview.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_budget_123',
          metadata: { productType: 'budget_review', budgetReviewId: 'br_123', userId: 'user_123', amountCents: '1990', currency: 'eur' },
          payment_intent: 'pi_budget',
          amount_total: 1990,
          currency: 'eur',
        },
      },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.budgetReview.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'br_123', paidAt: null },
      data: expect.objectContaining({ status: 'PAID', stripeSessionId: 'cs_budget_123', stripePaymentIntent: 'pi_budget' }),
    }));
    expect(prisma.assessment.updateMany).not.toHaveBeenCalled();
  });

  it('credits provider lead pack once', async () => {
    (prisma.providerLeadCreditLedger.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.provider.update as jest.Mock).mockResolvedValue({});
    (prisma.providerLeadCreditLedger.create as jest.Mock).mockResolvedValue({});
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_provider_123',
          metadata: { productType: 'provider_lead_pack', providerId: 'prov_123', userId: 'user_123', amountCents: '30000', currency: 'eur' },
          amount_total: 30000,
          currency: 'eur',
        },
      },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.provider.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'prov_123' },
      data: { leadCreditsBalance: { increment: 10 } },
    }));
    expect(prisma.providerLeadCreditLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerId: 'prov_123', type: 'PURCHASE', stripeSessionId: 'cs_provider_123' }),
    }));
  });

  it('does not credit provider lead pack twice', async () => {
    (prisma.providerLeadCreditLedger.findFirst as jest.Mock).mockResolvedValue({ id: 'ledger_existing' });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_provider_repeat', metadata: { productType: 'provider_lead_pack', providerId: 'prov_123' } } },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.provider.update).not.toHaveBeenCalled();
    expect(prisma.providerLeadCreditLedger.create).not.toHaveBeenCalled();
  });

  it('ignores unknown events safely', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.created',
      data: { object: { id: 'cus_123' } },
    });

    const response = await POST(new Request('http://localhost:3000/api/webhook/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));

    expect(response.status).toBe(200);
    expect(prisma.assessment.updateMany).not.toHaveBeenCalled();
    expect(prisma.budgetReview.updateMany).not.toHaveBeenCalled();
  });
});
