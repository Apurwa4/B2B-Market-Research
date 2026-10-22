'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { signInMessages } from '@/lib/sign-in-messages.mjs';

export default function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const [message, setMessage] = useState(error ? (Object.hasOwn(signInMessages, error) ? signInMessages[error as keyof typeof signInMessages] : signInMessages.unavailable) : '');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/request-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof result?.error === 'string' ? result.error : 'The sign-in service is unavailable. Please try again later.');
        return;
      }
      setCooldown(60);
      setMessage('If your email has access, you’ll receive a sign-in link shortly. Open it in this browser.');
    } catch { setMessage('We couldn’t request a sign-in link. Please try again shortly.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="login-form"><label htmlFor="login-email">Team email</label><input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/><button type="submit" className="button primary" disabled={busy || cooldown > 0}>{busy ? 'Requesting link…' : cooldown > 0 ? `Request again in ${cooldown}s` : 'Email me a sign-in link'}</button>{message && <p className="login-message" role="status">{message}</p>}</form>;
}
