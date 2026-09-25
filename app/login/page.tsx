import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import LoginForm from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect('/');
  }
  const params = await searchParams;
  return <LoginForm initialError={params.error === 'confirmation' ? 'The confirmation link is invalid or expired. Please sign in or request a new confirmation email.' : ''} />;
}
