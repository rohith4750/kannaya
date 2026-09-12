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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700/80 rounded-[5px] p-8 shadow-2xl space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-[5px] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg mx-auto text-white font-black">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Kannaya ERP Login</h1>
          <p className="text-xs text-slate-400">
            Electrical & Hardware Store Operating System
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-3 rounded-[5px] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold uppercase text-[10px] block mb-1">
              Email Address / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kannaya.com"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-[5px] pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold uppercase text-[10px] block mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-[5px] pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-[5px] text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Store ERP'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Material UI Quick Demo Logins */}
        <div className="pt-4 border-t border-slate-700/80 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Material Demo Sign-In
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogin(undefined, 'admin@kannaya.com', 'adminpassword123')}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 py-2 px-3 rounded-[5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" /> Admin (Owner)
            </button>
            <button
              onClick={() => handleLogin(undefined, 'staff@kannaya.com', 'staffpassword123')}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 py-2 px-3 rounded-[5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" /> Staff (Cashier)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
