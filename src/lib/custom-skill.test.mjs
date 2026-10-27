import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCustomSkill } from './custom-skill.ts';

const valid = {
  name: 'Prompt engineering',
  description: 'Designs and evaluates reliable language-model prompts.',
  yearsOfExperience: 2,
};

test('custom skills follow backend field constraints', () => {
  assert.equal(validateCustomSkill(valid), null);
  assert.match(validateCustomSkill({ ...valid, name: 'A' }) ?? '', /at least 2 letters or numbers/);
  assert.match(validateCustomSkill({ ...valid, name: 'A'.repeat(101) }) ?? '', /100 characters or fewer/);
  assert.match(validateCustomSkill({ ...valid, description: 'Too short' }) ?? '', /at least 10 letters or numbers/);
  assert.match(validateCustomSkill({ ...valid, description: ' . '.repeat(50) }) ?? '', /at least 10 letters or numbers/);
  assert.match(validateCustomSkill({ ...valid, yearsOfExperience: 51 }) ?? '', /0 and 50/);
});
