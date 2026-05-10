import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE,
  sanitizeFilename,
} from '@/lib/attachments';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

function parseUploadPayload(clientPayload: string | null) {
  if (!clientPayload) return {};
  try {
    return JSON.parse(clientPayload) as { name?: string; type?: string; size?: number };
  } catch {
    return {};
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage is not configured' }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;
  const session = await auth().catch(() => null);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseUploadPayload(clientPayload);
        const safeName = sanitizeFilename(payload.name || pathname.split('/').pop() || 'attachment');

        if (!pathname.startsWith('assessment-drafts/')) {
          throw new Error('Ruta de adjunto no permitida');
        }

        if (payload.size && payload.size > MAX_ATTACHMENT_SIZE) {
          throw new Error('El archivo supera el tamaño máximo permitido');
        }

        return {
          allowedContentTypes: [...ALLOWED_ATTACHMENT_MIME_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
          validUntil: Date.now() + 30 * 60 * 1000,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            name: safeName,
            type: payload.type,
            size: payload.size,
            userId: session?.user?.id || null,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info('Assessment attachment uploaded to Blob:', blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo preparar la subida del adjunto' },
      { status: 400 }
    );
  }
}
