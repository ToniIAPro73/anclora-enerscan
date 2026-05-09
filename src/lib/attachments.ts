export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE = MAX_ATTACHMENT_SIZE_BYTES;
export const MAX_ATTACHMENTS = 6;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_ATTACHMENT_TYPES = ALLOWED_ATTACHMENT_MIME_TYPES;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"] as const;

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAllowedAttachment(file: { name: string; type: string; size: number }): boolean {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_ATTACHMENT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  const hasValidMime = ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]);
  return hasValidExtension && hasValidMime;
}

export function validateAttachments(files: { name: string; type: string; size: number }[]) {
  if (files.length > MAX_ATTACHMENTS) {
    return `Máximo ${MAX_ATTACHMENTS} adjuntos por valoración`;
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
    return `El total de adjuntos supera el límite de ${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE_BYTES)}`;
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return `El archivo ${file.name} supera el límite de ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}`;
    }
    if (!isAllowedAttachment(file)) {
      return `Tipo de archivo no admitido: ${file.name}. Formatos permitidos: PDF, JPG, PNG y WEBP.`;
    }
  }

  return null;
}

export function sanitizeFilename(name: string): string {
  const clean = name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-");
  return clean.slice(0, 120) || "attachment";
}
