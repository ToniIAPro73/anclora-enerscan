export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
export const MAX_ATTACHMENTS = 6;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/x-markdown",
  "text/plain",
] as const;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".md"] as const;

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAllowedAttachment(file: { name: string; type: string; size: number }): boolean {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_ATTACHMENT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  const hasValidMime = ALLOWED_ATTACHMENT_TYPES.includes(file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number]);
  return hasValidExtension && (hasValidMime || lowerName.endsWith(".md"));
}

export function sanitizeFilename(name: string): string {
  const clean = name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-");
  return clean.slice(0, 120) || "attachment";
}
