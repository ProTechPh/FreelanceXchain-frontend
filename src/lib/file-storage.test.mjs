import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFileSize } from './file-storage.ts';

test('formats backend quota bytes for participant settings', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1_572_864), '1.5 MB');
});
