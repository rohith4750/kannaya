'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Activity,
  Database,
  Lock,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Server,
  Cpu,
  HardDrive,
  MessageSquare,
  Users,
  Settings,
  Store,
  Layers,
  Save,
  Check,
  Zap,
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface HealthData {
  status: string;
  timestamp: string;
  db: { status: string; latencyMs: number };
  counts: {
    customers: number;
    products: number;
    variants: number;
    invoices: number;
    suppliers: number;
    purchaseOrders: number;
    users: number;
  };
  ultraMsg: { status: string; details: any };
  shopSettings?: any;
  systemInfo: {
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    arch: string;
    totalMemMB: number;
    freeMemMB: number;
    rssMemoryMB: number;
    heapTotalMB: number;
    heapUsedMB: number;
  };
}

const ALL_ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'ADMIN', label: 'Owner / Admin', color: 'bg-[#ffffe3] text-[#4a4a4a] border-[#cbcbcb]' },
  { id: 'STAFF', label: 'General Staff', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { id: 'BILLING_STAFF', label: 'Billing Staff', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'INVENTORY_STAFF', label: 'Inventory Staff', color: 'bg-blue-100 text-blue-800 border-blue-300' },
];

const ALL_MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'billing', name: 'Smart POS Billing' },
  { id: 'invoices', name: 'Bills & Invoices' },
  { id: 'customers', name: 'Customer Credit Accounts' },
  { id: 'expenses', name: 'Expenses & Outflow' },
  { id: 'products', name: 'Inventory & Products' },
  { id: 'categories', name: 'Categories & Brands' },
  { id: 'racks', name: 'Rack Locations' },
  { id: 'suppliers', name: 'Supplier Dues & Orders' },
  { id: 'users', name: 'User Management' },
  { id: 'whatsapp', name: 'WhatsApp Center' },
  { id: 'ai_assistant', name: 'Kannaya AI Assistant' },
  { id: 'reports', name: 'Reports & Analytics' },
  { id: 'settings', name: 'System Settings' },
  { id: 'super_admin', name: 'Super Admin Control' },
];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'permissions' | 'database' | 'config'>('health');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // RBAC Permissions State
  const [rolePermissions, setRolePermissions] = useState<{ [role: string]: string[] }>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Database Action State
  const [processingAction, setProcessingAction] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');

  // Confirmation Modal
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadHealthData = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/super-admin/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadPermissionsData = async () => {
    setLoadingPermissions(true);
    try {
      const res = await fetch('/api/super-admin/permissions');
      const data = await res.json();
      setRolePermissions(data);
    } catch (err) {
      console.error('Failed to load permissions', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    loadPermissionsData();
  }, []);

  const handleTogglePermission = (role: string, moduleId: string) => {
    const currentList = rolePermissions[role] || [];
    const exists = currentList.includes(moduleId);
    const updated = exists ? currentList.filter((m) => m !== moduleId) : [...currentList, moduleId];
    setRolePermissions((prev) => ({ ...prev, [role]: updated }));
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const res = await fetch('/api/super-admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions }),
      });
      const data = await res.json();
      if (res.ok) {
        const userRole = localStorage.getItem('kannaya_user_role') || 'SUPER_ADMIN';
        if (rolePermissions[userRole]) {
          localStorage.setItem('kannaya_active_modules', JSON.stringify(rolePermissions[userRole]));
        }
        alert('✅ Role Permissions Matrix saved successfully!');
        window.dispatchEvent(new Event('modules_changed'));
        window.dispatchEvent(new Event('storage'));
      } else {
        alert(`❌ Failed to save permissions: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error saving permissions: ${err.message}`);
    } finally {
      setSavingPermissions(false);
    }
  };

  // Database Actions: Backup, Flush, Restore
  const handleExportBackup = async () => {
    setProcessingAction(true);
    try {
      const res = await fetch('/api/super-admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });
      const data = await res.json();
      if (res.ok) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kannaya_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(`❌ Backup failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error exporting database: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDatabaseFlush = (actionType: 'flush_sales' | 'flush_inventory' | 'flush_purchases' | 'flush_all', label: string) => {
    setConfirmModalState({
      isOpen: true,
      title: `🚨 WARNING: ${label}`,
      message: `Are you sure you want to execute "${label}"? This operation will permanently delete selected data from the production database. Ensure you have downloaded a JSON backup snapshot before proceeding.`,
      confirmText: `Yes, Execute ${label}`,
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        setProcessingAction(true);
        try {
          const res = await fetch('/api/super-admin/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionType }),
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.message || '✅ Flush completed successfully.');
            loadHealthData();
          } else {
            alert(`❌ Flush failed: ${data.error}`);
          }
        } catch (err: any) {
          alert(`❌ Error executing flush: ${err.message}`);
        } finally {
          setProcessingAction(false);
        }
      },
    });
  };

  const handleRestoreDatabase = async () => {
    if (!restoreJson.trim()) {
      alert('Please paste valid JSON snapshot data to restore.');
      return;
    }

    try {
      const parsed = JSON.parse(restoreJson);
      setProcessingAction(true);
      const res = await fetch('/api/super-admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', restoreData: parsed }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || '✅ Database restored successfully.');
        setRestoreJson('');
        loadHealthData();
      } else {
        alert(`❌ Restore failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ Invalid JSON or Restore Error: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const formatUptime = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Banner */}
      <div className="bg-[#383838] text-white p-5 rounded-[5px] shadow-md border border-[#cbcbcb] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#ffffe3]" />
            <h1 className="text-xl font-black tracking-tight">Super Admin Control Center</h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-600 text-white uppercase border border-purple-400 shadow-sm">
              Role: SUPER_ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            System Health Monitoring, RBAC Permissions Matrix, Database Snapshot Backups & Production Flush Controls.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadHealthData}
            disabled={loadingHealth}
            className="bg-[#4a4a4a] hover:bg-slate-700 text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 border border-[#cbcbcb] shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-[#ffffe3]' : ''}`} />
            Refresh Diagnostics
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION BAR */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center border-b border-[#cbcbcb] bg-slate-50 text-xs font-bold p-1">
          <button
            onClick={() => setActiveTab('health')}
            className={`py-2.5 px-4 flex items-center gap-2 border-r border-[#cbcbcb] transition-colors rounded-t-[4px] ${
              activeTab === 'health'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <Activity className="w-4 h-4 text-[#6d8196]" /> System Health & Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2.5 px-4 flex items-center gap-2 border-r border-[#cbcbcb] transition-colors rounded-t-[4px] ${
              activeTab === 'permissions'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-600" /> RBAC Permissions Matrix
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-2.5 px-4 flex items-center gap-2 border-r border-[#cbcbcb] transition-colors rounded-t-[4px] ${
              activeTab === 'database'
                ? 'bg-white text-red-700 border-b-2 border-b-red-600 font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <Database className="w-4 h-4 text-red-600" /> Database Control & Data Purge
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-2.5 px-4 flex items-center gap-2 transition-colors rounded-t-[4px] ${
              activeTab === 'config'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-600" /> System Settings
          </button>
        </div>

        {/* TAB 1: SYSTEM HEALTH & DIAGNOSTICS */}
        {activeTab === 'health' && (
          <div className="p-5 space-y-5 text-xs">
            {loadingHealth ? (
              <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#6d8196]" /> Running system diagnostic checkups...
              </div>
            ) : health ? (
              <>
                {/* Health Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* DB Connection */}
                  <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-extrabold">
                      <span>PostgreSQL Database</span>
                      <Server className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {health.db.status}
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono font-semibold">
                      Query Latency: <span className="text-emerald-700">{health.db.latencyMs} ms</span>
                    </p>
                  </div>

                  {/* Server Uptime */}
                  <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-extrabold">
                      <span>Node.js Server Uptime</span>
                      <Cpu className="w-4 h-4 text-[#6d8196]" />
                    </div>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {formatUptime(health.systemInfo.uptimeSeconds)}
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Node: {health.systemInfo.nodeVersion} ({health.systemInfo.platform})
                    </p>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-extrabold">
                      <span>RAM Memory Usage</span>
                      <HardDrive className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {health.systemInfo.heapUsedMB} MB / {health.systemInfo.totalMemMB} MB
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      RSS: {health.systemInfo.rssMemoryMB} MB | Free: {health.systemInfo.freeMemMB} MB
                    </p>
                  </div>

                  {/* UltraMsg Gateway */}
                  <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-extrabold">
                      <span>WhatsApp UltraMsg Gateway</span>
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 text-base font-extrabold">
                      {health.ultraMsg.status === 'CONNECTED' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {health.ultraMsg.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Instance: {process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE_ID || 'instance191882'}
                    </p>
                  </div>
                </div>

                {/* Production Database Table Counts */}
                <div className="bg-white border border-[#cbcbcb] rounded-[5px] p-4 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-[#4a4a4a] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#6d8196]" /> Live Production Database Table Counts
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Customers</span>
                      <span className="text-xl font-extrabold text-[#4a4a4a]">{health.counts.customers}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Products / Variants</span>
                      <span className="text-xl font-extrabold text-[#6d8196]">
                        {health.counts.products} ({health.counts.variants} Variants)
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Sales Invoices</span>
                      <span className="text-xl font-extrabold text-emerald-700">{health.counts.invoices}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Suppliers / POs</span>
                      <span className="text-xl font-extrabold text-amber-700">
                        {health.counts.suppliers} ({health.counts.purchaseOrders} Orders)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-red-600 py-8 font-bold">Failed to load system health diagnostics.</p>
            )}
          </div>
        )}

        {/* TAB 2: RBAC PERMISSIONS MATRIX */}
        {activeTab === 'permissions' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbcbcb] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4a4a4a] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600" /> Role-Based Access Control (RBAC) Permissions Matrix
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure module access permissions for each user role in the application.
                </p>
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-[5px] text-xs font-extrabold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {savingPermissions ? 'Saving Matrix...' : 'Save Permissions Matrix'}
              </button>
            </div>

            {loadingPermissions ? (
              <div className="py-12 text-center text-slate-500">Loading RBAC permissions matrix...</div>
            ) : (
              <div className="overflow-x-auto border border-[#cbcbcb] rounded-[5px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#4a4a4a] text-white font-bold text-[10px] uppercase">
                      <th className="py-3 px-4 w-64 border-r border-slate-600">Application Module</th>
                      {ALL_ROLES.map((r) => (
                        <th key={r.id} className="py-3 px-3 text-center border-r border-slate-600 min-w-[120px]">
                          {r.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ALL_MODULES.map((mod) => (
                      <tr key={mod.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-extrabold text-slate-800 border-r border-slate-200">
                          {mod.name}
                        </td>
                        {ALL_ROLES.map((role) => {
                          const isAllowed = (rolePermissions[role.id] || []).includes(mod.id);
                          const isSuperAdminControl = mod.id === 'super_admin';

                          return (
                            <td key={role.id} className="py-2.5 px-3 text-center border-r border-slate-200">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isSuperAdminControl && role.id === 'SUPER_ADMIN'}
                                onChange={() => handleTogglePermission(role.id, mod.id)}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DATABASE CONTROL & DATA PURGE */}
        {activeTab === 'database' && (
          <div className="p-5 space-y-6 text-xs">
            <div className="bg-red-50 border-2 border-red-300 p-4 rounded-[5px] text-red-950 space-y-1 shadow-sm">
              <h3 className="text-sm font-black text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" /> Production Database Control & Flush Management
              </h3>
              <p className="text-xs text-red-800">
                Use these controls to export JSON snapshots, purge test data, or flush existing records to prepare the system for production startup.
              </p>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export JSON Snapshot Backup */}
              <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-700" /> Export JSON Snapshot Backup
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Download a complete JSON backup snapshot of all products, customers, invoices, suppliers, and system configuration.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  disabled={processingAction}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-[5px] text-xs font-extrabold flex items-center justify-center gap-2 shadow-md w-full disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Download Backup JSON Snapshot
                </button>
              </div>

              {/* Full Production Database Reset */}
              <div className="bg-red-50 p-4 rounded-[5px] border border-red-300 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-red-900 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-600" /> Full Database Flush ("Flush & Start New")
                  </h4>
                  <p className="text-xs text-red-800 mt-1">
                    Clears all operational test data (invoices, customer dues, inventory items, supplier orders), preserving user accounts & shop configuration.
                  </p>
                </div>
                <button
                  onClick={() => handleDatabaseFlush('flush_all', 'Full Production Database Flush')}
                  disabled={processingAction}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-[5px] text-xs font-black flex items-center justify-center gap-2 shadow-md w-full disabled:opacity-50 border border-red-500"
                >
                  <Trash2 className="w-4 h-4" /> Execute Full Production Flush
                </button>
              </div>
            </div>

            {/* Selective Purge Options */}
            <div className="bg-white border border-[#cbcbcb] rounded-[5px] p-4 space-y-3 shadow-sm">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Selective Data Purge Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleDatabaseFlush('flush_sales', 'Flush Invoices & Customer Dues')}
                  disabled={processingAction}
                  className="bg-slate-100 hover:bg-amber-100 text-amber-900 border border-amber-300 p-3 rounded-[5px] text-xs font-bold transition-all text-left space-y-1 disabled:opacity-50"
                >
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" /> Flush Sales & Invoices
                  </div>
                  <div className="text-[10px] text-slate-600">Clears all invoices, invoice items, and resets customer dues.</div>
                </button>

                <button
                  onClick={() => handleDatabaseFlush('flush_inventory', 'Flush Inventory Products & Variants')}
                  disabled={processingAction}
                  className="bg-slate-100 hover:bg-amber-100 text-amber-900 border border-amber-300 p-3 rounded-[5px] text-xs font-bold transition-all text-left space-y-1 disabled:opacity-50"
                >
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" /> Flush Inventory Catalog
                  </div>
                  <div className="text-[10px] text-slate-600">Clears products, variants, categories, brands, and rack locations.</div>
                </button>

                <button
                  onClick={() => handleDatabaseFlush('flush_purchases', 'Flush Purchase Orders & Supplier Dues')}
                  disabled={processingAction}
                  className="bg-slate-100 hover:bg-amber-100 text-amber-900 border border-amber-300 p-3 rounded-[5px] text-xs font-bold transition-all text-left space-y-1 disabled:opacity-50"
                >
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" /> Flush Purchase Orders
                  </div>
                  <div className="text-[10px] text-slate-600">Clears supplier purchase orders, items, and resets supplier dues.</div>
                </button>
              </div>
            </div>

            {/* Restore Database from JSON */}
            <div className="bg-slate-50 border border-[#cbcbcb] rounded-[5px] p-4 space-y-3 shadow-sm">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#6d8196]" /> Restore Database from JSON Snapshot
              </h4>
              <textarea
                rows={4}
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                placeholder="Paste exported backup snapshot JSON data here..."
                className="w-full p-2.5 bg-white border border-[#cbcbcb] rounded-[5px] text-xs font-mono focus:outline-none focus:border-[#6d8196]"
              />
              <button
                onClick={handleRestoreDatabase}
                disabled={processingAction || !restoreJson.trim()}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2 rounded-[5px] text-xs font-extrabold flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Restore Database State
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4a4a4a] flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#6d8196]" /> Core System Configuration & Shop Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage store settings, header logo, UltraMsg API configuration, and SMTP server alerts.
                </p>
              </div>

              <Link
                href="/settings"
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2 rounded-[5px] font-bold text-xs shadow-sm"
              >
                Open Full System Settings →
              </Link>
            </div>

            {health?.shopSettings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Store Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{health.shopSettings.shopName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">GSTIN Number</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono">{health.shopSettings.gstin}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Store Phone</span>
                  <span className="font-semibold text-slate-800">{health.shopSettings.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Default Printer Format</span>
                  <span className="font-bold text-slate-800 uppercase">{health.shopSettings.printerType}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        confirmVariant={confirmModalState.confirmVariant}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
