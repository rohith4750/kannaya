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
  ShieldAlert,
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
      { id: 'super_admin', name: 'Super Admin Control', href: '/super-admin', icon: ShieldAlert, badge: 'SUPER' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      try {
        const [meRes, permRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/super-admin/permissions'),
        ]);
        const meData = await meRes.json();
        const permData = await permRes.json();

        let role = localStorage.getItem('kannaya_user_role') || 'STAFF';
        if (meData.authenticated && meData.user) {
          role = meData.user.role || role;
          setUserRole(role);
          if (localStorage.getItem('kannaya_user_role') !== role) {
            localStorage.setItem('kannaya_user_role', role);
          }
          if (meData.user.name && localStorage.getItem('kannaya_user_name') !== meData.user.name) {
            localStorage.setItem('kannaya_user_name', meData.user.name);
          }
        }

        let modulesForRole: string[] = [];
        if (permData && permData[role] && Array.isArray(permData[role])) {
          modulesForRole = permData[role];
        } else if (meData.user?.allowedModules && Array.isArray(meData.user.allowedModules) && meData.user.allowedModules.length > 0) {
          modulesForRole = meData.user.allowedModules;
        } else {
          modulesForRole = getEnabledModules();
        }

        setEnabledModules(modulesForRole);
        const newModStr = JSON.stringify(modulesForRole);
        if (localStorage.getItem('kannaya_active_modules') !== newModStr) {
          localStorage.setItem('kannaya_active_modules', newModStr);
        }
      } catch (err) {
        console.error('Failed to load permissions in Sidebar:', err);
        setEnabledModules(getEnabledModules());
      }
    };

    fetchRoleAndPermissions();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kannaya_user_role' || e.key === 'kannaya_active_modules') {
        fetchRoleAndPermissions();
      }
    };

    window.addEventListener('modules_changed', fetchRoleAndPermissions);
    window.addEventListener('role_changed', fetchRoleAndPermissions);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('modules_changed', fetchRoleAndPermissions);
      window.removeEventListener('role_changed', fetchRoleAndPermissions);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 z-30 select-none shadow-xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#4a4a4a]`}
    >
      {/* Brand Header */}
      <div className={`h-16 ${isCollapsed ? 'px-2 py-2 flex-col justify-center' : 'px-3.5 justify-between'} flex items-center bg-[#383838] flex-shrink-0 border-b border-[#4a4a4a]`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center gap-1.5 w-full">
            {/* Store Logo (Separate Clean Circle) */}
            <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>

            {/* Separate Toggle Button with Distinct Hover Background */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-[#cbcbcb] hover:text-white bg-[#4a4a4a] hover:bg-[#585858] p-1.5 rounded-[5px] border border-slate-600/60 transition-all shadow-sm cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-[#ffffe3]" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img src="/logo.png" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xs text-white leading-tight truncate tracking-tight">
                  Sri Venkata Lakshmi
                </h1>
                <p className="text-[9px] text-[#ffffe3] font-medium truncate">
                  Electricals Store
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="text-[#cbcbcb] hover:text-white bg-[#4a4a4a] hover:bg-[#585858] p-1.5 rounded-[5px] border border-slate-600/60 transition-all shadow-sm cursor-pointer shrink-0"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-[#cbcbcb]" />
            </button>
          </>
        )}
      </div>

      {/* POS Quick Access Banner */}
      {enabledModules.includes('billing') && (
        <div className="px-2.5 pt-2.5 pb-2">
          <Link
            href="/billing"
            title="Quick POS Billing (F2)"
            className={`w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 ${
              isCollapsed ? 'px-0 justify-center' : 'px-3 justify-between'
            } rounded-[6px] flex items-center shadow-md transition-all group`}
          >
            <span className="flex items-center justify-center gap-2 text-xs">
              <ShoppingCart className="w-4 h-4 text-[#ffffe3] shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Quick POS Bill</span>}
            </span>
            {!isCollapsed && (
              <span className="bg-[#ffffe3]/20 px-1.5 py-0.5 rounded-[5px] text-[10px] text-[#ffffe3] font-bold">
                F2
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Navigation Groups with Dynamic Module Permission Filtering */}
      <nav className="flex-1 px-2.5 py-2 space-y-3 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => enabledModules.includes(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {/* Section Heading (Visible only when expanded) */}
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#cbcbcb] flex items-center justify-between border-b border-[#cbcbcb]/20 mb-1">
                  <span className="flex items-center gap-1.5 truncate text-[#ffffe3]/90">
                    <group.icon className="w-3.5 h-3.5 text-slate-300" />
                    <span>{group.title}</span>
                  </span>
                </div>
              )}

              {/* Group Page Links */}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center group ${
                        isCollapsed ? 'justify-center px-0 py-2.5 my-0.5' : 'justify-between px-3 py-2'
                      } rounded-[6px] text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-[#2b2b2b] text-white font-extrabold border-l-4 border-[#ffffe3] shadow-md'
                          : 'text-[#cbcbcb] font-medium hover:text-white hover:bg-[#383838] hover:shadow-xs'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 truncate'}`}>
                        <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-[#ffffe3]' : 'text-[#cbcbcb] group-hover:text-white group-hover:scale-110'}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[5px] uppercase ${
                            isActive ? 'bg-[#ffffe3]/20 text-[#ffffe3]' : 'bg-[#383838] text-white'
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

      {/* Dynamic Module Permission Controls Footer (Super Admin Only) */}
      <div className="p-2 border-t border-[#383838] bg-[#383838] flex flex-col gap-1.5">
        {userRole === 'SUPER_ADMIN' && (
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
        )}

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
