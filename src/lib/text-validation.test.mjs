import assert from 'node:assert/strict';
import test from 'node:test';

import { countMeaningfulChars } from './text-validation.ts';

test('counts only letters and digits toward minimum lengths', () => {
  assert.equal(countMeaningfulChars('   .   .   .   '), 0);
  assert.equal(countMeaningfulChars(' . '.repeat(100)), 0);
  assert.equal(countMeaningfulChars(' ​\n\t-_!?'), 0);
  assert.equal(countMeaningfulChars('Verified ID #42.'), 12);
  assert.equal(countMeaningfulChars('Pagpapatunay ñ 日本'), 15);
});
