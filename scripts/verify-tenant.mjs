import { existsSync } from 'node:fs';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (!existsSync('.env.test.local')) throw new Error('Create .env.test.local from .env.test.example first.');
process.loadEnvFile('.env.test.local');

const required = [
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD',
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is missing.`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const makeClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const anonymous = makeClient();
const a = makeClient();
const b = makeClient();

async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Test account sign-in failed: ${error?.message ?? 'missing user'}`);
  return data.user.id;
}

const userA = await signIn(a, process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD);
const userB = await signIn(b, process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD);
if (userA === userB) throw new Error('Test users must have different IDs.');

const anonymousRead = await anonymous.from('enquiries').select('id', { head: true, count: 'exact' });
if (!anonymousRead.error && anonymousRead.count !== 0) throw new Error('Anonymous users can still read enquiries.');

async function createOwnEnquiry(client, owner, label) {
  const { data, error } = await client.from('enquiries').insert({
    owner_user_id: owner,
    customer_name: `QuoteFlow ${label} tenant verification ${Date.now()}`,
    service: 'Tenant isolation test',
    quote_amount: 1000,
    status: 'New',
  }).select().single();
  if (error || !data) throw new Error(`${label} insert failed: ${error?.message ?? 'no row returned'}`);
  return data.id;
}

async function verifyOwnReadAndUpdate(client, id, label) {
  const firstRead = await client.from('enquiries').select('*').eq('id', id);
  if (firstRead.error || firstRead.data?.length !== 1) throw new Error(`${label} cannot read their own enquiry.`);
  const update = await client.from('enquiries').update({ status: 'Quote Sent', quote_amount: 12345, follow_up_date: '2026-10-15' }).eq('id', id);
  if (update.error) throw new Error(`${label} update failed: ${update.error.message}`);
  const reloaded = await client.from('enquiries').select('*').eq('id', id).single();
  if (reloaded.error || reloaded.data.status !== 'Quote Sent' || Number(reloaded.data.quote_amount) !== 12345 || reloaded.data.follow_up_date !== '2026-10-15') throw new Error(`${label} changes did not persist.`);
}

async function verifyOtherCannotAccess(client, id, label) {
  const read = await client.from('enquiries').select('*').eq('id', id);
  if (read.error || read.data?.length) throw new Error(`${label} can read the other account’s enquiry.`);
  const update = await client.from('enquiries').update({ status: 'Lost' }).eq('id', id).select('id');
  if (update.error || update.data?.length) throw new Error(`${label} can update the other account’s enquiry.`);
}

const aId = await createOwnEnquiry(a, userA, 'A');
await verifyOwnReadAndUpdate(a, aId, 'User A');
await verifyOtherCannotAccess(b, aId, 'User B');

const bId = await createOwnEnquiry(b, userB, 'B');
await verifyOwnReadAndUpdate(b, bId, 'User B');
await verifyOtherCannotAccess(a, bId, 'User A');

console.log(`Two-way tenant isolation passed. Test enquiries: ${aId}, ${bId}`);
