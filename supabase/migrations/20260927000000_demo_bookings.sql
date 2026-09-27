-- Public booking intake is isolated from tenant-owned enquiries.
create table public.demo_bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  business_name text not null check (length(trim(business_name)) between 1 and 200),
  email text not null check (length(email) between 3 and 200),
  phone text not null check (length(phone) between 7 and 200),
  industry text not null check (industry in ('Solar', 'Pool', 'Other')),
  preferred_date date not null,
  preferred_time time not null,
  source text not null default 'Booking Link' check (source = 'Booking Link'),
  status text not null default 'Demo Booked' check (status = 'Demo Booked'),
  created_at timestamptz not null default now()
);
alter table public.demo_bookings enable row level security;
revoke all on public.demo_bookings from anon, authenticated;
grant insert (name, business_name, email, phone, industry, preferred_date, preferred_time, source, status) on public.demo_bookings to anon, authenticated;
create policy "Public demo booking intake" on public.demo_bookings for insert to anon, authenticated
with check (source = 'Booking Link' and status = 'Demo Booked' and (preferred_date + preferred_time) at time zone 'Africa/Johannesburg' > now());
