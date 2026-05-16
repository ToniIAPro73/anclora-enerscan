import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  const request = await prisma.professionalAccessRequest.create({ data: parsed.data });
  return NextResponse.json({ ok: true, id: request.id });
}
