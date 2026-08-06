import type { Attachment, Message } from '@/types';

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

export function validateMessageAttachments(files: File[]): string | null {
  if (files.length > 5) return 'Attach up to 5 files per message.';
  if (files.some((file) => file.size > 10 * 1024 * 1024)) return 'Each message attachment must be 10 MB or smaller.';
  if (files.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) return 'Message attachments must total 25 MB or less.';
  return null;
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
    return {
      url: data.url,
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  }));

  const { data } = await messageApi.send(receiverId, content, attachments.length > 0 ? attachments : undefined);
  return data;
}
