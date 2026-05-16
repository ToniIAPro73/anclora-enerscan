jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
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

import { POST } from '@/app/api/webhook/stripe/route';
import { prisma } from '@/lib/prisma';

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
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue({ paidAt: null });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { assessmentId: 'assess_123' },
          payment_intent: 'pi_123',
          customer: 'cus_123',
          amount_total: 990,
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
    expect(prisma.assessment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'assess_123' },
      data: expect.objectContaining({
        isPremium: true,
        paymentStatus: 'paid',
        stripeSessionId: 'cs_test_123',
        stripePaymentIntent: 'pi_123',
        paidAmountCents: 990,
        paidCurrency: 'eur',
      }),
    }));
  });
});
