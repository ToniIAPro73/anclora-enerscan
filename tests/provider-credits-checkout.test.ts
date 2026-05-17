jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    providerAccount: {
      findUnique: jest.fn(),
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

import { POST } from '@/app/api/provider/credits/checkout/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('POST /api/provider/credits/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_PROVIDER_LEAD_PACK_PRICE_EUR = '300';
    process.env.PROVIDER_LEAD_PACK_CREDITS = '10';
    delete process.env.STRIPE_PRICE_PROVIDER_LEAD_PACK;
  });

  it('creates provider lead pack checkout with unambiguous metadata', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({ providerId: 'prov_123' });
    mockCreateSession.mockResolvedValue({ id: 'cs_provider_123', url: 'https://checkout.stripe.com/c/pay/cs_provider_123' });

    const response = await POST(new Request('http://localhost:3000/api/provider/credits/checkout', {
      method: 'POST',
    }));

    expect(response.status).toBe(200);
    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        amountCents: '30000',
        credits: '10',
        currency: 'eur',
        productType: 'provider_lead_pack',
        providerId: 'prov_123',
        userId: 'user_123',
      }),
    }));
  });
});
