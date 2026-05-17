jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockCreateSession = jest.fn();

jest.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  }),
  PREMIUM_CURRENCY: 'eur',
  PREMIUM_PRICE_CENTS: 990,
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

import { POST } from '@/app/api/checkout/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.STRIPE_PRICE_PREMIUM;
  });

  it('returns 400 without assessmentId', async () => {
    const response = await POST(new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
    }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for stateless local assessment ids', async () => {
    const response = await POST(new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ assessmentId: 'local_payload' }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.error).toBe('persisted_assessment_required');
    expect(prisma.assessment.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 for missing assessment', async () => {
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue(null);
    const response = await POST(new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ assessmentId: 'missing' }),
    }));
    expect(response.status).toBe(404);
  });

  it('does not create duplicate checkout for paid assessment', async () => {
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue({
      id: 'assess_paid',
      isDemo: false,
      paidAt: new Date(),
      paymentStatus: 'paid',
    });
    const response = await POST(new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ assessmentId: 'assess_paid' }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.url).toBe('http://localhost:3000/checkout/success?assessment_id=assess_paid');
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('creates Stripe checkout with assessment metadata', async () => {
    (prisma.assessment.findUnique as jest.Mock).mockResolvedValue({
      id: 'assess_123',
      userId: 'user_123',
      isDemo: false,
      paidAt: null,
      paymentStatus: 'unpaid',
      user: { email: 'buyer@example.com' },
    });
    mockCreateSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });

    const response = await POST(new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ assessmentId: 'assess_123' }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.url).toContain('checkout.stripe.com');
    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      metadata: expect.objectContaining({
        amountCents: '990',
        assessmentId: 'assess_123',
        currency: 'eur',
        productType: 'premium_report',
        userId: 'user_123',
      }),
    }));
    expect(prisma.assessment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ stripeSessionId: 'cs_test_123', paymentStatus: 'checkout_started' }),
    }));
  });
});
