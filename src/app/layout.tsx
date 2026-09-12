import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

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
      <body className="bg-[#f1f5f9] text-slate-900 antialiased flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-5 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
