import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeHtml } from './sanitize-html.ts';

test('sanitizeHtml strips script tags and executable contents', () => {
  const payload = '<div>Hello <script>alert("xss")</script>world</div>';
  const clean = sanitizeHtml(payload);
  assert.ok(!clean.includes('<script>'));
  assert.ok(!clean.includes('alert("xss")'));
  assert.ok(clean.includes('Hello'));
  assert.ok(clean.includes('world'));
});

test('sanitizeHtml strips inline event handlers', () => {
  const payload = '<img src="valid.jpg" onerror="alert(document.cookie)" onload="fetch(\'/steal\')" />';
  const clean = sanitizeHtml(payload);
  assert.ok(!clean.includes('onerror'));
  assert.ok(!clean.includes('onload'));
  assert.ok(!clean.includes('alert'));
  assert.ok(!clean.includes('/steal'));
});

test('sanitizeHtml neutralizes javascript: pseudo-protocols', () => {
  const payload = '<a href="javascript:alert(1)">Click me</a>';
  const clean = sanitizeHtml(payload);
  assert.ok(!clean.includes('javascript:'));
  assert.ok(clean.includes('Click me'));
});

test('sanitizeHtml removes style tags and dangerous iframe / object elements', () => {
  const payload = '<style>body { display: none; }</style><iframe src="evil.com"></iframe><p>Safe text</p>';
  const clean = sanitizeHtml(payload);
  assert.ok(!clean.includes('<style>'));
  assert.ok(!clean.includes('<iframe>'));
  assert.ok(clean.includes('<p>Safe text</p>'));
});

test('sanitizeHtml preserves safe rich-text email tags', () => {
  const payload = '<h1>Invoice</h1><p>Thank you for your <b>business</b>!</p><br/>';
  const clean = sanitizeHtml(payload);
  assert.ok(clean.includes('<h1>Invoice</h1>'));
  assert.ok(clean.includes('<b>business</b>'));
});

test('sanitizeHtml handles null and non-string inputs safely', () => {
  assert.equal(sanitizeHtml(''), '');
  assert.equal(sanitizeHtml(null), '');
  assert.equal(sanitizeHtml(undefined), '');
});
