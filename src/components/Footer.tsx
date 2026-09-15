'use client';

import React from 'react';
import { Store, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-9 bg-[#383838] px-5 flex items-center justify-between text-[11px] text-[#cbcbcb] flex-shrink-0 z-10 select-none font-medium">
      <div className="flex items-center gap-2">
        <Store className="w-3.5 h-3.5 text-[#ffffe3]" />
        <span className="font-bold text-white">Sri Venkata Lakshmi Electricals</span>
        <span className="text-[#ffffe3] text-[10.5px] hidden sm:inline">• Powering Your Needs (Since 2023)</span>
      </div>

      <div className="flex items-center gap-1.5 text-[#ffffe3] text-[10.5px]">
        <Phone className="w-3.5 h-3.5 text-[#ffffe3]" />
        <span>+91 98765 43210</span>
      </div>
    </footer>
  );
}
