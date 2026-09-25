-- Preserve all existing rows. Rows without an owner stay inaccessible to app users
-- until an administrator explicitly assigns them to an auth.users ID.
begin;

alter table public.enquiries
  add column if not exists owner_user_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.enquiries'::regclass
      and conname = 'enquiries_owner_user_id_fkey'
  ) then
    alter table public.enquiries
      add constraint enquiries_owner_user_id_fkey
      foreign key (owner_user_id) references auth.users(id) on delete restrict;
  end if;
end $$;

alter table public.enquiries
  alter column owner_user_id set default auth.uid();

-- NOT VALID leaves historic unowned rows intact, while enforcing ownership
-- for every new insert and updated row.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.enquiries'::regclass
      and conname = 'enquiries_owner_required'
  ) then
    alter table public.enquiries
      add constraint enquiries_owner_required
      check (owner_user_id is not null) not valid;
  end if;
end $$;

create index if not exists enquiries_owner_created_at_idx
  on public.enquiries (owner_user_id, created_at desc);

alter table public.enquiries enable row level security;

-- Remove every development policy, whatever its name. Policy OR-composition
-- would otherwise let an old permissive policy bypass tenant isolation.
do $$
declare existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'enquiries'
  loop
    execute format('drop policy %I on public.enquiries', existing_policy.policyname);
  end loop;
end $$;

revoke all on table public.enquiries from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert on table public.enquiries to authenticated;
grant update (
  customer_name, phone, email, service, location, quote_amount,
  status, follow_up_date, notes
) on table public.enquiries to authenticated;

create policy enquiries_select_own
  on public.enquiries for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy enquiries_insert_own
  on public.enquiries for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy enquiries_update_own
  on public.enquiries for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

commit;
