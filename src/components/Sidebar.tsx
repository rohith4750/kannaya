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

import ModulePermissionsModal, { getEnabledModules } from '@/components/ModulePermissionsModal';
import { SlidersHorizontal } from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon: any;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'core',
    title: 'Overview',
    icon: Store,
    items: [
      { id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { id: 'billing', name: 'Smart POS Billing', href: '/billing', icon: ShoppingCart, highlight: true },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Invoices',
    icon: Receipt,
    items: [
      { id: 'invoices', name: 'Bills & Invoices', href: '/invoices', icon: FileText },
      { id: 'customers', name: 'Customer Credit Accounts', href: '/customers', icon: Users },
      { id: 'expenses', name: 'Expenses & Outflow', href: '/expenses', icon: Wallet },
    ],
  },
  {
    id: 'inventory',
    title: 'Stock & Inventory',
    icon: Boxes,
    items: [
      { id: 'products', name: 'Inventory & Products', href: '/products', icon: Package },
      { id: 'categories', name: 'Categories & Brands', href: '/categories', icon: FolderPlus },
      { id: 'racks', name: 'Rack Locations', href: '/racks', icon: Layers },
    ],
  },
  {
    id: 'procurement',
    title: 'Suppliers & Procurement',
    icon: Truck,
    items: [
      { id: 'suppliers', name: 'Supplier Dues & Orders', href: '/suppliers', icon: Truck },
    ],
  },
  {
    id: 'system',
    title: 'System & Analytics',
    icon: ShieldCheck,
    items: [
      { id: 'users', name: 'User Management', href: '/users', icon: ShieldCheck },
      { id: 'whatsapp', name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare },
      { id: 'ai_assistant', name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI' },
      { id: 'reports', name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      { id: 'settings', name: 'System Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    const updateModules = () => {
      setEnabledModules(getEnabledModules());
    };
    updateModules();
    window.addEventListener('modules_changed', updateModules);
    window.addEventListener('storage', updateModules);
    return () => {
      window.removeEventListener('modules_changed', updateModules);
      window.removeEventListener('storage', updateModules);
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
            <img src="/logo.png" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-xs text-white leading-tight truncate tracking-tight">
                Sri Venkata Lakshmi
              </h1>
              <p className="text-[9px] text-[#ffffe3] font-medium truncate">
                Electricals Store
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

      {/* Navigation Groups with Dynamic Module Permission Filtering */}
      <nav className="flex-1 px-2.5 py-2 space-y-3.5 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            enabledModules.length === 0 ? true : enabledModules.includes(item.id)
          );
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

      {/* Dynamic Module Permission Controls Footer */}
      <div className="p-2 border-t border-[#383838] bg-[#383838] flex flex-col gap-1.5">
        <button
          onClick={() => setShowPermissionsModal(true)}
          className={`w-full bg-[#4a4a4a] hover:bg-[#585858] text-[#ffffe3] text-[11px] font-bold py-1.5 px-2.5 rounded-[5px] flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } border border-slate-600 transition-all shadow-xs`}
          title="Configure Dynamic Frontend Menu Permissions"
        >
          <span className="flex items-center gap-1.5 truncate">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Module Access</span>}
          </span>
          {!isCollapsed && (
            <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
              Config
            </span>
          )}
        </button>

        <div className="h-6 px-1 flex items-center justify-between text-[10px] text-[#cbcbcb] font-medium">
          {!isCollapsed && <span className="truncate">Venkata Lakshmi ERP</span>}
          <span className="text-[#ffffe3] font-bold mx-auto md:mx-0">v2.0</span>
        </div>
      </div>

      {/* Dynamic Permissions Control Modal */}
      <ModulePermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
      />
    </aside>
  );
}
