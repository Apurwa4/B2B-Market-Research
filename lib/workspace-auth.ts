import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasWorkspaceAccess, requiresWorkspaceAuth } from './access-policy.mjs';

export function authConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
export async function authClient() {
  if (!authConfigured()) throw new Error('Supabase sign-in is not configured.');
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Component writes are handled by the session-refresh proxy. */ }
      },
    },
  });
}
export async function workspaceAccess() {
  if (!requiresWorkspaceAuth()) return { allowed: true, authenticated: false, configured: true };
  if (!authConfigured()) return { allowed: false, authenticated: false, configured: false };
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { allowed: !error && hasWorkspaceAccess(user), authenticated: Boolean(user), configured: true };
}
