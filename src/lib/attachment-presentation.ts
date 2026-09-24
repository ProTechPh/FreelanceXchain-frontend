import {
  isAppwriteStorageUrl,
  extractAppwriteFileInfo,
  getSecureFileUrl,
} from './api/files.ts';

/**
 * Safely validate and normalize an attachment URL.
 * Supports both direct URLs and Appwrite Storage URLs.
 * For Appwrite URLs, returns the secure proxy URL through the backend.
 * 
 * @param value - The URL string to validate
 * @returns The normalized URL, or null if invalid
 */
export function safeAttachmentUrl(value: string): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Check if it's an Appwrite Storage URL that needs conversion
  if (isAppwriteStorageUrl(value)) {
    const fileInfo = extractAppwriteFileInfo(value);
    if (fileInfo) {
      try {
        return getSecureFileUrl(fileInfo.bucket, fileInfo.fileId);
      } catch {
        // Fall through to try validating as a regular URL
      }
    }
  }

  // Standard URL validation for non-Appwrite URLs
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Convert a direct Appwrite URL to a secure proxy URL.
 * This is useful when migrating from direct Appwrite URLs to secure proxy URLs.
 * 
 * @param appwriteUrl - The direct Appwrite Storage URL
 * @returns The secure proxy URL, or null if conversion fails
 */
export function convertAppwriteToProxyUrl(appwriteUrl: string): string | null {
  if (!appwriteUrl || typeof appwriteUrl !== 'string') {
    return null;
  }

  if (!isAppwriteStorageUrl(appwriteUrl)) {
    return null;
  }

  const fileInfo = extractAppwriteFileInfo(appwriteUrl);
  if (!fileInfo) {
    return null;
  }

  try {
    return getSecureFileUrl(fileInfo.bucket, fileInfo.fileId);
  } catch {
    return null;
  }
}

/**
 * Check if a URL needs to be converted to a secure proxy URL.
 * 
 * @param url - The URL to check
 * @returns true if the URL is a direct Appwrite URL that should be proxied
 */
export function needsSecureProxy(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return isAppwriteStorageUrl(url);
}

/**
 * Construct a secure file URL from bucket and file ID.
 * This is the preferred way to generate file URLs when you have
 * the bucket and fileId separately.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID
 * @returns The secure proxy URL
 */
export function constructSecureFileUrl(bucket: string, fileId: string): string {
  return getSecureFileUrl(bucket, fileId);
}

/**
 * Format file size in human-readable format.
 * 
 * @param size - File size in bytes
 * @returns Human-readable file size string
 */
export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${Number((size / (1024 * 1024)).toFixed(1))} MB`;
}

/**
 * Extract file extension from filename or URL.
 * 
 * @param filename - The filename or URL
 * @returns The file extension (lowercase, without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove query parameters and hash
  const cleanName = filename.split('?')[0]?.split('#')[0] || '';
  
  const lastDotIndex = cleanName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === cleanName.length - 1) {
    return '';
  }

  const ext = cleanName.slice(lastDotIndex + 1).toLowerCase();
  
  // Validate extension doesn't contain path separators
  if (ext.includes('/') || ext.includes('\\') || ext.length > 20) {
    return '';
  }

  return ext;
}

/**
 * Get MIME type based on file extension.
 * 
 * @param filename - The filename or URL
 * @returns The MIME type or application/octet-stream
 */
export function getMimeTypeFromExtension(filename: string): string {
  const ext = getFileExtension(filename);
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'md': 'text/markdown',
    'html': 'text/html',
    'htm': 'text/html',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if a file extension is an image type.
 * 
 * @param filename - The filename or URL
 * @returns true if the file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * Check if a file extension is a document type that can be previewed.
 * 
 * @param filename - The filename or URL
 * @returns true if the file is a previewable document
 */
export function isPreviewableDocument(filename: string): boolean {
  const previewableExtensions = [
    'pdf',
    'txt',
    'md',
    'markdown',
    'csv',
    'json',
    'log',
    'sol',
    'ts',
    'js',
    'tsx',
    'jsx',
    'html',
    'css',
    'xml',
    'yaml',
    'yml',
  ];
  const ext = getFileExtension(filename);
  return previewableExtensions.includes(ext);
}