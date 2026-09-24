import {
  isAppwriteStorageUrl,
  extractAppwriteFileInfo,
  getSecureFileUrl,
  downloadFile,
  getSignedFileUrl,
} from './api/files.ts';

/**
 * Format file size in human-readable format.
 * 
 * @param bytes - File size in bytes
 * @returns Human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);
  return `${Number(value.toFixed(value >= 10 ? 0 : 1))} ${units[unitIndex]}`;
}

/**
 * Convert a direct Appwrite Storage URL to a secure proxy URL.
 * 
 * @param url - The Appwrite Storage URL
 * @returns The secure proxy URL, or the original URL if conversion fails
 */
export function convertToSecureUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  if (!isAppwriteStorageUrl(url)) {
    return url;
  }

  const fileInfo = extractAppwriteFileInfo(url);
  if (!fileInfo) {
    return url;
  }

  try {
    return getSecureFileUrl(fileInfo.bucket, fileInfo.fileId);
  } catch {
    return url;
  }
}

/**
 * Check if a URL is a direct Appwrite Storage URL that should be proxied.
 * 
 * @param url - The URL to check
 * @returns true if the URL needs to be proxied
 */
export function isDirectAppwriteUrl(url: string): boolean {
  return isAppwriteStorageUrl(url);
}

/**
 * Get a secure download URL for a file.
 * If the URL is an Appwrite URL, returns the proxy URL.
 * Otherwise returns the original URL if it's a valid HTTPS URL.
 * 
 * @param url - The file URL
 * @returns A secure URL for downloading the file
 */
export function getSecureDownloadUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // If it's an Appwrite URL, convert to secure proxy
  if (isAppwriteStorageUrl(url)) {
    const fileInfo = extractAppwriteFileInfo(url);
    if (fileInfo) {
      try {
        return getSecureFileUrl(fileInfo.bucket, fileInfo.fileId);
      } catch {
        return null;
      }
    }
    return null;
  }

  // For non-Appwrite URLs, validate it's HTTPS
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'https:') {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download a file using the secure proxy.
 * 
 * @param url - The file URL (can be Appwrite or any other URL)
 * @returns Promise resolving to the file Blob
 */
export async function downloadSecureFile(url: string): Promise<Blob> {
  // If it's an Appwrite URL, extract bucket and fileId
  if (isAppwriteStorageUrl(url)) {
    const fileInfo = extractAppwriteFileInfo(url);
    if (fileInfo) {
      return downloadFile(fileInfo.bucket, fileInfo.fileId);
    }
    throw new Error('Invalid Appwrite Storage URL');
  }

  // For non-Appwrite URLs, fetch directly
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Get a signed URL for temporary access to a file.
 * This is useful for generating temporary access URLs that expire.
 * 
 * @param url - The Appwrite Storage URL
 * @returns Promise resolving to the signed URL
 */
export async function getSecureSignedUrl(url: string): Promise<string> {
  const fileInfo = extractAppwriteFileInfo(url);
  if (!fileInfo) {
    throw new Error('Invalid Appwrite Storage URL');
  }

  return getSignedFileUrl(fileInfo.bucket, fileInfo.fileId);
}

/**
 * Storage bucket constants used throughout the application.
 * These match the bucket names defined in the backend.
 */
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  CONTRACT_DOCUMENTS: 'contract-documents',
  PROPOSAL_ATTACHMENTS: 'proposal-attachments',
  PROJECT_ATTACHMENTS: 'project-attachments',
  DISPUTE_EVIDENCE: 'dispute-evidence',
  MILESTONE_DELIVERABLES: 'milestone-deliverables',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Validates if a bucket name is a known storage bucket.
 * 
 * @param bucket - The bucket name to validate
 * @returns true if the bucket is valid
 */
export function isValidStorageBucket(bucket: string): bucket is StorageBucket {
  return Object.values(STORAGE_BUCKETS).includes(bucket as StorageBucket);
}

/**
 * Generate a secure URL from bucket and file ID components.
 * This is the preferred way to construct file URLs when you have
 * the components separately rather than an Appwrite URL.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID
 * @returns The secure proxy URL
 */
export function buildSecureUrl(bucket: StorageBucket, fileId: string): string {
  return getSecureFileUrl(bucket, fileId);
}