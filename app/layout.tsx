import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuoteFlow',
  description: 'Enquiries, quotes and follow-ups in one place.',
  applicationName: 'QuoteFlow',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'QuoteFlow' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1b2932' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
