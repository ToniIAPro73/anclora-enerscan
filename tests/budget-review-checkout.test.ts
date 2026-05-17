jest.mock('@/lib/prisma', () => ({
  prisma: {
    budgetReview: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockCreateSession = jest.fn();

jest.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: mockCreateSession } },
  }),
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

import { POST } from '@/app/api/budget-review/checkout/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/budget-review/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_BUDGET_REVIEW_PRICE_EUR = '19.90';
    delete process.env.STRIPE_PRICE_BUDGET_REVIEW;
  });

  it('creates budget review checkout with unambiguous metadata', async () => {
    (prisma.budgetReview.findUnique as jest.Mock).mockResolvedValue({
      id: 'br_123',
      userId: 'user_123',
      paidAt: null,
    });
    mockCreateSession.mockResolvedValue({ id: 'cs_budget_123', url: 'https://checkout.stripe.com/c/pay/cs_budget_123' });

    const response = await POST(new Request('http://localhost:3000/api/budget-review/checkout', {
      method: 'POST',
      body: JSON.stringify({ budgetReviewId: 'br_123' }),
    }));

    expect(response.status).toBe(200);
    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        amountCents: '1990',
        budgetReviewId: 'br_123',
        currency: 'eur',
        productType: 'budget_review',
        userId: 'user_123',
      }),
    }));
    expect(prisma.budgetReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ stripeSessionId: 'cs_budget_123', status: 'CHECKOUT_STARTED' }),
    }));
  });
});
