import test from 'node:test';
import assert from 'node:assert/strict';
import { requestSignInLink } from '../lib/request-sign-in.mjs';
const env = { WORKSPACE_ALLOWED_EMAILS: 'member@example.com', WORKSPACE_SITE_URL: 'https://workspace.example' };
function request(email = 'member@example.com', origin = 'https://workspace.example') { return new Request('https://workspace.example/api/auth/request-link', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); }
function dependencies(error = null) { return { configured: true, log() {}, async createClient() { return { auth: { async signInWithOtp() { return { error }; } } }; } }; }

test('email send quota failures are returned as explicit HTTP 429 errors', async () => {
  const r = await requestSignInLink(request(), dependencies({ code: 'over_email_send_rate_limit', status: 429 }), env);
  assert.equal(r.status, 429); assert.equal((await r.json()).code, 'email_limit');
});
test('default SMTP restrictions are distinguished from request limits', async () => {
  const r = await requestSignInLink(request(), dependencies({ code: 'email_address_not_authorized', status: 403 }), env);
  assert.equal(r.status, 503); assert.equal((await r.json()).code, 'email_delivery');
  const limited = await requestSignInLink(request(), dependencies({ code: 'over_request_rate_limit', status: 429 }), env);
  assert.equal((await limited.json()).code, 'rate_limited');
});
test('uninvited and cross-origin requests never trigger email delivery', async () => {
  const d = { configured: true, log() {}, createClient() { throw new Error('Must not request email'); } };
  assert.equal((await requestSignInLink(request('outsider@example.com'), d, env)).status, 200);
  assert.equal((await requestSignInLink(request('member@example.com', 'https://attacker.example'), d, env)).status, 403);
});
test('successful requests use the configured callback and normalized email', async () => {
  let args;
  const d = { configured: true, log() {}, async createClient() { return { auth: { async signInWithOtp(value) { args = value; return { error: null }; } } }; } };
  const r = await requestSignInLink(request('MEMBER@example.com'), d, env);
  assert.equal(r.status, 200); assert.equal(args.email, 'member@example.com'); assert.equal(args.options.emailRedirectTo, 'https://workspace.example/auth/callback');
});
test('provider internals and credentials never appear in error responses', async () => {
  const r = await requestSignInLink(request(), dependencies({ code: 'unexpected_failure', message: 'sensitive-provider-detail' }), env);
  assert.ok(!(await r.text()).includes('sensitive-provider-detail'));
});
