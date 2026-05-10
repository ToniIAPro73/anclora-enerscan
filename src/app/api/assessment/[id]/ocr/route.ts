import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAttachmentOcr } from '@/lib/ocr';
import { isBlobAttachmentPath, readAttachmentBytes } from '@/lib/blob-storage';
import { readFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const attachments = await prisma.assessmentAttachment.findMany({
      where: { assessmentId: params.id },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        ocrStatus: true,
        ocrData: true,
        ocrProcessedAt: true,
        ocrError: true,
      },
    });

    return NextResponse.json({
      assessmentId: params.id,
      attachments,
    });
  } catch (error) {
    console.error('Error fetching OCR status:', error);
    return NextResponse.json({ error: 'Failed to fetch OCR status' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (process.env.ENABLE_OCR !== 'true') {
    return NextResponse.json({ message: 'OCR is disabled', status: 'skipped' });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { attachmentId } = body;

    const whereClause: any = { assessmentId: params.id };
    if (attachmentId) {
      whereClause.id = attachmentId;
    } else {
      whereClause.ocrStatus = { in: ['pending', 'failed'] };
    }

    const attachments = await prisma.assessmentAttachment.findMany({
      where: whereClause,
    });

    if (attachments.length === 0) {
      return NextResponse.json({ message: 'No attachments found for processing' });
    }

    const results = [];

    for (const attachment of attachments) {
      // Mark as processing
      await prisma.assessmentAttachment.update({
        where: { id: attachment.id },
        data: { ocrStatus: 'processing' },
      });

      try {
        let bytes: Buffer | null = null;
        if (isBlobAttachmentPath(attachment.path)) {
          const blob = await readAttachmentBytes(attachment.path);
          bytes = blob.bytes;
        } else {
          const fullPath = path.isAbsolute(attachment.path)
            ? attachment.path
            : path.join(process.cwd(), 'public', attachment.path);
          bytes = await readFile(fullPath);
        }

        if (!bytes) throw new Error('Could not read attachment bytes');

        const ocrResult = await processAttachmentOcr({
          attachment: {
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            category: attachment.category,
            path: attachment.path,
          },
          bytes,
        });

        await prisma.assessmentAttachment.update({
          where: { id: attachment.id },
          data: {
            ocrStatus: ocrResult.status,
            ocrData: ocrResult as any,
            ocrProcessedAt: new Date(ocrResult.processedAt),
            ocrError: ocrResult.error || null,
          },
        });

        results.push({ id: attachment.id, status: ocrResult.status });
      } catch (error) {
        console.error(`OCR failed for attachment ${attachment.id}:`, error);
        await prisma.assessmentAttachment.update({
          where: { id: attachment.id },
          data: {
            ocrStatus: 'failed',
            ocrError: error instanceof Error ? error.message : String(error),
          },
        });
        results.push({ id: attachment.id, status: 'failed' });
      }
    }

    return NextResponse.json({
      message: 'OCR processing completed',
      results,
    });

  } catch (error) {
    console.error('Error triggering OCR:', error);
    return NextResponse.json({ error: 'Failed to process OCR' }, { status: 500 });
  }
}
