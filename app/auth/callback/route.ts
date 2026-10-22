import { authClient } from '@/lib/workspace-auth';
import { hasWorkspaceAccess } from '@/lib/access-policy.mjs';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    try {
      const client = await authClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (!error && hasWorkspaceAccess(data.user)) return NextResponse.redirect(new URL('/', url.origin));
      await client.auth.signOut();
    } catch { /* Show a generic sign-in error, without leaking account details. */ }
  }
  return NextResponse.redirect(new URL('/login?error=access', url.origin));
}
