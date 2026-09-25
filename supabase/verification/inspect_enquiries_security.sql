-- Run read-only in the Supabase SQL Editor after the ownership migration.
-- The result contains no customer details.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enquiries'
      and column_name = 'owner_user_id' and data_type = 'uuid'
  ) as owner_user_id_uuid_exists,
  (select relrowsecurity from pg_class where oid = 'public.enquiries'::regclass) as rls_enabled,
  has_table_privilege('anon', 'public.enquiries', 'SELECT') as anon_has_select_grant,
  has_table_privilege('anon', 'public.enquiries', 'INSERT') as anon_has_insert_grant,
  has_table_privilege('anon', 'public.enquiries', 'UPDATE') as anon_has_update_grant,
  has_table_privilege('authenticated', 'public.enquiries', 'SELECT') as authenticated_has_select_grant,
  has_table_privilege('authenticated', 'public.enquiries', 'INSERT') as authenticated_has_insert_grant,
  has_column_privilege('authenticated', 'public.enquiries', 'status', 'UPDATE') as authenticated_can_update_status,
  has_column_privilege('authenticated', 'public.enquiries', 'owner_user_id', 'UPDATE') as authenticated_can_update_owner,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'enquiries') as policy_count,
  (select coalesce(jsonb_agg(jsonb_build_object(
    'name', policyname, 'command', cmd, 'roles', roles,
    'using', qual, 'with_check', with_check
  ) order by policyname), '[]'::jsonb)
   from pg_policies where schemaname = 'public' and tablename = 'enquiries') as policies;
