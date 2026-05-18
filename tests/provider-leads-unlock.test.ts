jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

const mockPrisma: any = {
    providerAccount: {
      findUnique: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    provider: {
      update: jest.fn(),
    },
    providerLeadCreditLedger: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(mockPrisma)),
  };

import { POST as POST_STATUS } from '@/app/api/provider/leads/[id]/status/route';
import { POST as POST_UNLOCK } from '@/app/api/provider/leads/[id]/unlock/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const routeParams = { params: { id: 'lead_123' } };

describe('provider lead unlock and status APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects anonymous unlock', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const response = await POST_UNLOCK(new Request('http://localhost:3000/api/provider/leads/lead_123/unlock', {
      method: 'POST',
    }), routeParams);

    expect(response.status).toBe(401);
  });

  it('unlocks contact and consumes one credit', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({
      providerId: 'prov_123',
      provider: { leadCreditsBalance: 2 },
    });
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      id: 'lead_123',
      providerId: 'prov_123',
      status: 'PENDING',
      contactUnlockedAt: null,
      userName: 'Buyer',
      userEmail: 'buyer@example.com',
      userPhone: '+34000000000',
    });
    (prisma.lead.update as jest.Mock).mockResolvedValue({
      id: 'lead_123',
      status: 'PENDING',
      contactUnlockedAt: new Date(),
      userName: 'Buyer',
      userEmail: 'buyer@example.com',
      userPhone: '+34000000000',
    });

    const response = await POST_UNLOCK(new Request('http://localhost:3000/api/provider/leads/lead_123/unlock', {
      method: 'POST',
    }), routeParams);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.consumed).toBe(true);
    expect(payload.lead.userEmail).toBe('buyer@example.com');
    expect(prisma.provider.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'prov_123' },
      data: { leadCreditsBalance: { decrement: 1 } },
    }));
    expect(prisma.providerLeadCreditLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerId: 'prov_123', leadId: 'lead_123', type: 'CONSUME', credits: -1 }),
    }));
  });

  it('does not consume credit twice for an already unlocked lead', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({
      providerId: 'prov_123',
      provider: { leadCreditsBalance: 2 },
    });
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      id: 'lead_123',
      providerId: 'prov_123',
      status: 'PENDING',
      contactUnlockedAt: new Date(),
      userName: 'Buyer',
      userEmail: 'buyer@example.com',
      userPhone: '+34000000000',
    });

    const response = await POST_UNLOCK(new Request('http://localhost:3000/api/provider/leads/lead_123/unlock', {
      method: 'POST',
    }), routeParams);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.consumed).toBe(false);
    expect(prisma.provider.update).not.toHaveBeenCalled();
    expect(prisma.providerLeadCreditLedger.create).not.toHaveBeenCalled();
  });

  it('fails unlock without credits', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({
      providerId: 'prov_123',
      provider: { leadCreditsBalance: 0 },
    });
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({
      id: 'lead_123',
      providerId: 'prov_123',
      contactUnlockedAt: null,
    });

    const response = await POST_UNLOCK(new Request('http://localhost:3000/api/provider/leads/lead_123/unlock', {
      method: 'POST',
    }), routeParams);

    expect(response.status).toBe(402);
    expect(prisma.provider.update).not.toHaveBeenCalled();
  });

  it('changes commercial status for own lead', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({ providerId: 'prov_123' });
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue({ id: 'lead_123', providerId: 'prov_123' });
    (prisma.lead.update as jest.Mock).mockResolvedValue({
      id: 'lead_123',
      status: 'CONTACTED',
      contactUnlockedAt: null,
      userName: null,
      userEmail: null,
      userPhone: null,
    });

    const response = await POST_STATUS(new Request('http://localhost:3000/api/provider/leads/lead_123/status', {
      method: 'POST',
      body: JSON.stringify({ status: 'CONTACTED' }),
    }), routeParams);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.lead.status).toBe('CONTACTED');
  });

  it('rejects arbitrary lead status', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({ providerId: 'prov_123' });

    const response = await POST_STATUS(new Request('http://localhost:3000/api/provider/leads/lead_123/status', {
      method: 'POST',
      body: JSON.stringify({ status: 'ARCHIVED' }),
    }), routeParams);

    expect(response.status).toBe(400);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('does not mutate another provider lead', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.providerAccount.findUnique as jest.Mock).mockResolvedValue({ providerId: 'prov_123' });
    (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST_STATUS(new Request('http://localhost:3000/api/provider/leads/lead_other/status', {
      method: 'POST',
      body: JSON.stringify({ status: 'WON' }),
    }), { params: { id: 'lead_other' } });

    expect(response.status).toBe(404);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });
});
