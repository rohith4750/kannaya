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

  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      setIsAuthenticated(true);
      return;
    }

    let isMounted = true;

    const verifyAuth = async () => {
      // Check fast local storage fallback first
      const localUserId = localStorage.getItem('kannaya_user_id');
      const localUserRole = localStorage.getItem('kannaya_user_role');

      if (localUserId || localUserRole) {
        if (isMounted) {
          setIsAuthenticated(true);
          setCheckingAuth(false);
        }
      }

      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.authenticated && data.user) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          } else if (!localUserId && !localUserRole) {
            setIsAuthenticated(false);
            setCheckingAuth(false);
            router.replace('/login');
          } else {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (localUserId || localUserRole) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          } else {
            setIsAuthenticated(false);
            setCheckingAuth(false);
            router.replace('/login');
          }
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#f8fafc]">{children}</main>;
  }

  // Show secure loading screen while checking auth
  if (checkingAuth) {
    return (
      <div className="h-screen w-screen bg-[#383838] flex flex-col items-center justify-center p-4 text-white space-y-3 font-sans">
        <div className="w-14 h-14 rounded-full bg-white p-1 border-2 border-[#6d8196] shadow-xl flex items-center justify-center overflow-hidden animate-pulse">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#ffffe3]">
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Verifying Strict Security Authentication Session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render protected children
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
