import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFileExtension,
  isAllowedDocumentFile,
  isAllowedImageFile,
  validateDocumentFiles,
  validateImageFiles,
} from './file-validation.ts';

function makeFile(name, size = 1024, type = 'application/pdf') {
  return new File([new Uint8Array(size)], name, { type });
}

test('getFileExtension correctly extracts lowercased extension with dot', () => {
  assert.equal(getFileExtension('resume.PDF'), '.pdf');
  assert.equal(getFileExtension('archive.tar.gz'), '.gz');
  assert.equal(getFileExtension('no_extension'), '');
});

test('isAllowedDocumentFile allows documents and safe images but blocks dangerous extensions and archives', () => {
  assert.equal(isAllowedDocumentFile({ name: 'contract.pdf' }), true);
  assert.equal(isAllowedDocumentFile({ name: 'specs.docx' }), true);
  assert.equal(isAllowedDocumentFile({ name: 'notes.txt' }), true);
  assert.equal(isAllowedDocumentFile({ name: 'preview.png' }), true);

  // Dangerous / blocked extensions (including all archives)
  assert.equal(isAllowedDocumentFile({ name: 'code.zip' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'archive.rar' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'archive.7z' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'exploit.exe' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'script.sh' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'xss.html' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'payload.svg' }), false);
  assert.equal(isAllowedDocumentFile({ name: 'video.mp4' }), false);
});

test('isAllowedImageFile allows standard web images and rejects non-images', () => {
  assert.equal(isAllowedImageFile({ name: 'avatar.png' }), true);
  assert.equal(isAllowedImageFile({ name: 'photo.jpg' }), true);
  assert.equal(isAllowedImageFile({ name: 'hero.webp' }), true);
  assert.equal(isAllowedImageFile({ name: 'logo.gif' }), true);

  assert.equal(isAllowedImageFile({ name: 'avatar.svg' }), false);
  assert.equal(isAllowedImageFile({ name: 'document.pdf' }), false);
  assert.equal(isAllowedImageFile({ name: 'danger.exe' }), false);
});

test('validateDocumentFiles enforces count, extension, and size constraints', () => {
  // Valid list
  const validFiles = [makeFile('doc.pdf', 1024), makeFile('pic.png', 2048)];
  assert.equal(validateDocumentFiles(validFiles), null);

  // Invalid extension
  const invalidExt = [makeFile('malware.exe', 1024)];
  assert.match(validateDocumentFiles(invalidExt) || '', /File type not allowed/);

  // Over individual file size (10MB)
  const oversizedFile = [makeFile('heavy.pdf', 10 * 1024 * 1024 + 1)];
  assert.equal(validateDocumentFiles(oversizedFile), 'Each file must be 10 MB or smaller.');

  // Over total size (25MB)
  const totalOversized = [
    makeFile('1.pdf', 9 * 1024 * 1024),
    makeFile('2.pdf', 9 * 1024 * 1024),
    makeFile('3.pdf', 8 * 1024 * 1024),
  ];
  assert.equal(validateDocumentFiles(totalOversized), 'Files must total 25 MB or less.');

  // Over count limit
  const tooMany = Array.from({ length: 11 }, (_, i) => makeFile(`file-${i}.pdf`));
  assert.equal(validateDocumentFiles(tooMany), 'You can attach up to 10 files.');
});

test('validateImageFiles enforces count, extension, and 5MB image limit', () => {
  const validImage = [makeFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg')];
  assert.equal(validateImageFiles(validImage), null);

  const nonImage = [makeFile('doc.pdf', 1024)];
  assert.match(validateImageFiles(nonImage) || '', /not a supported image format/);

  const oversizedImage = [makeFile('big.png', 5 * 1024 * 1024 + 1, 'image/png')];
  assert.equal(validateImageFiles(oversizedImage), 'Image "big.png" exceeds the 5 MB limit.');
});
