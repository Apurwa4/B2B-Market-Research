import { handleApi } from '@/lib/company-api.mjs';
import { getDatabase } from '@/lib/database.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  try {
    return await handleApi(request, { DB: getDatabase() });
  } catch (error) {
    console.error('Could not open the company database:', error);
    return Response.json(
      { error: 'Could not open the local database. Check the server terminal for details.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export { handle as GET, handle as POST, handle as PUT };
