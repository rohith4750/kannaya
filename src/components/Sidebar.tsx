'use client';

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Bot,
  BarChart3,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Receipt,
  Boxes,
  Wallet,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
  roles: string[];
}

interface NavGroup {
  id: string;
  title: string;
  icon: any;
  roles: string[];
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'core',
    title: 'Overview',
    icon: Store,
    roles: ['ADMIN', 'STAFF'],
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN'] },
      { name: 'Smart POS Billing', href: '/billing', icon: ShoppingCart, highlight: true, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Invoices',
    icon: Receipt,
    roles: ['ADMIN', 'STAFF'],
    items: [
      { name: 'Bills & Invoices', href: '/invoices', icon: FileText, roles: ['ADMIN', 'STAFF'] },
      { name: 'Customer Credit Accounts', href: '/customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
      { name: 'Expenses & Outflow', href: '/expenses', icon: Wallet, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    id: 'inventory',
    title: 'Stock & Inventory',
    icon: Boxes,
    roles: ['ADMIN', 'STAFF'],
    items: [
      { name: 'Inventory & Products', href: '/products', icon: Package, roles: ['ADMIN', 'STAFF'] },
      { name: 'Categories & Brands', href: '/categories', icon: FolderPlus, roles: ['ADMIN', 'STAFF'] },
      { name: 'Rack Locations', href: '/racks', icon: Layers, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    id: 'procurement',
    title: 'Suppliers & Procurement',
    icon: Truck,
    roles: ['ADMIN', 'STAFF'],
    items: [
      { name: 'Supplier Dues & Orders', href: '/suppliers', icon: Truck, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    id: 'system',
    title: 'System & Analytics',
    icon: ShieldCheck,
    roles: ['ADMIN', 'STAFF'],
    items: [
      { name: 'User Management', href: '/users', icon: ShieldCheck, roles: ['ADMIN'] },
      { name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare, roles: ['ADMIN', 'STAFF'] },
      { name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI', roles: ['ADMIN'] },
      { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['ADMIN'] },
      { name: 'System Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      const saved = localStorage.getItem('kannaya_user_role') as 'ADMIN' | 'STAFF';
      if (saved) setUserRole(saved);
    };
    checkRole();
    window.addEventListener('role_changed', checkRole);
    window.addEventListener('storage', checkRole);
    return () => {
      window.removeEventListener('role_changed', checkRole);
      window.removeEventListener('storage', checkRole);
    };
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 z-30 select-none shadow-xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#4a4a4a]`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3.5 flex items-center justify-between bg-[#383838] flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-md overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-xs text-white leading-tight truncate tracking-tight">
                Venkata Lakshmi
              </h1>
              <p className="text-[9px] text-[#ffffe3] font-medium truncate">
                Electronics & Hardware
              </p>
            </div>
          )}
        </div>

        {/* Collapse Sidebar Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#cbcbcb] hover:text-white p-1.5 rounded-[5px] hover:bg-white/10 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#ffffe3]" /> : <PanelLeftClose className="w-4 h-4 text-[#cbcbcb]" />}
        </button>
      </div>

      {/* POS Quick Access Banner */}
      <div className="px-2.5 pt-2.5 pb-2">
        <Link
          href="/billing"
          title="Quick POS Billing (F2)"
          className={`w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 px-3 rounded-[5px] flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } shadow-md transition-all group`}
        >
          <span className="flex items-center gap-2 text-xs">
            <ShoppingCart className="w-4 h-4 text-[#ffffe3] shrink-0" />
            {!isCollapsed && <span>Quick POS Bill</span>}
          </span>
          {!isCollapsed && (
            <span className="bg-[#ffffe3]/20 px-1.5 py-0.5 rounded-[5px] text-[10px] text-[#ffffe3] font-bold">
              F2
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Groups with Simple Static Sub-Headings */}
      <nav className="flex-1 px-2.5 py-2 space-y-3.5 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {/* Simple Non-Collapsible Section Heading */}
              {!isCollapsed ? (
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#cbcbcb] flex items-center justify-between border-b border-[#cbcbcb]/20 mb-1">
                  <span className="flex items-center gap-1.5 truncate text-[#ffffe3]/90">
                    <group.icon className="w-3.5 h-3.5 text-slate-300" />
                    <span>{group.title}</span>
                  </span>
                </div>
              ) : (
                <div className="h-px bg-white/10 my-1.5" />
              )}

              {/* Group Page Links Always Listed Below */}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center justify-between ${
                        isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'
                      } rounded-[5px] text-xs transition-all ${
                        isActive
                          ? 'bg-[#6d8196] text-white font-bold shadow-md'
                          : 'text-[#cbcbcb] font-medium hover:text-white hover:bg-[#6d8196]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ffffe3]' : 'text-[#cbcbcb]'}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[5px] uppercase ${
                            isActive ? 'bg-[#ffffe3] text-[#4a4a4a]' : 'bg-[#6d8196] text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Matching Sidebar Bottom Bar */}
      <div className="h-9 px-3.5 bg-[#383838] flex items-center justify-between text-[10px] text-[#cbcbcb] flex-shrink-0 font-medium">
        {!isCollapsed && <span className="truncate">Venkata Lakshmi ERP</span>}
        <span className="text-[#ffffe3] font-bold mx-auto md:mx-0">v2.0</span>
      </div>
    </aside>
  );
}
