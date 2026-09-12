'use client';

import React from 'react';
import { Store, Database, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-8 bg-white border-t border-[#cbcbcb] px-5 flex items-center justify-between text-[11px] text-[#4a4a4a] flex-shrink-0 z-10 select-none font-medium">
      <div className="flex items-center gap-2">
        <Store className="w-3.5 h-3.5 text-[#6d8196]" />
        <span className="font-bold">Venkata Lakshmi Electronics</span>
        <span className="text-slate-400 hidden sm:inline">• Powering Your Needs (Since 2023)</span>
      </div>

      <div className="hidden md:flex items-center gap-4 text-slate-500 text-[10.5px]">
        <span>GSTIN: 36ABCDE1234F1Z5</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3 text-[#6d8196]" /> +91 98765 43210
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[10px]">
        <Database className="w-3 h-3 text-emerald-600" />
        <span className="text-emerald-700 font-mono font-bold">PostgreSQL Active</span>
      </div>
    </footer>
  );
}
