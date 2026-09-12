import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';

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
    <html lang="en">
      <body className="bg-[#f8fafc] text-[#0f172a] antialiased font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
