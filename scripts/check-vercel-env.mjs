const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'];
const missing = required.filter(key => !process.env[key]);
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SECRET_KEY');
if (missing.length) {
  console.error('Missing configuration: ' + missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('Database and authentication environment variables are configured.');
}
const emails = (process.env.WORKSPACE_ALLOWED_EMAILS || '').split(/[,;\n]/).map(email => email.trim()).filter(Boolean);
console.log(emails.length ? `Access allowlist contains ${emails.length} email address(es).` : 'Access allowlist is empty. The hosted workspace will remain closed.');
console.log('Apply supabase/migrations/202610220001_research_workspace.sql and transfer local records before the first hosted company request.');
