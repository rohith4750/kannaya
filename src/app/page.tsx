'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  AlertTriangle,
  ShoppingCart,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  Bot,
  Calendar,
  Filter,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  CheckCircle2,
  Zap,
  Tag,
  CreditCard,
  QrCode,
  Banknote,
  Coins,
  ShieldAlert,
  Store,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import MaterialSelect from '@/components/MaterialSelect';
import { getEnabledModules } from '@/components/ModulePermissionsModal';

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledModulesList, setEnabledModulesList] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkLandingPage = async () => {
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
          setCurrentUser(meData.user);
        }

        let modulesForRole: string[] = [];
        if (permData && permData[role] && Array.isArray(permData[role])) {
          modulesForRole = permData[role];
        } else if (meData.user?.allowedModules && Array.isArray(meData.user.allowedModules) && meData.user.allowedModules.length > 0) {
          modulesForRole = meData.user.allowedModules;
        } else {
          modulesForRole = getEnabledModules();
        }

        setEnabledModulesList(modulesForRole);

        // If dashboard is not enabled for this user/role, dynamically redirect to the FIRST enabled module!
        if (!modulesForRole.includes('dashboard')) {
          const MODULE_ROUTES: { [key: string]: string } = {
            super_admin: '/super-admin',
            billing: '/billing',
            invoices: '/invoices',
            customers: '/customers',
            expenses: '/expenses',
            products: '/products',
            categories: '/categories',
            racks: '/racks',
            suppliers: '/suppliers',
            users: '/users',
            whatsapp: '/whatsapp',
            ai_assistant: '/ai-assistant',
            reports: '/reports',
            settings: '/settings',
          };

          const firstAvailableModule = modulesForRole.find((m) => MODULE_ROUTES[m]);
          if (firstAvailableModule && MODULE_ROUTES[firstAvailableModule]) {
            router.replace(MODULE_ROUTES[firstAvailableModule]);
          }
        }
      } catch (err) {
        console.error('Landing page check error:', err);
      }
    };

    checkLandingPage();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kannaya_user_role' || e.key === 'kannaya_active_modules') {
        checkLandingPage();
      }
    };

    window.addEventListener('modules_changed', checkLandingPage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('modules_changed', checkLandingPage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Filter States
  const [period, setPeriod] = useState<string>('this_month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedMonth && selectedYear) {
        params.append('month', selectedMonth);
        params.append('year', selectedYear);
      }
      if (period === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setRecentInvoices(data.recentInvoices || []);
        setSalesTrend(data.salesTrend || []);
        setCategoryPerformance(data.categoryPerformance || []);
        setTopSellingProducts(data.topSellingProducts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period, selectedMonth, selectedYear, startDate, endDate]);

  const getPeriodLabel = () => {
    if (selectedMonth && selectedYear) {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
    }
    if (period === 'today') return 'Today';
    if (period === 'this_month') return 'This Month';
    if (period === 'last_month') return 'Last Month';
    if (period === 'last_3_months') return 'Last 3 Months';
    if (period === 'this_year') return 'This Year (2026)';
    if (period === 'custom') return 'Custom Date Range';
    return 'Filtered Period';
  };

  // Payment Breakdown Percentages
  const totalPOSSales = metrics?.periodSales || 1;
  const cashPct = Math.round(((metrics?.cashSales || 0) / totalPOSSales) * 100);
  const upiPct = Math.round(((metrics?.upiSales || 0) / totalPOSSales) * 100);
  const cardPct = Math.round(((metrics?.cardSales || 0) / totalPOSSales) * 100);
  const creditPct = Math.round(((metrics?.creditSales || 0) / totalPOSSales) * 100);

  // If Dashboard module permission is disabled in Module Permissions, show Welcome Landing Screen
  if (enabledModulesList.length > 0 && !enabledModulesList.includes('dashboard')) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 font-sans select-none">
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-[#4a4a4a] via-[#383838] to-[#2b2b2b] text-white p-6 sm:p-8 rounded-[5px] border-2 border-[#6d8196] shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white p-1 border-4 border-[#6d8196] shadow-2xl overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#6d8196]/40 text-[#ffffe3] px-3 py-1 rounded-[5px] text-xs font-bold border border-[#6d8196]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sri Venkata Lakshmi Electricals ERP
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome to Sri Venkata Lakshmi Electricals
              </h1>
              <p className="text-xs text-[#ffffe3] font-semibold">
                Complete Electrical Solutions • Powering Your Needs (Since 2025)
              </p>
            </div>
          </div>

          {/* Proprietor & Store Contact Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/10 p-4 rounded-[5px] backdrop-blur-xs border border-white/20 text-xs">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-extrabold text-amber-300 tracking-wider flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Store Proprietor & Contact Information
              </div>
              <div className="space-y-1.5 font-medium">
                <div className="flex items-center gap-2 text-white">
                  <User className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Store Proprietor: <strong className="text-amber-200 font-bold">Kannaya Reddy</strong></span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Phone / WhatsApp: <strong className="font-mono text-white font-bold">+91 98765 43210</strong></span>
                </div>
                <div className="flex items-start gap-2 text-slate-200 text-[11px]">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-4">
              <div className="text-[10px] uppercase font-extrabold text-amber-300 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Current Signed-In Session & Login Details
              </div>
              <div className="space-y-1.5 font-medium text-xs">
                <div className="text-white">
                  <span className="text-slate-300">Signed-In User: </span>
                  <strong className="text-emerald-300 font-bold">{currentUser?.name || 'Store Cashier User'}</strong>
                </div>
                <div className="text-white">
                  <span className="text-slate-300">Login ID / Email: </span>
                  <strong className="font-mono text-white">{currentUser?.email || 'staff@venkatalakshmi.com'}</strong>
                </div>
                <div className="text-white">
                  <span className="text-slate-300">Account Access Role: </span>
                  <span className="bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase">
                    {currentUser?.role || 'STAFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#4a4a4a] flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#6d8196]" /> Quick Counter Actions & Active Features
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {enabledModulesList.includes('billing') && (
              <Link
                href="/billing"
                className="p-4 bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm hover:shadow-md hover:border-[#6d8196] transition-all flex items-center gap-3 group"
              >
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-[5px] group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#4a4a4a] group-hover:text-[#6d8196]">Smart POS Billing</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Create new customer bills (F2)</p>
                </div>
              </Link>
            )}

            {enabledModulesList.includes('invoices') && (
              <Link
                href="/invoices"
                className="p-4 bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm hover:shadow-md hover:border-[#6d8196] transition-all flex items-center gap-3 group"
              >
                <div className="p-3 bg-blue-100 text-blue-800 rounded-[5px] group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#4a4a4a] group-hover:text-[#6d8196]">Bills & Invoices</h4>
                  <p className="text-[11px] text-slate-500 font-medium">View & print customer sales invoices</p>
                </div>
              </Link>
            )}

            {enabledModulesList.includes('customers') && (
              <Link
                href="/customers"
                className="p-4 bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm hover:shadow-md hover:border-[#6d8196] transition-all flex items-center gap-3 group"
              >
                <div className="p-3 bg-amber-100 text-amber-800 rounded-[5px] group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#4a4a4a] group-hover:text-[#6d8196]">Customer Accounts</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Manage master credit & ledger accounts</p>
                </div>
              </Link>
            )}

            {enabledModulesList.includes('products') && (
              <Link
                href="/products"
                className="p-4 bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm hover:shadow-md hover:border-[#6d8196] transition-all flex items-center gap-3 group"
              >
                <div className="p-3 bg-purple-100 text-purple-800 rounded-[5px] group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#4a4a4a] group-hover:text-[#6d8196]">Inventory Products</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Search electrical items stock & prices</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full select-none pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4a4a4a] flex items-center gap-2">
              Sri Venkata Lakshmi Electricals
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Real-Time Stock Valuation, Low Stock Health Alerts & Store Expense Analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-[5px] bg-slate-100 border border-slate-300 text-slate-700 hover:text-blue-700 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/billing"
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-2 rounded-[5px] flex items-center gap-2 shadow-sm text-xs transition-all border border-[#cbcbcb]/40"
          >
            <ShoppingCart className="w-4 h-4" /> Start POS Billing
          </Link>
        </div>
      </div>

      {/* DUAL STOCK VALUATION & EXPENSE OUTFLOW OVERVIEW BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: INVENTORY & STOCK VALUATION OVERVIEW */}
        <div className="bg-gradient-to-br from-[#4a4a4a] via-[#383838] to-[#282828] text-white p-4 sm:p-5 rounded-[5px] shadow-md relative overflow-hidden border border-[#6d8196]">
          <div className="flex items-center justify-between pb-3 border-b border-[#6d8196]/40">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#ffffe3]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#ffffe3]">
                Inventory Stock Valuation & Health
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6d8196] text-[#ffffe3] font-mono border border-[#6d8196]">
              {metrics?.totalProductCount || 0} Total SKUs
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/20 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-[#ffffe3]/90 block uppercase font-medium">Stock Valuation</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                ₹{(metrics?.totalInventoryCostValue || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-black/20 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Total Products</span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-200">
                {metrics?.totalProductCount || 0} Items
              </span>
            </div>

            <div className="bg-amber-500/20 p-2.5 rounded-[5px] border border-amber-400/40">
              <span className="text-[10px] text-[#ffffe3] block uppercase font-bold">Low Stock Alert</span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                {metrics?.lowStockCount || 0} Low Stock
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: EXPENSES & STORE OUTFLOW ANALYTICS */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#334155] text-white p-4 sm:p-5 rounded-[5px] shadow-md relative overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#ffffe3]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#ffffe3]">
                {getPeriodLabel()} Store Expenses & Outflow
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffffe3] text-slate-900 font-mono">
              Store Operating Outflows
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Period Outflow</span>
              <span className="text-base sm:text-lg font-black font-mono text-rose-300">
                ₹{(metrics?.totalExpenses || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white/5 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Cash Collected</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-300">
                ₹{(metrics?.cashSales || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-blue-500/20 p-2.5 rounded-[5px] border border-blue-400/40">
              <span className="text-[10px] text-[#ffffe3] block uppercase font-bold">UPI / Digital Received</span>
              <span className="text-base sm:text-lg font-black font-mono text-blue-300">
                ₹{(metrics?.upiSales || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONSOLIDATED MONTH & DATE RANGE FILTER BAR */}
      <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#cbcbcb] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4a4a4a]">
            <Calendar className="w-4 h-4 text-[#6d8196]" />
            <span>Dashboard Metrics & Report Period:</span>
            <span className="px-2.5 py-0.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/30 font-extrabold">
              {getPeriodLabel()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setPeriod('this_month');
                setSelectedMonth('');
              }}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'this_month' && !selectedMonth
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setPeriod('today');
                setSelectedMonth('');
              }}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'today'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setPeriod('last_month');
                setSelectedMonth('');
              }}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'last_month'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => {
                setPeriod('last_3_months');
                setSelectedMonth('');
              }}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'last_3_months'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => {
                setPeriod('this_year');
                setSelectedMonth('');
              }}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'this_year'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              This Year (2026)
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 rounded-[5px] text-xs font-bold transition-all border ${
                period === 'custom'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Extended Month & Year Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <MaterialSelect
              label="Select Month Filter"
              value={selectedMonth}
              onChange={(val) => {
                setSelectedMonth(val);
                if (val) setPeriod('month_select');
              }}
              options={[
                { value: '', label: '-- All Months / Quick Filter --' },
                { value: '1', label: 'January' },
                { value: '2', label: 'February' },
                { value: '3', label: 'March' },
                { value: '4', label: 'April' },
                { value: '5', label: 'May' },
                { value: '6', label: 'June' },
                { value: '7', label: 'July' },
                { value: '8', label: 'August' },
                { value: '9', label: 'September' },
                { value: '10', label: 'October' },
                { value: '11', label: 'November' },
                { value: '12', label: 'December' },
              ]}
            />
          </div>

          <div>
            <MaterialSelect
              label="Select Year"
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              options={[
                { value: '2026', label: 'Year 2026' },
                { value: '2025', label: 'Year 2025' },
              ]}
            />
          </div>

          {period === 'custom' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 uppercase font-bold">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-xs text-[#4a4a4a]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 uppercase font-bold">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-xs text-[#4a4a4a]"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-2 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between">
              <span className="text-slate-500 font-medium">Billed Transactions in Period:</span>
              <span className="font-extrabold text-[#6d8196]">{metrics?.totalInvoiceCount || 0} Invoices</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Billed Revenue */}
        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">
              {getPeriodLabel()} Sales
            </span>
            <div className="p-1.5 rounded-[5px] bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.periodSales || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>Gross Billed Amount</span>
              <span className="font-bold text-[#6d8196]">AOV: ₹{Math.round(metrics?.avgOrderValue || 0)}</span>
            </p>
          </div>
        </div>

        {/* Store Expenses & Outflow */}
        <Link href="/expenses" className="bg-white p-4 rounded-[5px] border border-rose-300 shadow-sm bg-rose-50/20 hover:border-rose-400 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">
              Store Expenses
            </span>
            <div className="p-1.5 rounded-[5px] bg-rose-100 text-rose-800 font-bold">
              <FileText className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-rose-800">
              ₹{(metrics?.totalExpenses || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-rose-700 font-semibold mt-1 flex items-center justify-between">
              <span>Operating Costs Outflow</span>
              <ArrowUpRight className="w-3 h-3 text-rose-700" />
            </p>
          </div>
        </Link>

        {/* Cash & Digital Collection */}
        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">
              {getPeriodLabel()} Collection
            </span>
            <div className="p-1.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.periodCollection || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Cash + UPI Received</p>
          </div>
        </div>

        {/* Customer Udhar Due */}
        <Link href="/customers" className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm hover:border-[#6d8196] transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Customer Credit Due</span>
            <div className="p-1.5 rounded-[5px] bg-amber-50 text-amber-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-amber-700">
              ₹{(metrics?.customerDueTotal || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Total Dues Balance</span>
              <ArrowUpRight className="w-3 h-3 text-amber-700" />
            </p>
          </div>
        </Link>

        {/* Inventory Stock Valuation */}
        <Link href="/products" className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm hover:border-[#6d8196] transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Stock Valuation</span>
            <div className="p-1.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.totalInventoryCostValue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Cost Value ({metrics?.totalProductCount || 0} items)</span>
              <ArrowUpRight className="w-3 h-3 text-[#6d8196]" />
            </p>
          </div>
        </Link>
      </div>

      {/* POS PAYMENT METHOD BREAKDOWN BAR */}
      <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#6d8196]" />
            <h3 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">
              POS Payment Methods Breakdown ({getPeriodLabel()})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#6d8196]">
            Total POS Billed: ₹{(metrics?.periodSales || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Payment Multi-color Progress Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
          <div style={{ width: `${cashPct}%` }} className="bg-emerald-600 h-full" title={`Cash: ₹${metrics?.cashSales || 0}`} />
          <div style={{ width: `${upiPct}%` }} className="bg-blue-600 h-full" title={`UPI: ₹${metrics?.upiSales || 0}`} />
          <div style={{ width: `${cardPct}%` }} className="bg-indigo-600 h-full" title={`Card: ₹${metrics?.cardSales || 0}`} />
          <div style={{ width: `${creditPct}%` }} className="bg-amber-500 h-full" title={`Credit/Udhar: ₹${metrics?.creditSales || 0}`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-[5px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-[10px] font-bold text-emerald-900 block">CASH SALES</span>
                <span className="text-xs font-black font-mono text-emerald-800">
                  ₹{(metrics?.cashSales || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700">{cashPct}%</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 p-2.5 rounded-[5px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-700" />
              <div>
                <span className="text-[10px] font-bold text-blue-900 block">UPI PAYMENTS</span>
                <span className="text-xs font-black font-mono text-blue-800">
                  ₹{(metrics?.upiSales || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-700">{upiPct}%</span>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 p-2.5 rounded-[5px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-700" />
              <div>
                <span className="text-[10px] font-bold text-indigo-900 block">CARD SALES</span>
                <span className="text-xs font-black font-mono text-indigo-800">
                  ₹{(metrics?.cardSales || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-700">{cardPct}%</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-[5px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-[10px] font-bold text-amber-900 block">UDHAR / CREDIT</span>
                <span className="text-xs font-black font-mono text-amber-800">
                  ₹{(metrics?.creditSales || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-700">{creditPct}%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales & Collection Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#4a4a4a]">Sales & Cash Collection Trend</h3>
              <p className="text-xs text-slate-500 font-medium">Billed revenue and payment collection for {getPeriodLabel()}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-[#6d8196]" />
                <span className="text-[#4a4a4a]">Billed Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-emerald-600" />
                <span className="text-[#4a4a4a]">Cash/UPI Collection</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6d8196" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6d8196" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#4a4a4a',
                    borderColor: '#6d8196',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="sales" stroke="#6d8196" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collection" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#collectGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales & Stock Revenue Breakdown */}
        <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 mb-3">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#6d8196]" /> Category Sales Revenue
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categoryPerformance.length > 0 ? (
                categoryPerformance.map((cat, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#4a4a4a] block truncate max-w-[140px]">{cat.name}</span>
                      <span className="text-[10px] text-slate-500">Category Sales</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#6d8196] block">₹{(cat.sales || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No category sales in period.</p>
              )}
            </div>
          </div>

          <Link
            href="/reports"
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#4a4a4a] font-bold rounded-[5px] text-xs text-center block transition-colors border border-[#cbcbcb]"
          >
            View Inventory Reports & Analytics →
          </Link>
        </div>
      </div>

      {/* Recent Transactions & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products List */}
        <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 mb-3">
            <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#6d8196]" /> Top Selling Items ({getPeriodLabel()})
            </h3>
            <Link href="/products" className="text-[11px] text-[#6d8196] hover:underline font-semibold">
              View All Products
            </Link>
          </div>

          <div className="divide-y divide-slate-200">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((tp, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-[#4a4a4a] block">{tp.productName}</span>
                      <span className="text-[10px] text-slate-500">Rack: {tp.rackLocation || 'Default'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#4a4a4a] block">₹{(tp._sum?.total || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{tp._sum?.quantity || 0} units sold</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No top items recorded in period.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 mb-3">
            <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#6d8196]" /> Recent POS Invoices
            </h3>
            <Link href="/invoices" className="text-[11px] text-[#6d8196] hover:underline font-semibold">
              View All Invoices
            </Link>
          </div>

          <div className="divide-y divide-slate-200">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[#4a4a4a]">{inv.invoiceNo}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        inv.paymentMethod === 'CASH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentMethod === 'UPI'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.paymentMethod === 'CREDIT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {inv.paymentMethod}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                      {inv.customerName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-[#4a4a4a] block">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No recent invoices in period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
