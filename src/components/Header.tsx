'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Store, ShieldCheck, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');

  useEffect(() => {
    const savedRole = localStorage.getItem('kannaya_user_role') as 'ADMIN' | 'STAFF';
    if (savedRole) setCurrentRole(savedRole);
  }, []);

  const handleToggleRole = () => {
    const newRole = currentRole === 'ADMIN' ? 'STAFF' : 'ADMIN';
    setCurrentRole(newRole);
    localStorage.setItem('kannaya_user_role', newRole);
    window.dispatchEvent(new Event('role_changed'));
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
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Store Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 hidden md:block">
            SRI LAKSHMI ELECTRICALS & HARDWARE
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden lg:inline">| GSTIN: 36ABCDE1234F1Z5</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick lookup by product name, barcode or phone..."
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Toggle Badge */}
        <button
          onClick={handleToggleRole}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            currentRole === 'ADMIN'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-inner'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
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
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cashier STAFF 👤</span>
            </>
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentTime || 'Loading...'}</span>
        </div>

        {/* Low Stock Alert Bell */}
        <Link
          href="/products?filter=low-stock"
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
          title="Low Stock Products Alert"
        >
          <Bell className="w-4 h-4" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {lowStockCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
