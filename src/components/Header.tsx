'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Shield, UserCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [userName, setUserName] = useState<string>('Owner Admin');

  useEffect(() => {
    const savedRole = localStorage.getItem('kannaya_user_role') as 'ADMIN' | 'STAFF';
    const savedName = localStorage.getItem('kannaya_user_name');
    if (savedRole) setCurrentRole(savedRole);
    if (savedName) setUserName(savedName);

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentRole(data.user.role || 'ADMIN');
          setUserName(data.user.name || 'Owner Admin');
          localStorage.setItem('kannaya_user_role', data.user.role || 'ADMIN');
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleRole = () => {
    const newRole = currentRole === 'ADMIN' ? 'STAFF' : 'ADMIN';
    setCurrentRole(newRole);
    localStorage.setItem('kannaya_user_role', newRole);
    window.dispatchEvent(new Event('role_changed'));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('kannaya_user_role');
    localStorage.removeItem('kannaya_user_name');
    router.push('/login');
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) {
          setLowStockCount(data.metrics.lowStockCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-12 bg-[#4a4a4a] border-b border-[#6d8196]/40 px-5 flex items-center justify-between sticky top-0 z-20 shadow-sm text-white flex-shrink-0">
      {/* Search Input - Clean & Direct */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbcbcb]" />
          <input
            type="text"
            placeholder="Search product, barcode or customer phone..."
            className="w-full bg-[#383838] border border-[#6d8196]/40 rounded-[5px] pl-9 pr-4 py-1 text-xs text-white placeholder-[#cbcbcb] focus:outline-none focus:border-[#ffffe3] transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#ffffe3] bg-[#383838] px-2.5 py-1 rounded-[5px] border border-[#6d8196]/40">
          <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>{currentTime || 'Loading...'}</span>
        </div>

        {/* Low Stock Alert */}
        <Link
          href="/products?filter=low-stock"
          className="relative p-1.5 rounded-[5px] bg-[#383838] border border-[#6d8196]/40 text-[#cbcbcb] hover:text-[#ffffe3] transition-colors"
          title="Low Stock Products Alert"
        >
          <Bell className="w-3.5 h-3.5" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-[5px] bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
        </Link>

        {/* User Logout Button */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-[5px] bg-[#383838] border border-[#6d8196]/40 text-[#cbcbcb] hover:text-rose-400 transition-colors"
          title="Sign Out of Session"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
