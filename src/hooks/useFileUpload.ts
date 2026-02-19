import { useState } from 'react';
import { api } from '../lib/api';

export interface UseFileUploadOptions {
  bucket: 'profile-images' | 'contract-documents' | 'proposal-attachments' | 'dispute-evidence';
  folder?: string;
  onSuccess?: (results: Array<{ url: string; path: string; filename: string }>) => void;
  onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
  uploadFiles: (files: File[]) => Promise<void>;
  uploadSingleFile: (file: File) => Promise<{ url: string; path: string }>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: Array<{ url: string; path: string; filename: string }>;
  reset: () => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { bucket, folder, onSuccess, onError } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; path: string; filename: string }>>([]);

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const results: Array<{ url: string; path: string; filename: string }> = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await api.uploadFile(file, bucket, folder);
        
        results.push({
          url: result.url,
          path: result.path,
          filename: file.name,
        });

        // Update progress
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadedFiles(results);
      onSuccess?.(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload files';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsUploading(false);
    }
  };

  const uploadSingleFile = async (file: File): Promise<{ url: string; path: string }> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await api.uploadFile(file, bucket, folder);
      setProgress(100);
      
      const uploadedFile = {
        url: result.url,
        path: result.path,
        filename: file.name,
      };
      
      setUploadedFiles([uploadedFile]);
      onSuccess?.([uploadedFile]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFiles([]);
  };

  return {
    uploadFiles,
    uploadSingleFile,
    isUploading,
    progress,
    error,
    uploadedFiles,
    reset,
  };
}
