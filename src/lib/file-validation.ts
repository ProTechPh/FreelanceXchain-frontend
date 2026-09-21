export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xlsx',
  '.pptx',
  '.txt',
  '.md',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB total
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image

export const DOCUMENT_ACCEPT_STRING =
  '.pdf,.doc,.docx,.xlsx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp';

export const ALLOWED_FORMATS_DESCRIPTION =
  'Allowed formats: PDF, Word, Excel, PowerPoint, Text, Markdown, CSV, and Images.';

export const IMAGE_ACCEPT_STRING =
  '.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp';

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

export function isAllowedDocumentFile(file: { name: string }): boolean {
  const ext = getFileExtension(file.name);
  return (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedImageFile(file: { name: string }): boolean {
  const ext = getFileExtension(file.name);
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateDocumentFiles(
  files: File[],
  options?: { maxCount?: number; maxFileSize?: number; maxTotalSize?: number },
): string | null {
  const maxCount = options?.maxCount ?? 10;
  const maxFileSize = options?.maxFileSize ?? MAX_FILE_SIZE;
  const maxTotalSize = options?.maxTotalSize ?? MAX_TOTAL_SIZE;

  if (files.length > maxCount) {
    return `You can attach up to ${maxCount} files.`;
  }

  for (const file of files) {
    if (!isAllowedDocumentFile(file)) {
      return `File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`;
    }
    if (file.size > maxFileSize) {
      return `Each file must be ${Math.round(maxFileSize / (1024 * 1024))} MB or smaller.`;
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > maxTotalSize) {
    return `Files must total ${Math.round(maxTotalSize / (1024 * 1024))} MB or less.`;
  }

  return null;
}

export function validateImageFiles(
  files: File[],
  options?: { maxCount?: number; maxFileSize?: number },
): string | null {
  const maxCount = options?.maxCount ?? 10;
  const maxFileSize = options?.maxFileSize ?? MAX_IMAGE_FILE_SIZE;

  if (files.length > maxCount) {
    return `You can upload up to ${maxCount} images.`;
  }

  for (const file of files) {
    if (!isAllowedImageFile(file)) {
      return `"${file.name}" is not a supported image format. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.`;
    }
    if (file.size > maxFileSize) {
      return `Image "${file.name}" exceeds the ${Math.round(maxFileSize / (1024 * 1024))} MB limit.`;
    }
  }

  return null;
}
