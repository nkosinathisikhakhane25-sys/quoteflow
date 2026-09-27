# QuoteFlow

QuoteFlow is a Next.js dashboard for enquiries, quotes, follow-ups, and jobs. It uses Supabase Auth and user-owned rows in the existing `public.enquiries` table.

## Local development

Use Node 24 (`nvm use`). Copy `.env.example` to `.env.local`, fill in the Supabase project URL and publishable key, then run `npm install` and `npm run dev`.

## Database migration

Apply [`supabase/migrations/20260925000000_enquiry_ownership_rls.sql`](supabase/migrations/20260925000000_enquiry_ownership_rls.sql) using a database administrator connection or the Supabase SQL Editor **before** using the authenticated app. It adds `owner_user_id`, removes all old enquiry policies, denies anonymous access, and grants signed-in users only their own rows. It does not delete existing enquiries.

Existing rows have no known owner and will be invisible after the migration. An administrator must assign each legacy row to the correct `auth.users.id` after verifying ownership. For example:

```sql
update public.enquiries
set owner_user_id = '<verified-user-uuid>'
where id = '<verified-enquiry-uuid>' and owner_user_id is null;
```

After all legacy rows are assigned, validate the ownership constraint:

```sql
alter table public.enquiries validate constraint enquiries_owner_required;
```

Supabase Email Auth must be enabled. Add the deployed origin and the local development origin to the Auth redirect URL allow list so confirmation links can return to `/auth/callback`. For production email confirmation, configure a reliable SMTP provider in Supabase Auth.

To verify isolation, create two throwaway accounts on `/login` and confirm both emails. Copy `.env.test.example` to `.env.test.local` and fill the four test credentials. `.env.test.local` is ignored by Git. Do not use real customer accounts for this check.

## Vercel deployment

1. Put the repository on GitHub and import it into Vercel as a Next.js project. Use Node 24 and the default `npm run build` command.
2. Add these **Production** environment variables in Vercel before the first build:
   - `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key

3. Set the deployed URL as the Supabase Auth Site URL and add `https://<your-domain>/auth/callback` to the Auth redirect URL allow list. Configure production SMTP for confirmation emails.
4. Deploy, then test sign-in, enquiry creation, and PWA installation over HTTPS. Redeploy after changing either public environment variable because its value is embedded at build time.

Keep `.env.local` and `.env.test.local` only on your machine; do not add test-account credentials to Vercel. The PWA needs a network connection for Supabase data and does not queue offline changes.

The ownership migration and two-account isolation check passed against the current Supabase project. Assign any preserved unowned enquiries to verified owners before those users need access. Never put a service-role or secret key in browser environment variables.

## Prince Solar Solutions demo

Open `/demo/solar` for an interactive, login-free client demo with eight fictional solar enquiries. Add enquiries, edit quote amounts/statuses/follow-up dates/notes, use search and filters, and explore the pipeline. Demo edits persist in that browser's local storage; **Reset demo** restores the examples. This route never connects to Supabase or touches production customer records. After deploying, share `https://<your-domain>/demo/solar` with the client. Pricing shown is sample data, not a live solar quotation.

### Elevate booking page

`/book` is a public, mobile-first booking page. `POST /api/bookings` validates booking details and inserts into the separate `demo_bookings` Supabase table. Apply `supabase/migrations/20260927000000_demo_bookings.sql` to the configured project before accepting live bookings. The existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variables are used; no service-role key is needed.

The intake table permits public inserts only, with no public read or update access. Review bookings through trusted Supabase administration. Records include `source = Booking Link`, `status = Demo Booked`, and a server-generated `created_at`, ready for a later CRM import. No calendar integration or automated confirmation email is configured; the selected SAST time is a preference that the team confirms manually. If persistence is unavailable, the form shows an error and retains the entered details.

The two local SVGs under `public/book` are explicitly labelled demo layout placeholders and contain no customer results. Replace them with approved dashboard screenshots when available. Publishing at `elevate.com/book` requires deploying this project and connecting the domain.
