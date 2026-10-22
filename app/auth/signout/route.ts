import { authClient } from '@/lib/workspace-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin) return new Response('Forbidden', { status: 403 });
  const client = await authClient();
  await client.auth.signOut();
  return NextResponse.redirect(new URL('/login', url.origin), 303);
}
