import { handleApi } from '@/lib/company-api.mjs';
import { getDatabase } from '@/lib/database.mjs';
import { workspaceAccess } from '@/lib/workspace-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  try {
    const access = await workspaceAccess();
    if (!access.allowed) return Response.json({ error: 'Sign in with an invited team account.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return await handleApi(request, { DB: getDatabase() });
  } catch (error) {
    console.error('Could not open the company database:', error);
    return Response.json(
      { error: 'The workspace database is not available. Please contact your workspace administrator.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export { handle as GET, handle as POST, handle as PUT };
