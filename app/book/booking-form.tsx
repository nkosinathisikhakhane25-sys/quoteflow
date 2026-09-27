'use client';

import { useRef, useState, type FormEvent } from 'react';
import { demoTimes, industries, validateBooking, type Booking } from '@/lib/bookings';

export default function BookingForm({ today }: { today: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = Object.fromEntries(new FormData(event.currentTarget));
    const validated = validateBooking(input);
    if (!validated.booking) { setError(validated.error || 'Please check your details.'); return; }
    setPending(true); setError('');
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validated.booking) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Please try again shortly.'); return; }
      setBooking(result.booking);
      requestAnimationFrame(() => confirmation.current?.focus());
    } catch { setError('Unable to connect. Please check your connection and try again.'); }
    finally { setPending(false); }
  }
  if (booking) return <div className="book-confirmation" ref={confirmation} tabIndex={-1} role="status"><span className="book-success">✓</span><p className="book-kicker">YOU’RE ON THE LIST</p><h3>Your demo is booked</h3><p>We’ll be in touch shortly with your confirmation details.</p><dl><div><dt>Business</dt><dd>{booking.business_name}</dd></div><div><dt>Selected date</dt><dd>{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long', timeZone: 'Africa/Johannesburg' }).format(new Date(`${booking.preferred_date}T12:00:00+02:00`))}</dd></div><div><dt>Selected time</dt><dd>{booking.preferred_time} SAST · 15 minutes</dd></div></dl><p className="book-small">We’ll confirm your preferred time with you.</p></div>;
  return <form className="book-form" onSubmit={submit}><div className="book-form-heading"><span>YOUR FREE DEMO</span><span>15 MINUTES</span></div><div className="book-fields">
    <label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required maxLength={200} /></label>
    <label>Business name<input name="business_name" autoComplete="organization" placeholder="Your company" required maxLength={200} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@company.co.za" required maxLength={200} /></label>
    <label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="082 123 4567" required maxLength={30} /></label>
    <label className="book-field-wide">Industry<select name="industry" required defaultValue=""><option value="" disabled>Select your industry</option>{industries.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Preferred date<input name="preferred_date" type="date" min={today} required /></label>
    <label>Preferred time<select name="preferred_time" required defaultValue=""><option value="" disabled>Select a time</option>{demoTimes.map(time => <option key={time}>{time}</option>)}</select></label>
  </div><p className="book-small">All times are South African Standard Time (SAST).</p>{error && <p className="book-error" role="alert">{error}</p>}<button className="book-button" disabled={pending} type="submit">{pending ? 'Booking your demo…' : 'Book My Free Demo'}<span aria-hidden="true">↗</span></button><p className="book-form-trust">No commitment. Just a quick walkthrough.</p><p className="book-small book-center">If it makes sense for your business, we’ll explain the next step.</p></form>;
}
