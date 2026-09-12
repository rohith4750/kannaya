'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#f8fafc]">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Header />
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto min-h-0 pb-16 md:pb-5">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
