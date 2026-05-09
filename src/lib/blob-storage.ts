import { del, get, put } from '@vercel/blob';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { sanitizeFilename } from './attachments';

const BLOB_PREFIX = 'blob:';

export function isBlobAttachmentPath(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(BLOB_PREFIX));
}

export function toBlobPathname(value: string): string {
  return value.startsWith(BLOB_PREFIX) ? value.slice(BLOB_PREFIX.length) : value;
}

export function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveAssessmentAttachment(
  assessmentId: string,
  file: File
): Promise<{ path: string; storage: 'blob' | 'local' }> {
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;

  if (hasBlobStorage()) {
    const pathname = `assessments/${assessmentId}/${filename}`;
    await put(pathname, Buffer.from(await file.arrayBuffer()), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: file.type || 'application/octet-stream',
      multipart: file.size > 4.5 * 1024 * 1024,
    });

    return { path: `${BLOB_PREFIX}${pathname}`, storage: 'blob' };
  }

  const uploadDir = path.join(process.cwd(), 'uploads', 'assessments', assessmentId);
  await mkdir(uploadDir, { recursive: true });
  const absolutePath = path.join(uploadDir, filename);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return { path: absolutePath, storage: 'local' };
}

export async function readAttachmentBytes(attachmentPath: string): Promise<{
  bytes: Buffer;
}> {
  if (isBlobAttachmentPath(attachmentPath)) {
    const result = await get(toBlobPathname(attachmentPath), {
      access: 'private',
      useCache: true,
    });

    if (!result || result.statusCode === 304 || !result.stream) {
      throw new Error('Blob attachment not found');
    }

    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    return { bytes };
  }

  return { bytes: await readFile(attachmentPath) };
}

export async function deleteStoredAttachment(attachmentPath: string) {
  if (isBlobAttachmentPath(attachmentPath)) {
    await del(toBlobPathname(attachmentPath));
    return;
  }

  await unlink(attachmentPath).catch(() => undefined);
}
