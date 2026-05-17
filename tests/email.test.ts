jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailLog: {
      create: jest.fn(),
    },
  },
}));

import { hashEmail, sendPremiumPurchaseEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

describe('email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('hashes email addresses', () => {
    expect(hashEmail(' PERSON@example.com ')).toBe(hashEmail('person@example.com'));
  });

  it('does not break purchase flow without Resend API key', async () => {
    const result = await sendPremiumPurchaseEmail({
      to: 'buyer@example.com',
      assessmentId: 'assess_1',
    });
    expect(result).toEqual({ ok: false, skipped: 'no_provider' });
    expect(prisma.emailLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SKIPPED_NO_PROVIDER' }),
    }));
  });
});
