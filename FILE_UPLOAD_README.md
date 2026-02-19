# File Upload Implementation

Complete file upload functionality for the FreelanceXchain platform, connecting the frontend to the backend API with Supabase Storage.

## 📁 Files Created

### Frontend Components
- `src/components/ui/FileUpload.tsx` - Reusable drag-and-drop file upload component
- `src/components/FileUploadExample.tsx` - Example implementation and usage guide
- `src/hooks/useFileUpload.ts` - Custom hook for file upload logic
- `src/test/FileUpload.test.tsx` - Unit tests for FileUpload component

### API Integration
- `src/lib/api.ts` - Added file upload methods to API client:
  - `uploadFile()` - Upload single file
  - `uploadMultipleFiles()` - Upload multiple files
  - `deleteFile()` - Delete a file
  - `getSignedUrl()` - Get signed URL for private files
  - `listUserFiles()` - List user's files

### Types
- `src/types/index.ts` - Added file upload type definitions:
  - `UploadedFile`
  - `StorageBucket`
  - `FileUploadResult`
  - `MultipleFileUploadResult`
  - `FileListResult`

### Documentation
- `FILE_UPLOAD_GUIDE.md` - Comprehensive usage guide with examples
- `FILE_UPLOAD_README.md` - This file

## 🚀 Quick Start

### 1. Import the components

```tsx
import { FileUpload } from './components/ui/FileUpload';
import { useFileUpload } from './hooks/useFileUpload';
```

### 2. Use in your component

```tsx
function MyForm() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { uploadFiles, isUploading } = useFileUpload({
    bucket: 'proposal-attachments',
    onSuccess: (results) => {
      console.log('Uploaded:', results);
    },
  });

  return (
    <>
      <FileUpload
        files={files}
        onFilesChange={setFiles}
      />
      <button onClick={() => uploadFiles(files)}>
        Upload
      </button>
    </>
  );
}
```

## 🎯 Features

### FileUpload Component
- ✅ Drag and drop support
- ✅ Click to browse files
- ✅ Multiple file selection
- ✅ File type validation
- ✅ File size validation
- ✅ Visual feedback (drag state, errors)
- ✅ File list with remove buttons
- ✅ Progress indicators
- ✅ Customizable labels and helper text
- ✅ Dark mode support
- ✅ Accessible (ARIA labels)

### useFileUpload Hook
- ✅ Upload single or multiple files
- ✅ Progress tracking
- ✅ Error handling
- ✅ Success/error callbacks
- ✅ Upload state management
- ✅ Reset functionality

### API Client
- ✅ FormData handling
- ✅ Authentication (JWT)
- ✅ Error handling
- ✅ Multiple file uploads
- ✅ File deletion
- ✅ Signed URLs for private files
- ✅ File listing

## 📦 Storage Buckets

| Bucket | Purpose | Max Size | Access |
|--------|---------|----------|--------|
| `profile-images` | User avatars | 5MB | Public |
| `contract-documents` | Contract files | 10MB | Private |
| `proposal-attachments` | Proposal files | 10MB | Private |
| `dispute-evidence` | Dispute files | 20MB | Private |

## 🔒 Security Features

1. **Client-side validation**
   - File type checking
   - File size limits
   - File count limits

2. **Server-side validation**
   - Magic number detection
   - MIME type verification
   - Filename sanitization
   - Path traversal prevention

3. **Authentication**
   - JWT token required
   - User-specific folders
   - Access control

4. **Storage**
   - Supabase Storage integration
   - Signed URLs for private files
   - Time-limited access

## 📝 Usage Examples

### Example 1: Simple Upload

```tsx
import { useState } from 'react';
import { FileUpload } from './components/ui/FileUpload';
import { useFileUpload } from './hooks/useFileUpload';

function SimpleUpload() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { uploadFiles, isUploading } = useFileUpload({
    bucket: 'proposal-attachments',
  });

  return (
    <FileUpload
      files={files}
      onFilesChange={setFiles}
      disabled={isUploading}
    />
  );
}
```

### Example 2: With Progress

```tsx
function UploadWithProgress() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { uploadFiles, isUploading, progress } = useFileUpload({
    bucket: 'contract-documents',
  });

  return (
    <div>
      <FileUpload files={files} onFilesChange={setFiles} />
      
      {isUploading && (
        <div>
          <div>Uploading... {progress}%</div>
          <progress value={progress} max={100} />
        </div>
      )}
      
      <button onClick={() => uploadFiles(files)}>
        Upload
      </button>
    </div>
  );
}
```

### Example 3: Custom Configuration

```tsx
function CustomUpload() {
  const [files, setFiles] = useState<File[]>([]);
  
  const { uploadFiles, error } = useFileUpload({
    bucket: 'dispute-evidence',
    folder: 'dispute-123',
    onSuccess: (results) => {
      alert('Upload successful!');
    },
    onError: (error) => {
      alert(`Upload failed: ${error.message}`);
    },
  });

  return (
    <FileUpload
      files={files}
      onFilesChange={setFiles}
      maxFiles={10}
      maxSizeMB={50}
      acceptedTypes={['.pdf', '.png', '.jpg']}
      label="Upload Evidence"
      helperText="Upload supporting documents"
      error={error}
    />
  );
}
```

## 🧪 Testing

Run the tests:

```bash
npm test FileUpload.test.tsx
```

The test suite covers:
- Component rendering
- File selection
- File validation
- Error handling
- Drag and drop
- File removal

## 🔗 Backend Integration

The frontend connects to these backend endpoints:

- `POST /api/files/upload` - Upload file
- `DELETE /api/files/:bucket/:path` - Delete file
- `GET /api/files/signed-url/:bucket/:path` - Get signed URL
- `GET /api/files/list/:bucket` - List files

Backend implementation:
- `FreelanceXchain-api/src/routes/file-upload.ts`
- `FreelanceXchain-api/src/middleware/file-upload-middleware.ts`
- `FreelanceXchain-api/src/utils/file-upload.ts`

## 📚 Additional Resources

- See `FILE_UPLOAD_GUIDE.md` for detailed documentation
- See `FileUploadExample.tsx` for a complete working example
- See backend `AUDIT_LOGS_SETUP.md` for security considerations

## 🐛 Troubleshooting

### Files not uploading
- Verify user is authenticated
- Check file size and type
- Check browser console for errors

### 401 Unauthorized
- Token may be expired
- User may not be logged in

### 400 Bad Request
- File type not allowed
- File size exceeds limit
- Check error message for details

## 🎨 Styling

The FileUpload component uses Tailwind CSS and supports:
- Light/dark mode
- Hover states
- Focus states
- Disabled states
- Error states
- Drag states

Customize by modifying the className props or wrapping in a styled container.

## 🔄 Migration from Existing Code

If you have existing file upload code (like in `ProjectDetailPage.tsx`), you can migrate to the new components:

**Before:**
```tsx
// Custom drag-and-drop implementation
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
// ... lots of validation code ...
```

**After:**
```tsx
import { FileUpload } from './components/ui/FileUpload';
import { useFileUpload } from './hooks/useFileUpload';

const [files, setFiles] = useState<File[]>([]);
const { uploadFiles } = useFileUpload({ bucket: 'proposal-attachments' });

<FileUpload files={files} onFilesChange={setFiles} />
```

## 📄 License

Part of the FreelanceXchain project.
