export const signInMessages = {
  expired: 'This sign-in link has expired or was already used. Request a new link and use only the newest email.',
  browser: 'The sign-in cookie could not be found. Request a new link from this website and open it in the same browser, with cookies enabled.',
  access: 'Your email was verified, but it is not on the workspace access list. Ask the administrator to check WORKSPACE_ALLOWED_EMAILS in Vercel Production and redeploy.',
  missing: 'This sign-in link is incomplete. Request a new link. If it happens again, ask the administrator to check the Supabase email template and redirect URL.',
  unavailable: 'Sign-in could not be completed right now. Please request a new link and try again.',
};
