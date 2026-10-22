import { redirect } from 'next/navigation';
import { workspaceAccess } from '@/lib/workspace-auth';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const access = await workspaceAccess();
  if (access.allowed) redirect('/');
  const { error } = await searchParams;
  return <main className="login-page"><section className="login-card"><span className="login-wordmark">iGT</span><div className="eyebrow">AIESEC IN KANDY · WINTER 26.27</div><h1>Your research workspace.</h1><p>Sign in with your invited team email to continue.</p>{!access.configured ? <p className="login-message" role="status">Workspace sign-in is being set up. Please contact your workspace administrator.</p> : <LoginForm error={error}/>}</section></main>;
}
