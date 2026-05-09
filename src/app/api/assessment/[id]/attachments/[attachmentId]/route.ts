import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { getDemoAssetPath, getDemoAttachmentById } from '@/lib/demo-assets';
import { parseStatelessAssessmentId } from '@/lib/stateless-assessment';
import { deleteStoredAttachment, readAttachmentBytes } from '@/lib/blob-storage';

export async function GET(_: Request, { params }: { params: { id: string; attachmentId: string } }) {
  const statelessPayload = parseStatelessAssessmentId(params.id);
  if (statelessPayload?.isDemo) {
    const attachment = getDemoAttachmentById(params.attachmentId);
    const assetPath = getDemoAssetPath(params.attachmentId);
    if (!attachment || !assetPath) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const file = await readFile(assetPath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': attachment.type,
        'Content-Disposition': `inline; filename="${attachment.name}"`,
      },
    });
  }

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

  const { bytes } = await readAttachmentBytes(attachment.path);
  return new NextResponse(new Uint8Array(bytes), {
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
    await deleteStoredAttachment(attachment.path).catch(() => undefined);
  }
  await prisma.assessmentAttachment.delete({ where: { id: attachment.id } });

  return NextResponse.json({ ok: true });
}
