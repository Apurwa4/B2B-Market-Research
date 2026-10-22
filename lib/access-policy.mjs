export function requiresWorkspaceAuth(env = process.env) {
  return Boolean(env.VERCEL) || env.WORKSPACE_AUTH_REQUIRED === 'true';
}
export function isAllowedEmail(email, env = process.env) {
  if (typeof email !== 'string' || !email.trim()) return false;
  const allowed = (env.WORKSPACE_ALLOWED_EMAILS || '').split(/[,;\n]/).map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
export function hasWorkspaceAccess(user, env = process.env) {
  return Boolean(user?.email_confirmed_at && isAllowedEmail(user.email, env));
}
