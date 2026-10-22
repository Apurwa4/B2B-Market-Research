import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresWorkspaceAuth, isAllowedEmail, hasWorkspaceAccess } from '../lib/access-policy.mjs';

test('local and hosted workspaces are public unless private mode is explicitly enabled', () => {
  assert.equal(requiresWorkspaceAuth({ VERCEL: '1' }), false);
  assert.equal(requiresWorkspaceAuth({ VERCEL: '1', WORKSPACE_AUTH_REQUIRED: 'true', WORKSPACE_ALLOWED_EMAILS: 'owner@example.com' }), false);
  assert.equal(requiresWorkspaceAuth({ WORKSPACE_ACCESS_MODE: 'private' }), true);
  assert.equal(requiresWorkspaceAuth({ VERCEL: '1', WORKSPACE_ACCESS_MODE: 'private' }), true);
  assert.equal(requiresWorkspaceAuth({}), false);
});
test('only confirmed users on the exact email allowlist can access the workspace', () => {
  const env = { WORKSPACE_ALLOWED_EMAILS: 'owner@example.com, member@example.com' };
  assert.equal(hasWorkspaceAccess({ email: 'OWNER@example.com', email_confirmed_at: '2026-10-22' }, env), true);
  assert.equal(hasWorkspaceAccess({ email: 'other@example.com', email_confirmed_at: '2026-10-22' }, env), false);
  assert.equal(hasWorkspaceAccess({ email: 'owner@example.com' }, env), false);
  assert.equal(hasWorkspaceAccess(null, env), false);
  assert.equal(isAllowedEmail('owner@example.com.attacker.test', env), false);
});
test('an empty allowlist grants no access when private mode is enabled', () => {
  assert.equal(hasWorkspaceAccess({ email: 'owner@example.com', email_confirmed_at: '2026-10-22' }, {}), false);
});
