import assert from 'node:assert/strict';
import test from 'node:test';

import { sendMessageWithAttachments, validateMessageAttachments } from './message-attachment.ts';

function makeFile(name, size = 1024, type = 'application/pdf') {
  return new File([new Uint8Array(size)], name, { type });
}

test('validates message attachment count and backend upload limits', () => {
  assert.equal(validateMessageAttachments(Array.from({ length: 6 }, (_, index) => makeFile(`${index}.pdf`))), 'Attach up to 5 files per message.');
  assert.equal(validateMessageAttachments([makeFile('large.pdf', 10 * 1024 * 1024 + 1)]), 'Each message attachment must be 10 MB or smaller.');
  assert.equal(validateMessageAttachments([makeFile('one.pdf', 9 * 1024 * 1024), makeFile('two.pdf', 9 * 1024 * 1024), makeFile('three.pdf', 8 * 1024 * 1024)]), 'Message attachments must total 25 MB or less.');
  assert.equal(validateMessageAttachments([makeFile('brief.pdf')]), null);
});

test('uploads selected files before sending their attachment metadata', async () => {
  const uploads = [];
  let sent;
  const files = [makeFile('brief.pdf'), makeFile('notes.txt', 512, 'text/plain')];
  const uploadApi = {
    async upload(formData) {
      uploads.push(formData);
      const file = formData.get('files');
      return { data: { success: true, url: `https://files.example.com/${file.name}`, path: `user/messages/${file.name}` } };
    },
  };
  const messageApi = {
    async send(receiverId, content, attachments) {
      sent = { receiverId, content, attachments };
      return { data: { id: 'message-1', attachments } };
    },
  };

  await sendMessageWithAttachments(uploadApi, messageApi, 'receiver-1', 'See the files.', files);

  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].get('bucket'), 'contract-documents');
  assert.equal(uploads[0].get('folder'), 'messages');
  assert.equal(uploads[0].get('files'), files[0]);
  assert.deepEqual(sent, {
    receiverId: 'receiver-1',
    content: 'See the files.',
    attachments: [
      { url: 'https://files.example.com/brief.pdf', filename: 'brief.pdf', size: 1024, mimeType: 'application/pdf' },
      { url: 'https://files.example.com/notes.txt', filename: 'notes.txt', size: 512, mimeType: 'text/plain' },
    ],
  });
});
