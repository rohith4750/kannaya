'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Store, Shield, UserCheck, LogOut, User } from 'lucide-react';
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

    // Fetch auth status from API
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
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
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
    <header className="h-14 bg-[#0f172a] border-b border-slate-700/80 px-5 flex items-center justify-between sticky top-0 z-20 shadow-sm text-white">
      {/* Store Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-extrabold text-white tracking-wide hidden md:block">
            SRI LAKSHMI ELECTRICALS & HARDWARE
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 hidden lg:inline">| GSTIN: 36ABCDE1234F1Z5</span>
      </div>

      {/* Search Input */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product, barcode or phone..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-[5px] pl-9 pr-4 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Role Switcher Toggle */}
        <button
          onClick={handleToggleRole}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-bold border transition-all ${
            currentRole === 'ADMIN'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
          }`}
          title="Click to toggle between Owner Admin mode and Cashier Staff mode"
        >
          {currentRole === 'ADMIN' ? (
            <>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner ADMIN 👑</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Cashier STAFF 👤</span>
            </>
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-[5px] border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentTime || 'Loading...'}</span>
        </div>

        {/* Low Stock Alert */}
        <Link
          href="/products?filter=low-stock"
          className="relative p-1.5 rounded-[5px] bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
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
          className="p-1.5 rounded-[5px] bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
          title="Sign Out of Session"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
