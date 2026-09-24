import type { Attachment, Message } from '@/types';
import { getSecureFileUrl } from './api/files.ts';

interface UploadApi {
  upload(data: FormData): Promise<{ data: { success: boolean; url: string; path: string } }>;
}

interface MessageApi {
  send(receiverId: string, content: string, attachments?: Attachment[]): Promise<{ data: Message }>;
}

export class MessageAttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageAttachmentValidationError';
  }
}

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_FORMATS_DESCRIPTION,
  isAllowedDocumentFile,
} from './file-validation.ts';

export const ALLOWED_ATTACHMENT_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS;

export function validateMessageAttachments(files: File[]): string | null {
  if (files.length > 5) return 'Attach up to 5 files per message.';
  for (const file of files) {
    if (!isAllowedDocumentFile(file)) {
      return `File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`;
    }
  }
  if (files.some((file) => file.size > 10 * 1024 * 1024)) return 'Each message attachment must be 10 MB or smaller.';
  if (files.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) return 'Message attachments must total 25 MB or less.';
  return null;
}

/**
 * Extracts the file ID from a URL.
 * Handles both direct Appwrite URLs and proxy URLs.
 * 
 * @param url - The URL to extract from
 * @returns The file ID or null if not found
 */
function extractFileIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Try to match /files/{fileId} pattern (from proxy URLs)
    const proxyMatch = urlObj.pathname.match(/\/files\/signed-url\/[^/]+\/([^/]+)/);
    if (proxyMatch) return proxyMatch[1];
    
    // Try to match Appwrite pattern /storage/buckets/{bucket}/files/{fileId}
    const appwriteMatch = urlObj.pathname.match(/\/storage\/buckets\/[^/]+\/files\/([^/]+)/);
    if (appwriteMatch) return appwriteMatch[1];
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts a URL to use the secure proxy endpoint.
 * If the URL is already a proxy URL or cannot be parsed, returns the original URL.
 * 
 * @param url - The original URL (can be Appwrite or proxy URL)
 * @returns The secure proxy URL
 */
export function convertToSecureProxyUrl(url: string): string {
  const fileId = extractFileIdFromUrl(url);
  if (!fileId) return url;
  
  // Use the contract-documents bucket for message attachments
  try {
    return getSecureFileUrl('contract-documents', fileId);
  } catch {
    return url;
  }
}

export async function sendMessageWithAttachments(
  uploadApi: UploadApi,
  messageApi: MessageApi,
  receiverId: string,
  content: string,
  files: File[],
): Promise<Message> {
  const validationError = validateMessageAttachments(files);
  if (validationError) throw new MessageAttachmentValidationError(validationError);

  const attachments = await Promise.all(files.map(async (file): Promise<Attachment> => {
    const formData = new FormData();
    formData.set('bucket', 'contract-documents');
    formData.set('folder', 'messages');
    formData.set('files', file);
    const { data } = await uploadApi.upload(formData);
    
    // Convert the returned URL to a secure proxy URL
    const secureUrl = convertToSecureProxyUrl(data.url);
    
    return {
      url: secureUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  }));

  const { data } = await messageApi.send(receiverId, content, attachments.length > 0 ? attachments : undefined);
  return data;
}