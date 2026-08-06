import assert from 'node:assert/strict';
import test from 'node:test';

import { formatFileSize, safeAttachmentUrl } from './attachment-presentation.ts';

test('only presents http and https attachment URLs as links', () => {
  assert.equal(safeAttachmentUrl('https://files.example.com/brief.pdf'), 'https://files.example.com/brief.pdf');
  assert.equal(safeAttachmentUrl('http://localhost:3000/file.txt'), 'http://localhost:3000/file.txt');
  assert.equal(safeAttachmentUrl('javascript:alert(1)'), null);
  assert.equal(safeAttachmentUrl('/relative/file.pdf'), null);
  assert.equal(safeAttachmentUrl('not a URL'), null);
});

test('formats attachment sizes for compact project and proposal lists', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '2 KB');
  assert.equal(formatFileSize(1_572_864), '1.5 MB');
});
