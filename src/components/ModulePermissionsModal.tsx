'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Wallet,
  Package,
  FolderPlus,
  Layers,
  Truck,
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const ALL_MODULES = [
  { id: 'dashboard', name: 'Dashboard Overview', href: '/', icon: LayoutDashboard, category: 'Overview' },
  { id: 'billing', name: 'Smart POS Billing', href: '/billing', icon: ShoppingCart, category: 'Overview' },
  { id: 'invoices', name: 'Bills & Invoices', href: '/invoices', icon: FileText, category: 'Sales & Invoices' },
  { id: 'customers', name: 'Customer Credit Accounts', href: '/customers', icon: Users, category: 'Sales & Invoices' },
  { id: 'expenses', name: 'Expenses & Outflow', href: '/expenses', icon: Wallet, category: 'Sales & Invoices' },
  { id: 'products', name: 'Inventory & Products', href: '/products', icon: Package, category: 'Stock & Inventory' },
  { id: 'categories', name: 'Categories & Brands', href: '/categories', icon: FolderPlus, category: 'Stock & Inventory' },
  { id: 'racks', name: 'Rack Locations', href: '/racks', icon: Layers, category: 'Stock & Inventory' },
  { id: 'suppliers', name: 'Supplier Dues & Orders', href: '/suppliers', icon: Truck, category: 'Suppliers & Procurement' },
  { id: 'users', name: 'User Management', href: '/users', icon: ShieldCheck, category: 'System & Analytics' },
  { id: 'whatsapp', name: 'WhatsApp Center', href: '/whatsapp', icon: MessageSquare, category: 'System & Analytics' },
  { id: 'ai_assistant', name: 'Kannaya AI Assistant', href: '/ai-assistant', icon: Bot, category: 'System & Analytics' },
  { id: 'reports', name: 'Reports & Analytics', href: '/reports', icon: BarChart3, category: 'System & Analytics' },
  { id: 'settings', name: 'System Settings', href: '/settings', icon: Settings, category: 'System & Analytics' },
  { id: 'super_admin', name: 'Super Admin Control', href: '/super-admin', icon: ShieldAlert, category: 'System & Analytics' },
];

export const DEFAULT_ENABLED_MODULES = ALL_MODULES.map((m) => m.id);

export function getEnabledModules(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ENABLED_MODULES;
  try {
    const role = localStorage.getItem('kannaya_user_role');
    const saved = localStorage.getItem('kannaya_active_modules');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    if (role === 'SUPER_ADMIN') {
      return ['super_admin', 'users', 'settings'];
    }
  } catch (e) {
    console.error('Error reading enabled modules:', e);
  }
  return DEFAULT_ENABLED_MODULES;
}

export async function saveEnabledModules(modules: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kannaya_active_modules', JSON.stringify(modules));
  window.dispatchEvent(new Event('modules_changed'));
  window.dispatchEvent(new Event('storage'));

  try {
    const userId = localStorage.getItem('kannaya_user_id');
    if (userId) {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, allowedModules: modules }),
      });
    }
  } catch (e) {
    console.error('Error persisting allowedModules to DB:', e);
  }
}

interface ModulePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModulePermissionsModal({ isOpen, onClose }: ModulePermissionsModalProps) {
  const [enabled, setEnabled] = React.useState<string[]>(DEFAULT_ENABLED_MODULES);

  React.useEffect(() => {
    if (isOpen) {
      setEnabled(getEnabledModules());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    let updated: string[];
    if (enabled.includes(id)) {
      // Don't allow disabling everything - keep at least billing
      if (enabled.length <= 1) return;
      updated = enabled.filter((m) => m !== id);
    } else {
      updated = [...enabled, id];
    }
    setEnabled(updated);
    saveEnabledModules(updated);
  };

  const handleEnableAll = () => {
    const allIds = ALL_MODULES.map((m) => m.id);
    setEnabled(allIds);
    saveEnabledModules(allIds);
  };

  const handleCounterOnly = () => {
    const counterIds = ['billing', 'invoices', 'customers', 'products'];
    setEnabled(counterIds);
    saveEnabledModules(counterIds);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[5px] max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-[#cbcbcb] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6d8196] text-white rounded-[5px]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#4a4a4a]">Dynamic Module & Menu Access Controls</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Toggle module visibility on/off. Hidden pages are dynamically removed from frontend navigation in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-[5px] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-[5px] border border-[#cbcbcb] shrink-0 text-xs font-bold">
          <span className="text-slate-600 font-semibold">Quick Access Presets:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded-[5px] text-[11px] font-extrabold transition-all"
            >
              ✓ Enable All Modules ({ALL_MODULES.length})
            </button>
            <button
              type="button"
              onClick={handleCounterOnly}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3 py-1 rounded-[5px] text-[11px] font-extrabold transition-all"
            >
              🛒 Counter Billing Only (4 Pages)
            </button>
          </div>
        </div>

        {/* Modules Toggle List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ALL_MODULES.map((mod) => {
              const isChecked = enabled.includes(mod.id);
              const Icon = mod.icon;

              return (
                <div
                  key={mod.id}
                  onClick={() => handleToggle(mod.id)}
                  className={`p-3 rounded-[5px] border flex items-center justify-between cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-[#cbcbcb] text-slate-400 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`p-1.5 rounded ${
                        isChecked ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs leading-snug truncate">{mod.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{mod.category}</div>
                    </div>
                  </div>

                  {/* Toggle Switch UI */}
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                      isChecked ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center">
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#cbcbcb] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-bold">
            Active Modules: <span className="text-emerald-700 font-extrabold">{enabled.length} of {ALL_MODULES.length} Visible</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-5 py-2 rounded-[5px] text-xs font-bold transition-all shadow-sm"
          >
            Apply & Save Access Controls
          </button>
        </div>
      </div>
    </div>
  );
}
