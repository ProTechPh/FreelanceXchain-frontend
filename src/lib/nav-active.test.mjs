import test from 'node:test';
import assert from 'node:assert/strict';
import { isNavItemActive } from './nav-active.ts';

test('a section root stays current while viewing a detail route', () => {
  assert.equal(isNavItemActive('/dashboard/freelancer/contracts/abc123', '/dashboard/freelancer/contracts'), true);
  assert.equal(isNavItemActive('/dashboard/employer/disputes/xyz', '/dashboard/employer/disputes'), true);
  assert.equal(isNavItemActive('/dashboard/employer/projects/1/proposals', '/dashboard/employer/projects'), true);
});

test('the dashboard root only matches itself', () => {
  assert.equal(isNavItemActive('/dashboard/freelancer', '/dashboard/freelancer'), true);
  assert.equal(isNavItemActive('/dashboard/freelancer/contracts', '/dashboard/freelancer'), false);
  assert.equal(isNavItemActive('/dashboard/admin/users', '/dashboard/admin'), false);
});

test('"Post a project" does not stay lit while browsing projects', () => {
  assert.equal(isNavItemActive('/dashboard/employer/projects', '/dashboard/employer/projects/new'), false);
  assert.equal(isNavItemActive('/dashboard/employer/projects/new', '/dashboard/employer/projects/new'), true);
});

test('sibling sections never match each other', () => {
  assert.equal(isNavItemActive('/dashboard/freelancer/proposals', '/dashboard/freelancer/projects'), false);
  assert.equal(isNavItemActive('/dashboard/freelancer/projects-archive', '/dashboard/freelancer/projects'), false);
});
