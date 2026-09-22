import assert from 'node:assert/strict';
import test from 'node:test';

import { SUPPORT_FAQ, countFaqItems, searchFaq } from './support-faq.ts';

test('every entry asks a question and answers it properly', () => {
  for (const section of SUPPORT_FAQ) {
    assert.ok(section.title.length > 0, 'a section has no title');
    assert.ok(section.items.length > 0, `"${section.title}" has no entries`);

    for (const item of section.items) {
      assert.ok(item.question.endsWith('?'), `${item.id} is not phrased as a question`);
      assert.ok(item.answer.length > 40, `${item.id} answers too briefly to be useful`);
    }
  }
});

test('ids are unique across the whole FAQ', () => {
  // The id is the accordion key. A duplicate would make two entries open and
  // close together, which reads as a rendering bug rather than a data one.
  const ids = SUPPORT_FAQ.flatMap((section) => section.items.map((item) => item.id));
  assert.equal(new Set(ids).size, ids.length, 'duplicate FAQ id');
});

test('both sides of the marketplace are answered', () => {
  // One list serves freelancers and employers, so neither word may go missing.
  const corpus = SUPPORT_FAQ.flatMap((section) =>
    section.items.map((item) => `${item.question} ${item.answer}`.toLowerCase())
  ).join(' ');

  assert.ok(corpus.includes('freelancer'), 'nothing addresses freelancers');
  assert.ok(corpus.includes('employer'), 'nothing addresses employers');
});

test('an empty query returns the whole FAQ untouched', () => {
  assert.deepEqual(searchFaq(''), SUPPORT_FAQ);
  assert.deepEqual(searchFaq('   '), SUPPORT_FAQ);
});

test('search matches questions and answers, ignoring case', () => {
  const byQuestion = searchFaq('escrow');
  assert.ok(byQuestion.length > 0, 'a core term matched nothing');
  assert.ok(countFaqItems(byQuestion) < countFaqItems(), 'search did not narrow anything');

  // "wallet" appears in an answer under Getting started as well as in its own
  // question, so a body-only match must still surface.
  assert.deepEqual(searchFaq('WALLET'), searchFaq('wallet'));
});

test('search drops sections it empties rather than leaving bare headings', () => {
  for (const section of searchFaq('escrow')) {
    assert.ok(section.items.length > 0, `"${section.title}" survived with no entries`);
  }
});

test('a query that matches nothing returns nothing', () => {
  assert.deepEqual(searchFaq('zzzznotathing'), []);
});

test('countFaqItems totals every section', () => {
  const expected = SUPPORT_FAQ.reduce((total, section) => total + section.items.length, 0);
  assert.equal(countFaqItems(), expected);
  assert.equal(countFaqItems([]), 0);
});
