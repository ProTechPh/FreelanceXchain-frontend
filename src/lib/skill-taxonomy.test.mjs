import assert from 'node:assert/strict';
import test from 'node:test';

import { detectCategoryIds, isSoftSkillCategory, toSkillCategories } from './skill-taxonomy.ts';

const option = (name) => ({ id: name, name });
const categories = [
  { id: 'blockchain', name: 'Blockchain', skills: [option('Solidity')] },
  { id: 'frontend', name: 'Frontend', skills: [option('React')] },
  { id: 'backend', name: 'Backend', skills: [option('Node.js')] },
  { id: 'mobile', name: 'Mobile', skills: [option('Flutter'), option('Swift')] },
  { id: 'ai', name: 'AI & Machine Learning', skills: [option('NLP')] },
  { id: 'security', name: 'Cybersecurity', skills: [option('Penetration Testing')] },
  { id: 'games', name: 'Game Development', skills: [option('Unity')] },
  { id: 'web', name: 'Web Development', skills: [option('MERN Stack'), option('Laravel')] },
  { id: 'nuclear', name: 'Nuclear Engineering', skills: [option('Reactor Operations'), option('Health Physics')] },
  { id: 'explosives', name: 'Explosives Safety & Disposal', skills: [option('Bomb Disposal'), option('Blasting Engineering')] },
  { id: 'soft', name: 'Soft Skills', skills: [option('Communication'), option('Leadership')] },
];

test('detects the category from keywords in a job position', () => {
  assert.deepEqual(detectCategoryIds('Senior iOS Engineer', categories), ['mobile']);
  assert.deepEqual(detectCategoryIds('Mobile Developer', categories), ['mobile']);
  assert.deepEqual(detectCategoryIds('Full-stack developer', categories), ['frontend', 'backend', 'web']);
  assert.deepEqual(detectCategoryIds('Web Developer', categories), ['frontend', 'backend', 'web']);
  assert.deepEqual(detectCategoryIds('WordPress developer', categories), ['web']);
  assert.deepEqual(detectCategoryIds('Laravel engineer', categories), ['web']);
  assert.deepEqual(detectCategoryIds('Web3 developer', categories), ['blockchain']);
  assert.deepEqual(detectCategoryIds('Smart Contract Auditor', categories), ['blockchain', 'security']);
});

test('detects the category from a skill named in the job position', () => {
  assert.deepEqual(detectCategoryIds('Flutter dev', categories), ['mobile']);
  assert.deepEqual(detectCategoryIds('node.js engineer', categories), ['backend']);
});

test('matches whole words only and ignores the soft skills category', () => {
  assert.deepEqual(detectCategoryIds('Software Engineer II', categories), []);
  assert.deepEqual(detectCategoryIds('Open source maintainer', categories), []);
  assert.deepEqual(detectCategoryIds('Team leadership coach', categories), []);
  assert.deepEqual(detectCategoryIds('   ', categories), []);
});

test('detects nuclear and explosives safety roles', () => {
  assert.deepEqual(detectCategoryIds('Nuclear Engineer', categories), ['nuclear']);
  assert.deepEqual(detectCategoryIds('Radiation Protection Officer', categories), ['nuclear']);
  assert.deepEqual(detectCategoryIds('Bomb Disposal Technician', categories), ['explosives']);
  assert.deepEqual(detectCategoryIds('EOD Specialist', categories), ['explosives']);
  assert.deepEqual(detectCategoryIds('Mine blasting engineer', categories), ['explosives']);
});

test('detects categories an admin adds later by their name and skills', () => {
  assert.deepEqual(detectCategoryIds('Game Development Lead', categories), ['games']);
  assert.deepEqual(detectCategoryIds('Unity programmer', categories), ['games']);
});

test('recognizes the soft skills category by name', () => {
  assert.equal(isSoftSkillCategory('Soft Skills'), true);
  assert.equal(isSoftSkillCategory(' soft  skills '), true);
  assert.equal(isSoftSkillCategory('Frontend'), false);
});

test('keeps only active categories that still have active skills', () => {
  const skill = (id, isActive = true) => ({ id, categoryId: 'c', name: id, description: '', isActive, createdAt: '', updatedAt: '' });
  const category = (id, skills, isActive = true) => ({ id, name: id, description: '', isActive, createdAt: '', updatedAt: '', skills });
  assert.deepEqual(
    toSkillCategories([
      category('frontend', [skill('React'), skill('Old', false)]),
      category('hidden', [skill('Vue')], false),
      category('empty', [skill('Gone', false)]),
    ]),
    [{ id: 'frontend', name: 'frontend', skills: [{ id: 'React', name: 'React' }] }],
  );
});
