import { redirect } from 'next/navigation';
import Dashboard from './dashboard';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect('/login');
  return <Dashboard userId={claims.sub} userEmail={typeof claims.email === 'string' ? claims.email : ''} />;
}
