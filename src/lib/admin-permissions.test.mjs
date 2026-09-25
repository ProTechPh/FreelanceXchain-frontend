import assert from 'node:assert/strict';
import test from 'node:test';

import { getNavSections } from '../components/layout/nav-config.ts';
import { normalizeAuthUser } from './auth-contract.ts';

test('getNavSections for legacy Super Admin (undefined permissions) returns all items', () => {
  const sections = getNavSections('admin');
  assert.equal(sections.length, 3);
  const titles = sections.map((s) => s.title);
  assert.deepEqual(titles, ['Overview', 'Moderation', 'Operations']);
  
  const allLabels = sections.flatMap((s) => s.items.map((i) => i.label));
  assert.ok(allLabels.includes('KYC review'));
  assert.ok(allLabels.includes('Users'));
  assert.ok(allLabels.includes('Disputes'));
  assert.ok(allLabels.includes('System health'));
  assert.ok(allLabels.includes('Audit logs'));
});

test('getNavSections for Super Admin with admin:manage returns all items', () => {
  const sections = getNavSections('admin', ['admin:manage']);
  assert.equal(sections.length, 3);
  const allLabels = sections.flatMap((s) => s.items.map((i) => i.label));
  assert.ok(allLabels.includes('KYC review'));
  assert.ok(allLabels.includes('Users'));
  assert.ok(allLabels.includes('Disputes'));
});

test('getNavSections for KYC Officer (Admin 2: kyc:view, kyc:manage) restricts navigation strictly to KYC', () => {
  // Exactly matching user request:
  // "si admin 2 ang ilalagay ko lang na permission sa kanya is read and edit and write sa kyc lang wala na siyang access sa ibang admin like that and the rest permission"
  const sections = getNavSections('admin', ['kyc:view', 'kyc:manage']);
  
  // Operations section has no permitted items, so it must be omitted
  const titles = sections.map((s) => s.title);
  assert.deepEqual(titles, ['Overview', 'Moderation']);

  const overviewItems = sections.find((s) => s.title === 'Overview')?.items.map((i) => i.label);
  // General overview items with no permission required are kept
  assert.deepEqual(overviewItems, ['Dashboard', 'Notifications']);

  const moderationItems = sections.find((s) => s.title === 'Moderation')?.items.map((i) => i.label);
  // ONLY KYC review is accessible; Users, Disputes, Skills, Support tickets are blocked
  assert.deepEqual(moderationItems, ['KYC review']);

  // Verify completely blocked modules
  const allLabels = sections.flatMap((s) => s.items.map((i) => i.label));
  assert.ok(!allLabels.includes('Users'));
  assert.ok(!allLabels.includes('Disputes'));
  assert.ok(!allLabels.includes('Analytics'));
  assert.ok(!allLabels.includes('App feedback'));
  assert.ok(!allLabels.includes('System health'));
  assert.ok(!allLabels.includes('Audit logs'));
  assert.ok(!allLabels.includes('Skills'));
  assert.ok(!allLabels.includes('Support tickets'));
});

test('getNavSections for Dispute Specialist (disputes:view) shows only Disputes in Moderation', () => {
  const sections = getNavSections('admin', ['disputes:view']);
  const moderationItems = sections.find((s) => s.title === 'Moderation')?.items.map((i) => i.label);
  assert.deepEqual(moderationItems, ['Disputes']);
  const allLabels = sections.flatMap((s) => s.items.map((i) => i.label));
  assert.ok(!allLabels.includes('KYC review'));
  assert.ok(!allLabels.includes('Users'));
});

test('normalizeAuthUser preserves permissions for admin user', () => {
  const normalized = normalizeAuthUser({
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['kyc:view', 'kyc:manage'],
  });
  assert.deepEqual(normalized?.permissions, ['kyc:view', 'kyc:manage']);
});

test('PRESETS and PERMISSION_GROUPS conform to ADMIN_PERMISSIONS catalog', async () => {
  const { PRESETS, PERMISSION_GROUPS } = await import('./admin-permissions.ts');
  const { ADMIN_PERMISSIONS } = await import('../types/index.ts');

  assert.ok(PRESETS.length >= 5);
  for (const preset of PRESETS) {
    assert.ok(preset.name.length > 0);
    assert.ok(preset.permissions.length > 0);
    for (const p of preset.permissions) {
      assert.ok(ADMIN_PERMISSIONS.includes(p), `Permission ${p} in preset ${preset.name} is not recognized`);
    }
  }

  const kycPreset = PRESETS.find((p) => p.name === 'KYC Officer');
  assert.deepEqual(kycPreset?.permissions, ['kyc:view', 'kyc:manage']);

  const superAdminPreset = PRESETS.find((p) => p.name === 'Super Admin');
  assert.equal(superAdminPreset?.permissions.length, ADMIN_PERMISSIONS.length);

  assert.ok(PERMISSION_GROUPS.length >= 4);
});
