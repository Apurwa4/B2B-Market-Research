import { requiresWorkspaceAuth } from '../lib/access-policy.mjs';

const privateMode = requiresWorkspaceAuth();
const required = ['SUPABASE_URL'];
if (privateMode) required.push('SUPABASE_PUBLISHABLE_KEY');
const missing = required.filter(key => !process.env[key]);
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SECRET_KEY');
if (missing.length) {
  console.error('Missing configuration: ' + missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('Required server environment variables are configured.');
}
const emails = (process.env.WORKSPACE_ALLOWED_EMAILS || '').split(/[,;\n]/).map(email => email.trim()).filter(Boolean);
if (privateMode) {
  console.log(emails.length ? `Private access allowlist contains ${emails.length} email address(es).` : 'Private mode has an empty allowlist. Nobody can sign in.');
} else {
  console.log('Public access enabled: anyone can view, add, and edit companies without signing in.');
}
console.log('Apply supabase/migrations/202610220001_research_workspace.sql and transfer local records before the first hosted company request.');
