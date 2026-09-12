import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Kannaya ERP - Electrical & Hardware Shop Management OS',
  description:
    'Comprehensive ERP system for Electrical & Hardware Stores featuring Rack Tracking, Thermal Printing, Customer Udhar Ledger, WhatsApp Automations, and AI Insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.className} bg-[#f8fafc] text-[#0f172a] antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

