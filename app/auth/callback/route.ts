import { authClient } from '@/lib/workspace-auth';
import { completeEmailSignIn } from '@/lib/sign-in-result.mjs';
import { NextResponse } from 'next/server';
import { requiresWorkspaceAuth } from '@/lib/access-policy.mjs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!requiresWorkspaceAuth()) {
    const response = NextResponse.redirect(new URL('/', url.origin));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  let reason = 'unavailable';
  try {
    const result = await completeEmailSignIn(url.searchParams, await authClient());
    if (result.ok) {
      const response = NextResponse.redirect(new URL('/', url.origin));
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }
    reason = result.reason || reason;
  } catch { /* Do not log URLs, codes, cookies, or session credentials. */ }
  console.warn('Workspace sign-in failed:', reason);
  const login = new URL('/login', url.origin);
  login.searchParams.set('error', reason);
  const response = NextResponse.redirect(login);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
