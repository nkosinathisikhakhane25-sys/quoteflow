import type { Metadata } from 'next';
import Dashboard from '@/app/dashboard';

export const metadata: Metadata = {
  title: 'Solarvia | QuoteFlow Demo',
  description: 'Explore the Solarvia interactive solar installation demo.',
  robots: { index: false, follow: false },
};

export default function SolarviaDemo() {
  return <Dashboard userId="solarvia-demo" userEmail="Solarvia" demo demoCompany="Solarvia" demoStorageKey="quoteflow-solarvia-demo-v1" />;
}
