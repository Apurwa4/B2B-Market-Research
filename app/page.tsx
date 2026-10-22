import Workspace from '@/components/workspace';
import { workspaceAccess } from '@/lib/workspace-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const access = await workspaceAccess();
  if (!access.allowed) redirect('/login');
  return <Workspace authenticated={access.authenticated} />;
}
