import { hasWorkspaceAccess } from './access-policy.mjs';

function failureReason(error) {
  if (['otp_expired', 'flow_state_expired', 'flow_state_not_found'].includes(error?.code)) return 'expired';
  if (['pkce_code_verifier_not_found', 'bad_code_verifier'].includes(error?.code)) return 'browser';
  return 'unavailable';
}

export async function completeEmailSignIn(params, client, env = process.env) {
  const providerError = params.get('error_code');
  if (providerError) return { ok: false, reason: failureReason({ code: providerError }) };
  const code = params.get('code');
  const hash = params.get('token_hash');
  if (!code && !hash) return { ok: false, reason: 'missing' };
  try {
    let result;
    if (hash) {
      if (params.get('type') !== 'email') return { ok: false, reason: 'missing' };
      result = await client.auth.verifyOtp({ token_hash: hash, type: 'email' });
    } else {
      const flowId = params.get('sb_flow_id');
      // Server SDKs cannot read window.location; forward the flow ID explicitly.
      result = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    }
    if (result.error) return { ok: false, reason: failureReason(result.error) };
    if (hasWorkspaceAccess(result.data.user, env)) return { ok: true };
    await client.auth.signOut({ scope: 'local' });
    return { ok: false, reason: 'access' };
  } catch (error) { return { ok: false, reason: failureReason(error) }; }
}
