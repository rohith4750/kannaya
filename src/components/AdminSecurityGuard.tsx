'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Key, ArrowLeft, CheckCircle2, AlertCircle, Unlock, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface AdminSecurityGuardProps {
  children: React.ReactNode;
  moduleName: string;
  moduleDescription: string;
}

export default function AdminSecurityGuard({
  children,
  moduleName,
  moduleDescription,
}: AdminSecurityGuardProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkUnlockedState = () => {
    try {
      const isSessionUnlocked = sessionStorage.getItem('kannaya_admin_pin_unlocked') === 'true';
      setIsUnlocked(isSessionUnlocked);
    } catch (e) {
      setIsUnlocked(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkUnlockedState();
    window.addEventListener('security_state_changed', checkUnlockedState);
    return () => window.removeEventListener('security_state_changed', checkUnlockedState);
  }, []);

  const handleUnlockWithPin = async (e?: React.FormEvent, directPin?: string) => {
    if (e) e.preventDefault();
    setPinError('');
    const targetPin = directPin !== undefined ? directPin : pinInput;

    if (!targetPin || targetPin.trim().length === 0) {
      setPinError('Please enter your 4-Digit Admin Security PIN Code');
      return;
    }

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: targetPin.trim() }),
      });
      const data = await res.json();

      const isAdminOrSuperAdmin = data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN';

      if (res.ok && data.success && isAdminOrSuperAdmin) {
        sessionStorage.setItem('kannaya_admin_pin_unlocked', 'true');
        setIsUnlocked(true);
        setPinInput('');
        window.dispatchEvent(new Event('security_state_changed'));
      } else if (res.ok && data.success && !isAdminOrSuperAdmin) {
        setPinError('Access Denied: This Security PIN belongs to Staff. Admin or Super Admin PIN required.');
      } else {
        setPinError(data.error || 'Invalid Admin Security PIN Code! Access Denied.');
      }
    } catch (err: any) {
      setPinError('Connection error verifying Security PIN.');
    }
  };

  const handleKeypadPress = (digit: string) => {
    setPinError('');
    if (digit === 'CLEAR') {
      setPinInput('');
    } else if (digit === 'BACKSPACE') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      if (pinInput.length < 6) {
        const next = pinInput + digit;
        setPinInput(next);
        if (next.length === 4) {
          handleUnlockWithPin(undefined, next);
        }
      }
    }
  };

  const handleLockSecurity = () => {
    sessionStorage.removeItem('kannaya_admin_pin_unlocked');
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    window.dispatchEvent(new Event('security_state_changed'));
  };

  if (checking) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-medium">
        Verifying Security Credentials...
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="space-y-3">
        {/* Unlocked Top Security Toolbar Banner */}
        <div className="bg-[#ffffe3] border border-[#cbcbcb] rounded-[5px] px-4 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-[#4a4a4a] flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              {moduleName} Security Session Unlocked
            </span>
            <span className="text-slate-500 text-[11px] font-mono hidden md:inline">
              (Security Verified • Session Active)
            </span>
          </div>

          <button
            onClick={handleLockSecurity}
            className="bg-white hover:bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-[5px] text-[11px] flex items-center gap-1.5 border border-[#cbcbcb] transition-all shadow-xs"
            title="Lock this security session immediately"
          >
            <Lock className="w-3 h-3" /> Lock Security
          </button>
        </div>

        {children}
      </div>
    );
  }

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-6 space-y-5 shadow-xl text-center">
        {/* Security Lock Header */}
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            🔒 Restricted Security Zone
          </span>
          <h2 className="text-base font-bold text-[#4a4a4a] mt-2">
            {moduleName} Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {moduleDescription} Access is restricted. Please enter the 4-Digit Security PIN code to proceed.
          </p>
        </div>

        {/* PIN Code Unlock Form */}
        <form onSubmit={handleUnlockWithPin} className="space-y-4 bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] text-left">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold uppercase text-[#4a4a4a] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#6d8196]" /> Enter Security PIN
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit PIN..."
              className="flex-1 bg-white border border-[#cbcbcb] rounded-[5px] px-3.5 py-2 text-sm tracking-widest font-black text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-5 py-2 rounded-[5px] text-xs transition-all shadow-sm border border-[#cbcbcb]/40 shrink-0"
            >
              Unlock Access
            </button>
          </div>

          {/* Quick On-Screen Keypad for POS Touchscreen */}
          <div className="pt-2 border-t border-[#cbcbcb]/60">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="bg-white hover:bg-slate-100 text-[#4a4a4a] font-bold py-2 rounded-[5px] border border-[#cbcbcb] text-xs shadow-xs transition-colors active:bg-slate-200"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('CLEAR')}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-[5px] text-[11px] border border-[#cbcbcb]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="bg-white hover:bg-slate-100 text-[#4a4a4a] font-bold py-2 rounded-[5px] border border-[#cbcbcb] text-xs shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-[5px] text-[11px] border border-[#cbcbcb]"
              >
                ⌫
              </button>
            </div>
          </div>

          {pinError && (
            <div className="flex items-center gap-1.5 text-rose-700 text-[11px] font-bold mt-1 bg-rose-50 p-2 rounded-[5px] border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {pinError}
            </div>
          )}
        </form>

        {/* Navigation Actions */}
        <div className="pt-2 border-t border-[#cbcbcb] flex items-center justify-between text-xs">
          <Link
            href="/billing"
            className="text-slate-600 hover:text-[#6d8196] font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to POS Billing
          </Link>

          <Link
            href="/"
            className="text-slate-600 hover:text-[#6d8196] font-semibold"
          >
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
