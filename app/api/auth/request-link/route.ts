import { authClient, authConfigured } from '@/lib/workspace-auth';
import { isAllowedEmail } from '@/lib/access-policy.mjs';

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!authConfigured()) return Response.json({ error: 'Sign-in is not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: 'Enter a valid email.' }, { status: 400 });
    // An empty allowlist denies everyone. Never reveal which addresses are invited.
    if (isAllowedEmail(email)) {
      const client = await authClient();
      const callback = new URL('/auth/callback', process.env.WORKSPACE_SITE_URL || url.origin);
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: callback.href } });
      if (error) return Response.json({ error: 'Could not request a sign-in link.' }, { status: 503 });
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
}
