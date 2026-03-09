import React, { useState } from 'react';
import { FileUpload } from './ui/FileUpload';
import { Button } from './ui/Button';
import { useFileUpload } from '../hooks/useFileUpload';
import { CheckCircle, Loader } from 'lucide-react';

/**
 * Example component demonstrating file upload usage
 * This can be used as a reference for implementing file uploads in other parts of the app
 */
export function FileUploadExample() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { 
    uploadFiles, 
    isUploading, 
    progress, 
    error: uploadError, 
    uploadedFiles,
    reset 
  } = useFileUpload({
    bucket: 'proposal-attachments',
    folder: 'examples',
    onSuccess: (results) => {
      console.log('Upload successful:', results);
      // Handle success (e.g., show toast, update form state, etc.)
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      // Handle error (e.g., show toast)
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      return;
    }

    await uploadFiles(files);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        File Upload Example
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          maxFiles={5}
          maxSizeMB={25}
          disabled={isUploading}
          error={uploadError}
          label="Upload Documents"
          helperText="Upload proposal documents, contracts, or other relevant files"
        />

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Uploading...</span>
              <span className="text-gray-500 dark:text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadedFiles.length > 0 && !isUploading && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Upload Successful
                </h3>
                <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                  {uploadedFiles.map((file, idx) => (
                    <li key={idx} className="truncate">
                      {file.filename}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Files'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isUploading}
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Usage Instructions
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Drag and drop files or click to browse</li>
          <li>Maximum 5 files, 25MB total size</li>
          <li>Accepted formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF</li>
          <li>Files are uploaded to Supabase Storage</li>
        </ul>
      </div>
    </div>
  );
}
