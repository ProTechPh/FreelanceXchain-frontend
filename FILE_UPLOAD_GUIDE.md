# File Upload Implementation Guide

This guide explains how to use the file upload functionality in the FreelanceXchain frontend application.

## Overview

The file upload system consists of:
- **API Client Methods**: Handle HTTP requests to the backend
- **FileUpload Component**: Reusable UI component with drag-and-drop
- **useFileUpload Hook**: Custom hook for managing upload state and logic
- **Backend API**: Supabase Storage integration with security validation

## Quick Start

### 1. Basic Usage

```tsx
import { useState } from 'react';
import { FileUpload } from './components/ui/FileUpload';
import { useFileUpload } from './hooks/useFileUpload';
import { Button } from './components/ui/Button';

function MyComponent() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { uploadFiles, isUploading, uploadedFiles } = useFileUpload({
    bucket: 'proposal-attachments',
    folder: 'my-folder', // optional
    onSuccess: (results) => {
      console.log('Uploaded:', results);
    },
  });

  const handleSubmit = async () => {
    await uploadFiles(files);
  };

  return (
    <div>
      <FileUpload
        files={files}
        onFilesChange={setFiles}
        maxFiles={5}
        maxSizeMB={25}
      />
      <Button onClick={handleSubmit} disabled={isUploading}>
        Upload
      </Button>
    </div>
  );
}
```

### 2. Available Buckets

The system supports four storage buckets:

- `profile-images`: User profile pictures (5MB limit per file)
- `contract-documents`: Contract-related documents (10MB limit)
- `proposal-attachments`: Proposal files (10MB limit)
- `dispute-evidence`: Dispute evidence files (20MB limit)

### 3. Accepted File Types

By default, the following file types are accepted:
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`

## Components

### FileUpload Component

A reusable drag-and-drop file upload component.

**Props:**

```typescript
interface FileUploadProps {
  maxFiles?: number;           // Default: 5
  maxSizeMB?: number;          // Default: 25
  acceptedTypes?: string[];    // Default: ['.pdf', '.doc', ...]
  onFilesChange: (files: File[]) => void;
  files: File[];
  disabled?: boolean;
  error?: string | null;
  label?: string;
  helperText?: string;
}
```

**Example:**

```tsx
<FileUpload
  files={files}
  onFilesChange={setFiles}
  maxFiles={10}
  maxSizeMB={50}
  acceptedTypes={['.pdf', '.png', '.jpg']}
  label="Upload Evidence"
  helperText="Upload supporting documents for your dispute"
  disabled={isSubmitting}
  error={validationError}
/>
```

### useFileUpload Hook

Custom hook for managing file upload state and operations.

**Options:**

```typescript
interface UseFileUploadOptions {
  bucket: 'profile-images' | 'contract-documents' | 'proposal-attachments' | 'dispute-evidence';
  folder?: string;
  onSuccess?: (results: Array<{ url: string; path: string; filename: string }>) => void;
  onError?: (error: Error) => void;
}
```

**Returns:**

```typescript
interface UseFileUploadReturn {
  uploadFiles: (files: File[]) => Promise<void>;
  uploadSingleFile: (file: File) => Promise<{ url: string; path: string }>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: Array<{ url: string; path: string; filename: string }>;
  reset: () => void;
}
```

**Example:**

```tsx
const { 
  uploadFiles, 
  uploadSingleFile,
  isUploading, 
  progress, 
  error,
  uploadedFiles,
  reset 
} = useFileUpload({
  bucket: 'dispute-evidence',
  folder: `dispute-${disputeId}`,
  onSuccess: (results) => {
    toast.success('Files uploaded successfully');
    // Save file URLs to your form state
  },
  onError: (error) => {
    toast.error(`Upload failed: ${error.message}`);
  },
});
```

## API Client Methods

The API client provides methods for file operations:

### Upload Single File

```typescript
await api.uploadFile(file, 'proposal-attachments', 'optional-folder');
// Returns: { success: boolean; url: string; path: string }
```

### Upload Multiple Files

```typescript
await api.uploadMultipleFiles(files, 'contract-documents');
// Returns: { success: boolean; files: Array<{ url: string; path: string; filename: string }> }
```

### Delete File

```typescript
await api.deleteFile('proposal-attachments', 'user-id/folder/file.pdf');
// Returns: { success: boolean }
```

### Get Signed URL

```typescript
await api.getSignedUrl('contract-documents', 'user-id/file.pdf', 3600);
// Returns: { success: boolean; url: string }
```

### List User Files

```typescript
await api.listUserFiles('proposal-attachments', 'optional-folder');
// Returns: { success: boolean; files: any[] }
```

## Real-World Examples

### Example 1: Proposal Submission

```tsx
function ProposalForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [proposalData, setProposalData] = useState({ /* ... */ });
  
  const { uploadFiles, isUploading, uploadedFiles } = useFileUpload({
    bucket: 'proposal-attachments',
    onSuccess: async (results) => {
      // Submit proposal with file URLs
      await api.submitProposal({
        ...proposalData,
        attachments: results.map(f => ({ url: f.url, filename: f.filename })),
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FileUpload
        files={files}
        onFilesChange={setFiles}
        label="Proposal Attachments"
      />
      <Button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Submit Proposal'}
      </Button>
    </form>
  );
}
```

### Example 2: Profile Picture Upload

```tsx
function ProfilePictureUpload() {
  const [file, setFile] = useState<File | null>(null);
  
  const { uploadSingleFile, isUploading } = useFileUpload({
    bucket: 'profile-images',
    onSuccess: async ([result]) => {
      // Update user profile with new image URL
      await api.updateFreelancerProfile({
        profilePicture: result.url,
      });
    },
  });

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      uploadSingleFile(files[0]);
    }
  };

  return (
    <FileUpload
      files={file ? [file] : []}
      onFilesChange={handleFileSelect}
      maxFiles={1}
      maxSizeMB={5}
      acceptedTypes={['.png', '.jpg', '.jpeg']}
      label="Profile Picture"
      disabled={isUploading}
    />
  );
}
```

### Example 3: Dispute Evidence

```tsx
function DisputeEvidenceForm({ disputeId }: { disputeId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  
  const { uploadFiles, isUploading, progress, uploadedFiles } = useFileUpload({
    bucket: 'dispute-evidence',
    folder: `dispute-${disputeId}`,
    onSuccess: async (results) => {
      await api.submitEvidence(disputeId, {
        description,
        attachments: results.map(f => f.url),
      });
    },
  });

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your evidence..."
      />
      
      <FileUpload
        files={files}
        onFilesChange={setFiles}
        maxFiles={10}
        maxSizeMB={50}
        label="Evidence Files"
        disabled={isUploading}
      />
      
      {isUploading && (
        <div>
          <div>Uploading... {progress}%</div>
          <progress value={progress} max={100} />
        </div>
      )}
      
      <Button onClick={() => uploadFiles(files)} disabled={isUploading}>
        Submit Evidence
      </Button>
    </div>
  );
}
```

## Security Features

The file upload system includes several security features:

1. **File Type Validation**: Both client-side and server-side validation
2. **Magic Number Detection**: Server validates actual file content, not just extension
3. **Size Limits**: Per-file and total upload size limits
4. **Filename Sanitization**: Removes dangerous characters and path traversal attempts
5. **Authentication**: All uploads require valid JWT token
6. **User Isolation**: Files are stored in user-specific folders
7. **Signed URLs**: Private files use time-limited signed URLs

## Backend API Endpoints

### POST /api/files/upload
Upload a single file

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers: Authorization: Bearer {token}
- Body:
  - file: File
  - bucket: string
  - folder: string (optional)

**Response:**
```json
{
  "success": true,
  "url": "https://...",
  "path": "user-id/folder/file.pdf"
}
```

### DELETE /api/files/:bucket/:path
Delete a file

**Request:**
- Method: DELETE
- Headers: Authorization: Bearer {token}

**Response:**
```json
{
  "success": true
}
```

### GET /api/files/signed-url/:bucket/:path
Get a signed URL for a private file

**Request:**
- Method: GET
- Headers: Authorization: Bearer {token}
- Query: expiresIn (optional, default 3600 seconds)

**Response:**
```json
{
  "success": true,
  "url": "https://...?token=..."
}
```

### GET /api/files/list/:bucket
List user's files in a bucket

**Request:**
- Method: GET
- Headers: Authorization: Bearer {token}
- Query: folder (optional)

**Response:**
```json
{
  "success": true,
  "files": [...]
}
```

## Troubleshooting

### Files not uploading
- Check that the user is authenticated
- Verify file size is within limits
- Ensure file type is in the accepted list
- Check browser console for errors

### Upload fails with 401
- Token may be expired, try refreshing the page
- Ensure user is logged in

### Upload fails with 400
- File type may not be allowed
- File size may exceed limits
- Check the error message for details

### Files upload but don't appear
- Check that you're saving the returned URLs
- Verify the bucket name is correct
- For private buckets, ensure you're using signed URLs

## Best Practices

1. **Always validate on both client and server**
2. **Show upload progress for better UX**
3. **Handle errors gracefully with user-friendly messages**
4. **Clean up files on component unmount if needed**
5. **Use appropriate bucket for each use case**
6. **Store file metadata (URLs, paths) in your database**
7. **Implement file deletion when records are removed**
8. **Use signed URLs for private files**
9. **Consider implementing virus scanning for production**
10. **Add loading states and disable forms during upload**

## Testing

See `FileUploadExample.tsx` for a complete working example that you can use to test the file upload functionality.

## Support

For issues or questions, please refer to:
- Backend implementation: `FreelanceXchain-api/src/routes/file-upload.ts`
- Middleware: `FreelanceXchain-api/src/middleware/file-upload-middleware.ts`
- Storage utilities: `FreelanceXchain-api/src/utils/file-upload.ts`
