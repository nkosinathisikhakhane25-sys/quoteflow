export const STATUSES = ['New', 'Contacted', 'Site Visit', 'Quote Sent', 'Follow-Up', 'Won', 'Lost'] as const;
export type Status = typeof STATUSES[number];
export type Enquiry = { id: string; owner_user_id: string | null; customer_name: string; phone: string | null; email: string | null; service: string | null; location: string | null; quote_amount: number | null; status: string; follow_up_date: string | null; notes: string | null; created_at: string };
export type EnquiryInput = Omit<Enquiry, 'id' | 'created_at' | 'owner_user_id'>;
export const isActive = (e: Enquiry) => e.status !== 'Won' && e.status !== 'Lost';
export const amount = (e: Enquiry) => Number(e.quote_amount ?? 0);
export const money = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
export const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)) : '—';
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function metrics(enquiries: Enquiry[]) { const today = localDate(); const month = today.slice(0,7); const active = enquiries.filter(isActive); const due = active.filter(e => e.follow_up_date && e.follow_up_date <= today); const awaiting = active.filter(e => e.status === 'Quote Sent'); return { openValue: active.reduce((n,e)=>n+amount(e),0), activeQuotes: active.filter(e=>amount(e)>0).length, newCount: enquiries.filter(e=>e.status==='New').length, dueCount: due.length, dueValue: due.reduce((n,e)=>n+amount(e),0), awaitingCount: awaiting.length, wonTotal: enquiries.filter(e=>e.status==='Won').reduce((n,e)=>n+amount(e),0), monthNew: enquiries.filter(e=>e.created_at?.slice(0,7)===month).length }; }
