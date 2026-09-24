import assert from 'node:assert/strict';
import test from 'node:test';

import { 
  formatFileSize, 
  safeAttachmentUrl,
  convertAppwriteToProxyUrl,
  needsSecureProxy,
  constructSecureFileUrl,
  getFileExtension,
  getMimeTypeFromExtension,
  isImageFile,
  isPreviewableDocument,
} from './attachment-presentation.ts';

test('only presents http and https attachment URLs as links', () => {
  assert.equal(safeAttachmentUrl('https://files.example.com/brief.pdf'), 'https://files.example.com/brief.pdf');
  assert.equal(safeAttachmentUrl('http://localhost:3000/file.txt'), 'http://localhost:3000/file.txt');
  assert.equal(safeAttachmentUrl('javascript:alert(1)'), null);
  assert.equal(safeAttachmentUrl('/relative/file.pdf'), null);
  assert.equal(safeAttachmentUrl('not a URL'), null);
});

test('converts Appwrite storage URLs to secure proxy URLs', () => {
  const appwriteUrl = 'https://cloud.appwrite.io/v1/storage/buckets/contract-documents/files/abc123/view?project=project123';
  const result = safeAttachmentUrl(appwriteUrl);
  // Should return a proxy URL, not the original Appwrite URL
  assert.ok(result !== null);
  assert.ok(result?.includes('/files/signed-url/'));
});

test('handles invalid Appwrite URLs gracefully', () => {
  assert.equal(safeAttachmentUrl(''), null);
  assert.equal(safeAttachmentUrl(null), null);
  assert.equal(safeAttachmentUrl(undefined), null);
});

test('convertAppwriteToProxyUrl extracts bucket and fileId from Appwrite URLs', () => {
  const appwriteUrl = 'https://cloud.appwrite.io/v1/storage/buckets/milestone-deliverables/files/file123/view?project=test';
  const result = convertAppwriteToProxyUrl(appwriteUrl);
  assert.ok(result !== null);
  assert.ok(result?.includes('milestone-deliverables'));
  assert.ok(result?.includes('file123'));
});

test('convertAppwriteToProxyUrl returns null for non-Appwrite URLs', () => {
  assert.equal(convertAppwriteToProxyUrl('https://example.com/file.pdf'), null);
  assert.equal(convertAppwriteToProxyUrl('not a url'), null);
  assert.equal(convertAppwriteToProxyUrl(''), null);
});

test('needsSecureProxy identifies Appwrite URLs', () => {
  assert.equal(needsSecureProxy('https://cloud.appwrite.io/v1/storage/buckets/test/files/file123/view'), true);
  assert.equal(needsSecureProxy('https://example.com/file.pdf'), false);
  assert.equal(needsSecureProxy(''), false);
});

test('constructSecureFileUrl generates proxy URLs from components', () => {
  const result = constructSecureFileUrl('contract-documents', 'file123');
  assert.ok(result.includes('/files/signed-url/contract-documents/file123'));
});

test('formats attachment sizes for compact project and proposal lists', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '2 KB');
  assert.equal(formatFileSize(1_572_864), '1.5 MB');
});

test('getFileExtension extracts file extensions correctly', () => {
  assert.equal(getFileExtension('document.pdf'), 'pdf');
  assert.equal(getFileExtension('image.PNG'), 'png');
  assert.equal(getFileExtension('file.tar.gz'), 'gz');
  assert.equal(getFileExtension('noextension'), '');
  assert.equal(getFileExtension('file.'), '');
  assert.equal(getFileExtension(''), '');
});

test('getFileExtension handles URLs with query parameters', () => {
  assert.equal(getFileExtension('https://example.com/file.pdf?token=abc'), 'pdf');
  assert.equal(getFileExtension('https://example.com/file.pdf#hash'), 'pdf');
});

test('getMimeTypeFromExtension returns correct MIME types', () => {
  assert.equal(getMimeTypeFromExtension('file.pdf'), 'application/pdf');
  assert.equal(getMimeTypeFromExtension('image.png'), 'image/png');
  assert.equal(getMimeTypeFromExtension('photo.jpg'), 'image/jpeg');
  assert.equal(getMimeTypeFromExtension('unknown.xyz'), 'application/octet-stream');
});

test('isImageFile identifies image file types', () => {
  assert.equal(isImageFile('photo.png'), true);
  assert.equal(isImageFile('image.jpg'), true);
  assert.equal(isImageFile('doc.pdf'), false);
  assert.equal(isImageFile('file.txt'), false);
});

test('isPreviewableDocument identifies previewable document types', () => {
  assert.equal(isPreviewableDocument('doc.pdf'), true);
  assert.equal(isPreviewableDocument('file.txt'), true);
  assert.equal(isPreviewableDocument('readme.md'), true);
  assert.equal(isPreviewableDocument('image.png'), false);
  assert.equal(isPreviewableDocument('audio.mp3'), false);
});