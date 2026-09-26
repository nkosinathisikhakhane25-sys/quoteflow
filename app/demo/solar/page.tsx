import type { Metadata } from 'next';
import Dashboard from '@/app/dashboard';

export const metadata: Metadata = {
  title: 'Prince Solar Solutions | QuoteFlow Demo',
  description: 'Try QuoteFlow with fictional solar installation enquiries and quotes.',
  robots: { index: false, follow: false },
};

export default function SolarDemo() {
  return <Dashboard userId="solar-demo" userEmail="Prince Solar Solutions" demo />;
}
