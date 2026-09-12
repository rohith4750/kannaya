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
        <label className="text-slate-300 font-semibold uppercase text-[10px] block mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#0f172a] border border-slate-700 rounded-[5px] pl-3 pr-9 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1e293b] text-white py-1">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
