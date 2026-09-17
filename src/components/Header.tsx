'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Shield, UserCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<string>('ADMIN');
  const [userName, setUserName] = useState<string>('Store Administrator');

  const loadUserData = () => {
    const savedRole = localStorage.getItem('kannaya_user_role') || 'ADMIN';
    const savedName = localStorage.getItem('kannaya_user_name');
    if (savedRole) setCurrentRole(savedRole);
    if (savedName) setUserName(savedName);

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const role = data.user.role || 'ADMIN';
          const name = data.user.name || (role === 'SUPER_ADMIN' ? 'Super Administrator' : role === 'ADMIN' ? 'Store Administrator' : 'Counter Staff');
          setCurrentRole(role);
          setUserName(name);
          if (data.user.id) localStorage.setItem('kannaya_user_id', data.user.id);
          localStorage.setItem('kannaya_user_role', role);
          localStorage.setItem('kannaya_user_name', name);
          if (data.user.allowedModules && Array.isArray(data.user.allowedModules) && data.user.allowedModules.length > 0) {
            localStorage.setItem('kannaya_active_modules', JSON.stringify(data.user.allowedModules));
            window.dispatchEvent(new Event('modules_changed'));
          }
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener('role_changed', loadUserData);
    window.addEventListener('storage', loadUserData);
    return () => {
      window.removeEventListener('role_changed', loadUserData);
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('kannaya_user_role');
    localStorage.removeItem('kannaya_user_name');
    localStorage.removeItem('kannaya_user_id');
    localStorage.removeItem('kannaya_active_modules');
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
      .catch(() => { });
  }, []);

  return (
    <header className="h-14 bg-[#383838] px-3.5 sm:px-5 flex items-center justify-between sticky top-0 z-20 shadow-sm text-white flex-shrink-0 gap-2 select-none">
      {/* Mobile Brand Logo Header */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-[#cbcbcb] overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
        </div>
        <span className="font-bold text-xs text-white truncate max-w-[110px] sm:max-w-none">Sri Venkata Lakshmi</span>
      </div>

      {/* Empty Spacer */}
      <div className="flex-1"></div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Authenticated User & Role Indicator Badge */}
        <div className="flex items-center gap-2 bg-[#4a4a4a] px-2.5 py-1.5 rounded-[5px] border border-slate-600/60 shadow-2xs">
          <div className="flex flex-col text-right leading-none">
            <span className="text-[11px] font-bold text-white max-w-[130px] truncate">{userName}</span>
            <span className="text-[9px] text-[#ffffe3] font-mono tracking-tight mt-0.5">
              {currentRole === 'SUPER_ADMIN'
                ? 'Super Admin'
                : currentRole === 'ADMIN'
                ? 'Administrator'
                : currentRole === 'BILLING_STAFF'
                ? 'Billing Desk'
                : currentRole === 'INVENTORY_STAFF'
                ? 'Inventory Desk'
                : 'Cashier Staff'}
            </span>
          </div>

          <div
            className={`px-2 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
              currentRole === 'SUPER_ADMIN'
                ? 'bg-purple-950 text-purple-200 border border-purple-400'
                : currentRole === 'ADMIN'
                ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-500/50'
                : 'bg-blue-900/60 text-blue-200 border border-blue-500/50'
            }`}
          >
            {currentRole === 'SUPER_ADMIN' ? (
              <>
                <Shield className="w-3 h-3 text-purple-300" />
                <span>SUPER ADMIN</span>
              </>
            ) : currentRole === 'ADMIN' ? (
              <>
                <Shield className="w-3 h-3 text-indigo-300" />
                <span>ADMIN</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3 h-3 text-blue-300" />
                <span>{currentRole}</span>
              </>
            )}
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-[#ffffe3] bg-[#4a4a4a] px-2.5 py-1.5 rounded-[5px] border border-slate-600/60">
          <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>{currentTime || 'Loading...'}</span>
        </div>

        {/* Low Stock Alert */}
        <Link
          href="/products?filter=low-stock"
          className="relative p-2 rounded-[5px] bg-[#4a4a4a] text-[#cbcbcb] hover:text-[#ffffe3] transition-colors border border-slate-600/60"
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
          className="p-2 rounded-[5px] bg-[#4a4a4a] text-[#cbcbcb] hover:text-rose-400 transition-colors border border-slate-600/60"
          title="Sign Out of Session"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

