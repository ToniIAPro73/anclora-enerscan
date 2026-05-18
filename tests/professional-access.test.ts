jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    professionalAccessRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { GET as GET_ME } from '@/app/api/professional-access/me/route';
import { POST } from '@/app/api/professional-access/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('professional access API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a valid beta access request', async () => {
    (prisma.professionalAccessRequest.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.professionalAccessRequest.create as jest.Mock).mockResolvedValue({
      id: 'par_123',
      status: 'PENDING',
    });

    const response = await POST(new Request('http://localhost:3000/api/professional-access', {
      method: 'POST',
      body: JSON.stringify({ email: 'Pro@Example.com', company: 'Studio' }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, id: 'par_123', status: 'PENDING' });
    expect(prisma.professionalAccessRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'pro@example.com' }),
    }));
  });

  it('rejects invalid email', async () => {
    const response = await POST(new Request('http://localhost:3000/api/professional-access', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad' }),
    }));

    expect(response.status).toBe(400);
    expect(prisma.professionalAccessRequest.create).not.toHaveBeenCalled();
  });

  it('does not create duplicate request for same email', async () => {
    (prisma.professionalAccessRequest.findFirst as jest.Mock).mockResolvedValue({
      id: 'par_existing',
      status: 'APPROVED',
    });

    const response = await POST(new Request('http://localhost:3000/api/professional-access', {
      method: 'POST',
      body: JSON.stringify({ email: 'pro@example.com' }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ duplicate: true, id: 'par_existing', status: 'APPROVED' });
    expect(prisma.professionalAccessRequest.create).not.toHaveBeenCalled();
  });

  it('requires session for professional status lookup', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const response = await GET_ME();

    expect(response.status).toBe(401);
  });

  it('resolves status by session email', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user_123', email: 'Pro@Example.com' } });
    (prisma.professionalAccessRequest.findFirst as jest.Mock).mockResolvedValue({
      id: 'par_123',
      status: 'PENDING',
      createdAt: new Date('2026-05-18T10:00:00Z'),
      company: 'Studio',
      role: 'Architect',
    });

    const response = await GET_ME();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.professionalAccessRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'pro@example.com' },
    }));
    expect(payload.status).toBe('PENDING');
    expect(payload.request.company).toBe('Studio');
  });
});
