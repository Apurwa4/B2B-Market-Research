import test from 'node:test';
import assert from 'node:assert/strict';
import { completeEmailSignIn } from '../lib/sign-in-result.mjs';
const env = { WORKSPACE_ALLOWED_EMAILS: 'member@example.com' };
const member = { email: 'member@example.com', email_confirmed_at: '2026-10-22' };

test('forwards the PKCE flow ID to select the matching cookie', async () => {
  let args;
  const client = { auth: { async exchangeCodeForSession(...values) { args = values; return { data: { user: member }, error: null }; } } };
  assert.deepEqual(await completeEmailSignIn(new URLSearchParams('code=test-code&sb_flow_id=flow-12345678'), client, env), { ok: true });
  assert.deepEqual(args, ['test-code', { flowId: 'flow-12345678' }]);
});
test('older links without a flow ID still work', async () => {
  const client = { auth: { async exchangeCodeForSession(code, options) { assert.equal(options, undefined); return { data: { user: member } }; } } };
  assert.equal((await completeEmailSignIn(new URLSearchParams('code=test-code'), client, env)).ok, true);
});
test('supports server-side email token hash templates', async () => {
  const client = { auth: { async verifyOtp(args) { assert.deepEqual(args, { token_hash: 'test-hash', type: 'email' }); return { data: { user: member } }; } } };
  assert.equal((await completeEmailSignIn(new URLSearchParams('token_hash=test-hash&type=email'), client, env)).ok, true);
  assert.equal((await completeEmailSignIn(new URLSearchParams('token_hash=test-hash&type=recovery'), client, env)).reason, 'missing');
});
test('expired links and missing browser cookies produce distinct errors', async () => {
  for (const [code, reason] of [['otp_expired', 'expired'], ['pkce_code_verifier_not_found', 'browser'], ['bad_code_verifier', 'browser']]) {
    const client = { auth: { async exchangeCodeForSession() { return { error: { code } }; } } };
    assert.equal((await completeEmailSignIn(new URLSearchParams('code=test'), client, env)).reason, reason);
  }
});
test('verified but uninvited accounts are signed out locally and denied', async () => {
  let signedOut = false;
  const client = { auth: { async exchangeCodeForSession() { return { data: { user: member } }; }, async signOut(options) { assert.equal(options.scope, 'local'); signedOut = true; } } };
  assert.equal((await completeEmailSignIn(new URLSearchParams('code=test'), client, {})).reason, 'access');
  assert.equal(signedOut, true);
});
test('incomplete and provider-rejected links never start verification', async () => {
  assert.equal((await completeEmailSignIn(new URLSearchParams(), {}, env)).reason, 'missing');
  assert.equal((await completeEmailSignIn(new URLSearchParams('error_code=otp_expired'), {}, env)).reason, 'expired');
});
