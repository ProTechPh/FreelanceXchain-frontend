const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? '/api/proxy'
    : 'http://localhost:3000/api');

async function getApi() {
  const mod = await import('../api-client.ts');
  return mod.default || mod.api;
}

/**
 * API client for secure file access endpoints.
 * Provides authenticated access to files through the backend proxy,
 * replacing direct Appwrite Storage URLs for security.
 */

/**
 * Generate a secure file URL through the backend proxy.
 * This replaces direct Appwrite Storage URLs with authenticated proxy URLs.
 * 
 * @param bucket - The storage bucket name (e.g., 'contract-documents', 'milestone-deliverables')
 * @param fileId - The file ID or path in storage
 * @returns The secure proxy URL for accessing the file
 */
export function getSecureFileUrl(bucket: string, fileId: string): string {
  // Validate inputs to prevent injection
  if (!bucket || typeof bucket !== 'string') {
    throw new Error('Invalid bucket parameter');
  }
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('Invalid fileId parameter');
  }
  
  // Sanitize bucket and fileId to prevent path traversal
  const sanitizedBucket = encodeURIComponent(bucket);
  const sanitizedFileId = encodeURIComponent(fileId);
  
  return `${API_URL}/files/signed-url/${sanitizedBucket}/${sanitizedFileId}`;
}

/**
 * Download a file through the secure proxy endpoint.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID or path in storage
 * @returns A Promise resolving to the file Blob
 */
export async function downloadFile(bucket: string, fileId: string): Promise<Blob> {
  const url = getSecureFileUrl(bucket, fileId);
  const api = await getApi();
  const response = await api.get(url, {
    responseType: 'blob',
  });
  
  return response.data as Blob;
}

/**
 * Download a file with progress tracking.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID or path in storage
 * @param onProgress - Optional callback for download progress (0-100)
 * @returns A Promise resolving to the file Blob
 */
export async function downloadFileWithProgress(
  bucket: string,
  fileId: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const url = getSecureFileUrl(bucket, fileId);
  const api = await getApi();
  // Use axios to support onDownloadProgress
  const response = await api.get(url, {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total && progressEvent.total > 0) {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(progress);
      }
    },
  });
  
  return response.data as Blob;
}

/**
 * Get a signed URL for temporary access to a file.
 * This endpoint verifies ownership before returning the URL.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID or path in storage
 * @returns A Promise resolving to the signed URL
 */
export async function getSignedFileUrl(bucket: string, fileId: string): Promise<string> {
  const api = await getApi();
  const response = await api.get<{
    success: boolean;
    url?: string;
    error?: string;
  }>(`/files/signed-url/${encodeURIComponent(bucket)}/${encodeURIComponent(fileId)}`);
  
  const data = response.data;
  
  if (!data.success || !data.url) {
    throw new Error(data.error || 'Failed to get signed URL');
  }
  
  return data.url;
}

/**
 * Delete a file from storage.
 * Ownership is verified server-side before deletion.
 * 
 * @param bucket - The storage bucket name
 * @param fileId - The file ID or path in storage
 * @returns A Promise resolving when deletion is complete
 */
export async function deleteSecureFile(bucket: string, fileId: string): Promise<void> {
  const api = await getApi();
  await api.delete(`/files/${encodeURIComponent(bucket)}/${encodeURIComponent(fileId)}`);
}

/**
 * List files in a bucket for the authenticated user.
 * Only returns files owned by the current user.
 * 
 * @param bucket - The storage bucket name
 * @returns A Promise resolving to the list of files
 */
export async function listSecureFiles(bucket: string): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    size: number;
    createdAt: string;
  }>;
  error?: string;
}> {
  const api = await getApi();
  const response = await api.get<{
    success: boolean;
    files?: Array<{
      name: string;
      size: number;
      createdAt: string;
    }>;
    error?: string;
  }>(`/files/list/${encodeURIComponent(bucket)}`);
  
  return response.data;
}

/**
 * Get storage quota information for the authenticated user.
 * 
 * @returns A Promise resolving to quota information
 */
export async function getStorageQuota(): Promise<{
  success: boolean;
  used?: number;
  limit?: number;
  percentage?: number;
  files?: number;
  error?: string;
}> {
  const api = await getApi();
  const response = await api.get<{
    success: boolean;
    used?: number;
    limit?: number;
    percentage?: number;
    files?: number;
    error?: string;
  }>('/files/quota');
  
  return response.data;
}

/**
 * Check if a URL is a direct Appwrite Storage URL.
 * Used to identify URLs that should be migrated to secure proxy URLs.
 * 
 * @param url - The URL to check
 * @returns true if the URL is a direct Appwrite Storage URL
 */
export function isAppwriteStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Check for common Appwrite endpoint patterns
    const appwritePatterns = [
      /\/storage\/buckets\/[^/]+\/files\/[^/]+/,
      /cloud\.appwrite\.io/,
      /appwrite\.io/,
    ];
    
    return appwritePatterns.some(pattern => pattern.test(urlObj.pathname) || pattern.test(urlObj.hostname));
  } catch {
    return false;
  }
}

/**
 * Extract bucket and fileId from an Appwrite Storage URL.
 * 
 * @param url - The Appwrite Storage URL
 * @returns An object with bucket and fileId, or null if parsing fails
 */
export function extractAppwriteFileInfo(url: string): { bucket: string; fileId: string } | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    // Match pattern: /storage/buckets/{bucket}/files/{fileId}/view
    const match = urlObj.pathname.match(/\/storage\/buckets\/([^/]+)\/files\/([^/]+)/);
    
    if (match && match[1] && match[2]) {
      return {
        bucket: match[1],
        fileId: match[2],
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a direct Appwrite URL to a secure proxy URL.
 * If the URL is not a valid Appwrite URL, returns the original URL.
 * 
 * @param appwriteUrl - The direct Appwrite Storage URL
 * @returns The secure proxy URL, or the original URL if conversion fails
 */
export function convertToSecureUrl(appwriteUrl: string): string {
  const info = extractAppwriteFileInfo(appwriteUrl);
  if (!info) return appwriteUrl;
  
  return getSecureFileUrl(info.bucket, info.fileId);
}

export const filesApi = {
  getSecureFileUrl,
  downloadFile,
  downloadFileWithProgress,
  getSignedFileUrl,
  delete: deleteSecureFile,
  list: listSecureFiles,
  getQuota: getStorageQuota,
  isAppwriteStorageUrl,
  extractAppwriteFileInfo,
  convertToSecureUrl,
};

export default filesApi;