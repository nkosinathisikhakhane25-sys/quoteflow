export const industries = ['Solar', 'Pool', 'Other'] as const;
export const demoTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
export function todayInSouthAfrica() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export type Booking = { name: string; business_name: string; email: string; phone: string; industry: string; preferred_date: string; preferred_time: string };
export function validateBooking(input: unknown): { booking?: Booking; error?: string } {
  if (!input || typeof input !== 'object') return { error: 'Please complete all required fields.' };
  const raw = input as Record<string, unknown>;
  const booking = {} as Booking;
  for (const field of ['name', 'business_name', 'email', 'phone', 'industry', 'preferred_date', 'preferred_time'] as const) {
    if (typeof raw[field] !== 'string' || !raw[field].trim() || raw[field].length > 200) return { error: 'Please complete all fields with valid details.' };
    booking[field] = raw[field].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) return { error: 'Please enter a valid email address.' };
  if (!/^[+\d\s().-]+$/.test(booking.phone) || booking.phone.replace(/\D/g, '').length < 7 || booking.phone.replace(/\D/g, '').length > 15) return { error: 'Please enter a valid phone number.' };
  if (!industries.some(value => value === booking.industry)) return { error: 'Please select your industry.' };
  const date = new Date(`${booking.preferred_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.preferred_date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== booking.preferred_date || booking.preferred_date < todayInSouthAfrica()) return { error: 'Please select today or a future date.' };
  if (!demoTimes.includes(booking.preferred_time) || new Date(`${booking.preferred_date}T${booking.preferred_time}:00+02:00`).getTime() <= Date.now()) return { error: 'Please select a future demo time.' };
  booking.email = booking.email.toLowerCase();
  return { booking };
}
