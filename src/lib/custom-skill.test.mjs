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
  assert.match(validateCustomSkill({ ...valid, name: 'A' }) ?? '', /2 and 100/);
  assert.match(validateCustomSkill({ ...valid, description: 'Too short' }) ?? '', /10 and 500/);
  assert.match(validateCustomSkill({ ...valid, yearsOfExperience: 51 }) ?? '', /0 and 50/);
});
