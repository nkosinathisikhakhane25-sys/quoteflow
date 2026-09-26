import type { Enquiry } from './enquiries';

export const SOLAR_DEMO_STORAGE_KEY = 'quoteflow-solar-demo-v1';
export function solarDemoEnquiries(): Enquiry[] {
  const date = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const samples = [
    ['Lerato Mokoena', '5kW hybrid solar + 5kWh battery', 'Sandton', 89500, 'New', 1, 'Residential enquiry. Wants backup for essential circuits.'],
    ['Pieter van der Merwe', '8kW inverter + 10kWh storage', 'Centurion', 148000, 'Contacted', 0, 'Arrange a roof assessment and review the electricity bill.'],
    ['Nomsa Dlamini', '6kW rooftop solar installation', 'Midrand', 112000, 'Site Visit', 1, 'Site assessment booked. Check roof orientation and distribution board.'],
    ['Greenleaf Guesthouse', '12kW solar + battery system', 'Pretoria', 265000, 'Quote Sent', -1, 'Quote sent to the owner. Follow up on the proposed installation window.'],
    ['Thabo Nkosi', 'Battery backup upgrade', 'Fourways', 64500, 'Follow-Up', 0, 'Customer comparing battery options. Confirm space and existing inverter compatibility.'],
    ['Cedar Business Park', 'Commercial rooftop solar', 'Johannesburg', 480000, 'Won', null, 'Accepted proposal. Schedule installation with the project team.'],
    ['Sarah Jacobs', '5kW residential solar package', 'Randburg', 98000, 'Won', null, 'Installation confirmed. Prepare the handover checklist.'],
    ['Oakridge Workshop', '10kW workshop solar system', 'Roodepoort', 185000, 'Lost', null, 'Project postponed by the customer.'],
  ] as const;
  return samples.map(([customer_name, service, location, quote_amount, status, due, notes], index) => ({
    id: `solar-demo-${index}`, owner_user_id: 'solar-demo', customer_name, service, location, quote_amount, status,
    phone: null, email: null, follow_up_date: due === null ? null : date(due), notes,
    created_at: `${date(-index)}T09:00:00.000Z`,
  }));
}
