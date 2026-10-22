'use client';
import { useState, type FormEvent } from 'react';

export default function LoginForm({ error }: { error: boolean }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(error ? 'This sign-in link could not grant access. Request a new link or contact your workspace administrator.' : '');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/request-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error();
      setMessage('If your email has access, you’ll receive a sign-in link shortly. Open it in this browser.');
    } catch { setMessage('We couldn’t request a sign-in link. Please try again shortly.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="login-form"><label htmlFor="login-email">Team email</label><input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/><button type="submit" className="button primary" disabled={busy}>{busy ? 'Requesting link…' : 'Email me a sign-in link'}</button>{message && <p className="login-message" role="status">{message}</p>}</form>;
}
