import { createClient } from '@supabase/supabase-js';
import { validateBooking } from '@/lib/bookings';

export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Request not allowed.' }, { status: 403 });
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: 'Request too large.' }, { status: 413 });
    input = JSON.parse(body);
  } catch { return Response.json({ error: 'Please send valid booking details.' }, { status: 400 }); }
  const { booking, error } = validateBooking(input);
  if (!booking) return Response.json({ error }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: 'Booking is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: saveError } = await supabase.from('demo_bookings').insert({ ...booking, source: 'Booking Link', status: 'Demo Booked' });
    if (saveError) return Response.json({ error: 'We couldn’t save your booking. Please try again shortly.' }, { status: 503 });
    return Response.json({ booking }, { status: 201 });
  } catch { return Response.json({ error: 'We couldn’t save your booking. Please try again shortly.' }, { status: 503 }); }
}
