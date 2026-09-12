'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  FolderPlus,
  Layers,
  Users,
  Truck,
  Barcode,
  MessageSquare,
  Bot,
  BarChart3,
  Zap,
  Store,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Smart POS Billing', href: '/billing', icon: ShoppingCart, highlight: true },
  { name: 'Bills & Invoices', href: '/invoices', icon: FileText },
  { name: 'Inventory & Products', href: '/products', icon: Package },
  { name: 'Categories & Brands', href: '/categories', icon: FolderPlus },
  { name: 'Rack Locations', href: '/racks', icon: Layers },
  { name: 'Customer Udhar', href: '/customers', icon: Users },
  { name: 'Supplier Dues', href: '/suppliers', icon: Truck },
  { name: 'Barcode Studio', href: '/barcode', icon: Barcode },
  { name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare },
  { name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-[5px] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg text-white font-black">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white leading-tight flex items-center gap-1">
            Kannaya ERP
          </h1>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Store className="w-3 h-3 text-amber-400" /> Electrical & Hardware
          </p>
        </div>
      </div>

      {/* POS Quick Access Banner */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/billing"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-2.5 px-3.5 rounded-[5px] flex items-center justify-between shadow-md transition-all group"
        >
          <span className="flex items-center gap-2 text-xs">
            <ShoppingCart className="w-4 h-4" /> Quick POS Bill
          </span>
          <span className="bg-slate-950/20 px-1.5 py-0.5 rounded-[5px] text-[10px] text-slate-950 font-extrabold">
            F2
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Store Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-[5px] text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-black rounded-[5px] bg-indigo-600 text-white uppercase">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-[#090d16] text-xs text-slate-400">
        <div className="flex items-center justify-between text-[11px]">
          <span>Database:</span>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-[5px] bg-emerald-400 animate-pulse" />
            kannaya (PostgreSQL)
          </span>
        </div>
      </div>
    </aside>
  );
}
