'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function LoginForm({ initialError }: { initialError: string }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = getSupabase();
  const finishAuthentication = () => { router.replace('/'); router.refresh(); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setBusy(true); setError(''); setMessage('');
    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message);
      else finishAuthentication();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) finishAuthentication();
      else setMessage('Check your email for a confirmation link, then sign in.');
    }
    setBusy(false);
  }

  return <main className="auth-page"><div className="auth-card"><div className="auth-brand"><span className="brand-mark">Q</span><strong>QuoteFlow</strong></div><div className="eyebrow">SERVICE OPERATIONS</div><h1>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h1><p className="auth-intro">Manage your enquiries, quotes and follow-ups.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={mode === 'sign-up' ? 8 : undefined} required value={password} onChange={event=>setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="primary" type="submit" disabled={busy || !supabase}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{mode === 'sign-in' ? 'New to QuoteFlow?' : 'Already have an account?'} <button type="button" onClick={()=>{setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');setError('');setMessage('');}}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</button></p></div></main>;
}
