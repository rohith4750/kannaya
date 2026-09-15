'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  Store,
  ArrowRight,
  UserCheck,
  KeyRound,
  X,
  CheckCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kannaya.com');
  const [password, setPassword] = useState('adminpassword123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');

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
        if (data.user?.id) localStorage.setItem('kannaya_user_id', data.user.id);
        localStorage.setItem('kannaya_user_role', data.user.role);
        localStorage.setItem('kannaya_user_name', data.user.name);
        if (data.user?.allowedModules && data.user.allowedModules.length > 0) {
          localStorage.setItem('kannaya_active_modules', JSON.stringify(data.user.allowedModules));
          window.dispatchEvent(new Event('modules_changed'));
        }
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErr('');
    setResetMsg('');
    setResetLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          newPassword,
          securityKey: resetKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetMsg(data.message);
        setEmail(resetEmail);
        setPassword(newPassword);
      } else {
        setResetErr(data.error || 'Failed to reset password');
      }
    } catch (e: any) {
      setResetErr('Error connecting to server');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none font-sans">
      {/* Split Card Container */}
      <div className="w-full max-w-4xl bg-white border border-[#cbcbcb] rounded-[5px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        {/* LEFT PANEL: Rich Green Background with Center Brand & Logo */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-8 sm:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Background Decorative Ambient Blur */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Center Brand Content & Logo */}
          <div className="relative z-10 my-auto py-6 flex flex-col items-center space-y-6">
            {/* Center Logo */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 opacity-60 blur group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-36 h-36 rounded-full bg-white p-2 border-4 border-emerald-100/30 shadow-2xl flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Sri Venkata Lakshmi Electricals Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            {/* Sri Venkata Lakshmi Electricals Title & Subtitle */}
            <div className="space-y-2 max-w-xs">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Sri Venkata Lakshmi Electricals
              </h1>
              <p className="text-xs text-emerald-200/90 font-medium tracking-wide">
                Complete Electrical Solutions
              </p>
            </div>
          </div>

          {/* Footer Branch Badge */}
          <div className="relative z-10 text-[11px] text-emerald-300/80 font-medium flex items-center gap-1.5 pt-4 border-t border-emerald-700/40 w-full justify-center">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sri Venkata Lakshmi Electricals</span>
          </div>
        </div>

        {/* RIGHT PANEL: Login Credentials Form */}
        <div className="w-full md:w-1/2 bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold text-[#4a4a4a] tracking-tight">Sign In to Account</h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter your internal credentials to access the store management system.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-[5px] text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Form Fields */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#4a4a4a] font-bold uppercase text-[10px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetKey('1234');
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-[#6d8196] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold py-3 rounded-[5px] text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-[#cbcbcb]/40 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Store ERP'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Sign-In Buttons */}
          <div className="pt-6 mt-6 border-t border-[#cbcbcb] space-y-2">
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

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#6d8196]" /> Reset Account Password
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-[#4a4a4a] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetErr && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-[5px] text-xs font-semibold">
                {resetErr}
              </div>
            )}

            {resetMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-[5px] text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{resetMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Email Address / Username</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@kannaya.com"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">
                  Store Reset Security Key (Default: 1234)
                </label>
                <input
                  type="text"
                  required
                  value={resetKey}
                  onChange={(e) => setResetKey(e.target.value)}
                  placeholder="1234"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196]"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px] text-xs shadow-sm transition-all disabled:opacity-50 mt-1"
              >
                {resetLoading ? 'Updating Password...' : 'Reset & Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
