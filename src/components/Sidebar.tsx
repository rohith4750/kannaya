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
  ShieldCheck,
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
  { name: 'Customer Credit Accounts', href: '/customers', icon: Users },
  { name: 'Supplier Dues', href: '/suppliers', icon: Truck },
  { name: 'Barcode Studio', href: '/barcode', icon: Barcode },
  { name: 'User Management', href: '/users', icon: ShieldCheck },
  { name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare },
  { name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#4a4a4a] flex flex-col h-screen sticky top-0 z-30 select-none shadow-xl">
      {/* Brand Header */}
      <div className="h-14 px-3.5 flex items-center gap-3 bg-[#383838] flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
          <img src="/logo.jpg" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-white leading-tight truncate tracking-tight">
            Venkata Lakshmi
          </h1>
          <p className="text-[10px] text-[#ffffe3] font-medium truncate">
            Electronics & Hardware
          </p>
        </div>
      </div>

      {/* POS Quick Access Banner */}
      <div className="px-3 pt-3 pb-2">
        <Link
          href="/billing"
          className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 px-3.5 rounded-[5px] flex items-center justify-between shadow-md transition-all group"
        >
          <span className="flex items-center gap-2 text-xs">
            <ShoppingCart className="w-4 h-4 text-[#ffffe3]" /> Quick POS Bill
          </span>
          <span className="bg-[#ffffe3]/20 px-1.5 py-0.5 rounded-[5px] text-[10px] text-[#ffffe3] font-bold">
            F2
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#cbcbcb] px-3 py-1">
          Store Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-[5px] text-xs transition-all ${
                isActive
                  ? 'bg-[#6d8196] text-white font-semibold shadow-md'
                  : 'text-[#cbcbcb] font-medium hover:text-white hover:bg-[#6d8196]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffffe3]' : 'text-[#cbcbcb]'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[5px] uppercase ${
                  isActive ? 'bg-[#ffffe3] text-[#4a4a4a]' : 'bg-[#6d8196] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Matching Sidebar Bottom Bar */}
      <div className="h-9 px-3.5 bg-[#383838] flex items-center justify-between text-[10px] text-[#cbcbcb] flex-shrink-0 font-medium">
        <span className="truncate">Venkata Lakshmi ERP</span>
        <span className="text-[#ffffe3] font-bold">v2.0</span>
      </div>
    </aside>
  );
}
