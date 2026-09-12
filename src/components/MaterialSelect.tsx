'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MaterialSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function MaterialSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = '',
}: MaterialSelectProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className="text-slate-700 font-bold uppercase text-[10px] block mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-3 pr-8 py-1.5 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white focus:ring-1 focus:ring-[#6d8196] transition-all cursor-pointer font-medium"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-900 py-1">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}
