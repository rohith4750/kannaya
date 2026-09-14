'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Menu,
  X,
  FolderPlus,
  Layers,
  Truck,
  Barcode,
  ShieldCheck,
  MessageSquare,
  Bot,
  BarChart3,
  Store,
  Settings,
} from 'lucide-react';

const mainTabs = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'POS Bill', href: '/billing', icon: ShoppingCart, highlight: true, roles: ['ADMIN', 'STAFF'] },
  { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['ADMIN', 'STAFF'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['ADMIN', 'STAFF'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
];

const secondaryLinks = [
  { name: 'Categories & Brands', href: '/categories', icon: FolderPlus, roles: ['ADMIN'] },
  { name: 'Rack Locations', href: '/racks', icon: Layers, roles: ['ADMIN', 'STAFF'] },
  { name: 'Supplier Dues', href: '/suppliers', icon: Truck, roles: ['ADMIN'] },
  // { name: 'Barcode Studio', href: '/barcode', icon: Barcode, roles: ['ADMIN', 'STAFF'] },
  { name: 'User Management', href: '/users', icon: ShieldCheck, roles: ['ADMIN'] },
  { name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare, roles: ['ADMIN', 'STAFF'] },
  { name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, badge: 'AI', roles: ['ADMIN'] },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'System Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');

  React.useEffect(() => {
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

  // Don't render on login page
  if (pathname === '/login') return null;

  const visibleMainTabs = mainTabs.filter((tab) => tab.roles.includes(userRole));
  const visibleSecondaryLinks = secondaryLinks.filter((link) => link.roles.includes(userRole));

  return (
    <>
      {/* App-like Sticky Bottom Navigation Bar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#383838] border-t border-[#4a4a4a] text-white py-1.5 px-2 flex justify-around items-center shadow-2xl select-none">
        {visibleMainTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={() => setShowMoreMenu(false)}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
                tab.highlight
                  ? 'bg-[#6d8196] text-white font-bold px-3 shadow-md'
                  : isActive
                  ? 'text-[#ffffe3] font-bold'
                  : 'text-[#cbcbcb] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#ffffe3]' : 'text-[#cbcbcb]'}`} />
              <span className="truncate">{tab.name}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
            showMoreMenu ? 'text-[#ffffe3] font-bold' : 'text-[#cbcbcb] hover:text-white'
          }`}
        >
          {showMoreMenu ? <X className="w-4 h-4 text-[#ffffe3] mb-0.5" /> : <Menu className="w-4 h-4 text-[#cbcbcb] mb-0.5" />}
          <span>More</span>
        </button>
      </div>

      {/* Mobile Drawer Menu Backdrop & Slide-up Modal */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#4a4a4a] border-t-2 border-[#6d8196] rounded-t-[10px] p-4 text-white space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#383838] pb-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#ffffe3]" />
                <span className="font-bold text-xs">Venkata Lakshmi Store Management</span>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="text-[#cbcbcb] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {visibleSecondaryLinks.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center justify-between p-2.5 rounded-[5px] transition-all border ${
                      isActive
                        ? 'bg-[#6d8196] text-white border-[#6d8196] font-bold shadow-md'
                        : 'bg-[#383838] text-[#cbcbcb] border-[#525252] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-4 h-4 text-[#ffffe3] shrink-0" />
                      <span className="truncate text-[11px]">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1 py-0.5 text-[8px] font-extrabold rounded bg-[#ffffe3] text-[#4a4a4a]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
