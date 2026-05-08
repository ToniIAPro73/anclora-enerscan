import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const attachment = await prisma.assessmentAttachment.findFirst({
    where: { id: params.attachmentId, assessmentId: params.id },
  });

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  if (attachment.path.startsWith('demo://')) {
    return new NextResponse('Demo file: documentation supplied for the sample assessment.', {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${attachment.name}"`,
      },
    });
  }

  const file = await readFile(attachment.path);
  return new NextResponse(file, {
    headers: {
      'Content-Type': attachment.type,
      'Content-Disposition': `attachment; filename="${attachment.name}"`,
    },
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const attachment = await prisma.assessmentAttachment.findFirst({
    where: { id: params.attachmentId, assessmentId: params.id },
  });

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  if (!attachment.path.startsWith('demo://')) {
    await unlink(attachment.path).catch(() => undefined);
  }
  await prisma.assessmentAttachment.delete({ where: { id: attachment.id } });

  return NextResponse.json({ ok: true });
}
