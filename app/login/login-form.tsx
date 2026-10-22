'use client';
import { useState, type FormEvent } from 'react';
import { signInMessages } from '@/lib/sign-in-messages.mjs';

export default function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(error ? signInMessages[error as keyof typeof signInMessages] || signInMessages.unavailable : '');
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
