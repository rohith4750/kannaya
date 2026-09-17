'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ShieldAlert } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const isBillingPage = pathname === '/billing';

  // Fast local check to avoid any full-screen flashing or disruption
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isLoginPage) return true;
    if (typeof window !== 'undefined') {
      const localRole = localStorage.getItem('kannaya_user_role');
      const localId = localStorage.getItem('kannaya_user_id');
      if (localRole || localId) return true;
    }
    return true; // render gracefully while validating session in background
  });

  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.authenticated && data.user) {
          setIsAuthenticated(true);
          if (data.user.id && localStorage.getItem('kannaya_user_id') !== data.user.id) {
            localStorage.setItem('kannaya_user_id', data.user.id);
          }
          if (data.user.role && localStorage.getItem('kannaya_user_role') !== data.user.role) {
            localStorage.setItem('kannaya_user_role', data.user.role);
          }
          if (data.user.name && localStorage.getItem('kannaya_user_name') !== data.user.name) {
            localStorage.setItem('kannaya_user_name', data.user.name);
          }
        } else {
          // If explicitly unauthenticated on server and no local session
          const localRole = localStorage.getItem('kannaya_user_role');
          if (!localRole && !data.authenticated) {
            setIsAuthenticated(false);
            router.replace('/login');
          }
        }
      } catch (err) {
        // Network/offline mode: preserve local session
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#f8fafc]">{children}</main>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Header />
        <main className={`flex-1 p-3 sm:p-4 min-h-0 ${isBillingPage ? 'overflow-hidden pb-3' : 'overflow-y-auto pb-16 md:pb-5'}`}>
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
