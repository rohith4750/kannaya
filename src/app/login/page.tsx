'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Lock, Mail, Store, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kannaya.com');
  const [password, setPassword] = useState('adminpassword123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('kannaya_user_role', data.user.role);
        localStorage.setItem('kannaya_user_name', data.user.name);
        window.dispatchEvent(new Event('role_changed'));
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#cbcbcb] rounded-[5px] p-8 shadow-xl space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-[5px] bg-[#6d8196] flex items-center justify-center shadow-md mx-auto text-white font-black border border-[#cbcbcb]">
            <Zap className="w-7 h-7 fill-current text-[#ffffe3]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#4a4a4a] tracking-tight">Kannaya ERP Login</h1>
          <p className="text-xs text-slate-500">
            Electrical & Hardware Store Operating System
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-[5px] text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
          <div>
            <label className="text-[#4a4a4a] font-bold uppercase text-[10px] block mb-1">
              Email Address / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6d8196]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kannaya.com"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[#4a4a4a] font-bold uppercase text-[10px] block mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6d8196]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold py-3 rounded-[5px] text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-[#cbcbcb]/40"
          >
            {loading ? 'Authenticating...' : 'Sign In to Store ERP'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Logins */}
        <div className="pt-4 border-t border-[#cbcbcb] space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Quick ERP Demo Sign-In
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogin(undefined, 'admin@kannaya.com', 'adminpassword123')}
              className="bg-[#ffffe3] hover:bg-[#ffffcc] border border-[#cbcbcb] text-[#4a4a4a] py-2 px-3 rounded-[5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#f59e0b]" /> Admin (Owner)
            </button>
            <button
              onClick={() => handleLogin(undefined, 'staff@kannaya.com', 'staffpassword123')}
              className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-[#4a4a4a] py-2 px-3 rounded-[5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#6d8196]" /> Staff (Cashier)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
