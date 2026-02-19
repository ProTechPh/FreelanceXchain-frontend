# File Upload Quick Reference

## 🚀 Basic Usage

```tsx
import { FileUpload } from './components/ui/FileUpload';
import { useFileUpload } from './hooks/useFileUpload';

const [files, setFiles] = useState<File[]>([]);
const { uploadFiles, isUploading } = useFileUpload({
  bucket: 'proposal-attachments'
});

<FileUpload files={files} onFilesChange={setFiles} />
<button onClick={() => uploadFiles(files)}>Upload</button>
```

## 📦 Storage Buckets

```typescript
'profile-images'         // 5MB  - Public
'contract-documents'     // 10MB - Private
'proposal-attachments'   // 10MB - Private
'dispute-evidence'       // 20MB - Private
```

## 🎯 API Methods

```typescript
// Upload
await api.uploadFile(file, 'proposal-attachments', 'folder');
await api.uploadMultipleFiles(files, 'contract-documents');

// Manage
await api.deleteFile('bucket', 'path');
await api.getSignedUrl('bucket', 'path', 3600);
await api.listUserFiles('bucket', 'folder');
```

## 🎨 Component Props

```typescript
<FileUpload
  files={files}                    // Required
  onFilesChange={setFiles}         // Required
  maxFiles={5}                     // Optional
  maxSizeMB={25}                   // Optional
  acceptedTypes={['.pdf', '.png']} // Optional
  disabled={false}                 // Optional
  error={null}                     // Optional
  label="Upload Files"             // Optional
  helperText="Max 5 files"         // Optional
/>
```

## 🪝 Hook Options

```typescript
useFileUpload({
  bucket: 'proposal-attachments',  // Required
  folder: 'optional-folder',       // Optional
  onSuccess: (results) => {},      // Optional
  onError: (error) => {},          // Optional
})
```

## 📤 Hook Returns

```typescript
const {
  uploadFiles,        // (files: File[]) => Promise<void>
  uploadSingleFile,   // (file: File) => Promise<result>
  isUploading,        // boolean
  progress,           // number (0-100)
  error,              // string | null
  uploadedFiles,      // UploadedFile[]
  reset,              // () => void
} = useFileUpload(options);
```

## ✅ Accepted File Types

```
.pdf .doc .docx .txt .png .jpg .jpeg .gif
```

## 🔒 Security

- ✅ JWT authentication required
- ✅ File type validation (client + server)
- ✅ Magic number detection
- ✅ Size limits enforced
- ✅ Filename sanitization
- ✅ User-specific folders

## 📚 Documentation

- `FILE_UPLOAD_GUIDE.md` - Full guide
- `FILE_UPLOAD_README.md` - Features
- `FileUploadExample.tsx` - Example
- `MIGRATION_EXAMPLE.md` - Migration

## 🧪 Testing

```bash
npm test FileUpload.test.tsx
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| 401 Error | Check authentication |
| 400 Error | Check file type/size |
| No upload | Verify files selected |

## 💡 Pro Tips

1. Always show upload progress
2. Handle errors gracefully
3. Validate before upload
4. Use correct bucket
5. Store URLs in database
6. Clean up on delete
