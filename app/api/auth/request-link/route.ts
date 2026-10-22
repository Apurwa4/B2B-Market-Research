import { authClient, authConfigured } from '@/lib/workspace-auth';
import { requestSignInLink } from '@/lib/request-sign-in.mjs';

export async function POST(request: Request) {
  return requestSignInLink(request, { configured: authConfigured(), createClient: authClient });
}
