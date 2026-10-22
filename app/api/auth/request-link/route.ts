import { authClient, authConfigured } from '@/lib/workspace-auth';
import { requestSignInLink } from '@/lib/request-sign-in.mjs';
import { requiresWorkspaceAuth } from '@/lib/access-policy.mjs';

export async function POST(request: Request) {
  if (!requiresWorkspaceAuth()) {
    return Response.json({ error: 'Sign-in is not required. Open the workspace directly.' }, { status: 410 });
  }
  return requestSignInLink(request, { configured: authConfigured(), createClient: authClient });
}
