import { isAllowedEmail } from './access-policy.mjs';

function json(body, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function emailRequestFailure(error) {
  if (error?.code === 'over_email_send_rate_limit') return { status: 429, code: 'email_limit', error: 'The email-sending limit has been reached. Please wait for it to reset or contact your workspace administrator to configure email delivery.' };
  if (error?.status === 429 || error?.code === 'over_request_rate_limit') return { status: 429, code: 'rate_limited', error: 'Too many sign-in requests. Please wait a few minutes before trying again.' };
  if (error?.code === 'email_address_not_authorized') return { status: 503, code: 'email_delivery', error: 'Email delivery is not configured for this address. Please contact your workspace administrator.' };
  if (['otp_disabled', 'email_provider_disabled', 'signup_disabled'].includes(error?.code)) return { status: 503, code: 'email_disabled', error: 'Email sign-in is disabled in the workspace configuration. Please contact your workspace administrator.' };
  return { status: 503, code: 'email_unavailable', error: 'The email provider could not send a sign-in link. Please contact your workspace administrator or try again later.' };
}

export async function requestSignInLink(request, { configured, createClient, log = console.warn }, env = process.env) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ code: 'origin', error: 'Please reload the login page on this website and try again.' }, 403);
  if (!configured) return json({ code: 'configuration', error: 'Workspace sign-in is not configured. Please contact your workspace administrator.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ code: 'invalid_request', error: 'Enter a valid email address.' }, 400); }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ code: 'invalid_email', error: 'Enter a valid email address.' }, 400);
  if (!isAllowedEmail(email, env)) return json({ ok: true });
  try {
    const client = await createClient();
    const callback = new URL('/auth/callback', env.WORKSPACE_SITE_URL || url.origin);
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: callback.href } });
    if (error) {
      const failure = emailRequestFailure(error);
      // Log codes only, never email addresses, URLs, keys, or tokens.
      log('Workspace sign-in email failed:', { code: failure.code, providerCode: error.code || 'unknown', status: error.status });
      return json({ code: failure.code, error: failure.error }, failure.status);
    }
    return json({ ok: true });
  } catch {
    log('Workspace sign-in email failed:', { code: 'request_failed' });
    return json({ code: 'request_failed', error: 'Could not connect to the email service. Please try again later.' }, 503);
  }
}
