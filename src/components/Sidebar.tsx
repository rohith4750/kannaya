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
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
          <Zap className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-1.5">
            Kannaya ERP
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Store className="w-3 h-3 text-amber-400" /> Electrical & Hardware
          </p>
        </div>
      </div>

      {/* POS Quick Access Banner */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/billing"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-amber-500/10 transition-all duration-200 group"
        >
          <span className="flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" /> Quick POS Bill
          </span>
          <span className="bg-slate-950/20 px-2 py-0.5 rounded text-xs text-slate-950 font-extrabold group-hover:translate-x-0.5 transition-transform">
            F2
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          Store Operations
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-gradient-to-r from-purple-500 to-indigo-500 text-white uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">PostgreSQL DB:</span>
          <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            kannaya
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">v2.0 • Offline Ready</div>
      </div>
    </aside>
  );
}
