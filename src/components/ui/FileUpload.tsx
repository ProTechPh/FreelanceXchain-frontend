import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

export interface FileUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onFilesChange: (files: File[]) => void;
  files: File[];
  disabled?: boolean;
  error?: string | null;
  label?: string;
  helperText?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
];

export function FileUpload({
  maxFiles = 5,
  maxSizeMB = 25,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  onFilesChange,
  files,
  disabled = false,
  error = null,
  label = 'Upload Files',
  helperText,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateAndAddFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    setLocalError(null);
    const incomingArr = Array.from(incoming);
    const combined = [...files, ...incomingArr];

    // Check file count
    if (combined.length > maxFiles) {
      setLocalError(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    // Check file types
    const invalidFiles = incomingArr.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !acceptedTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      setLocalError(
        `Invalid file type(s). Accepted: ${acceptedTypes.join(', ')}`
      );
      return;
    }

    // Check total size
    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (totalSize > maxBytes) {
      setLocalError(`Total upload size exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    onFilesChange(combined);
  };

  const removeFile = (index: number) => {
    setLocalError(null);
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${displayError ? 'border-red-500 dark:border-red-500' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={(e) => validateAndAddFiles(e.target.files)}
          disabled={disabled}
        />

        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drag & drop files here or{' '}
          <span className="text-primary-600 dark:text-primary-400">browse</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText || `Max ${maxFiles} files, ${maxSizeMB}MB total. Accepted: ${acceptedTypes.join(', ')}`}
        </p>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <ul className="space-y-2">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={disabled}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* File Counter */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-right">
            {files.length}/{maxFiles} files · {formatBytes(totalSize)} / {maxSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
}
