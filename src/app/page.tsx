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
import MaterialSelect from '@/components/MaterialSelect';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
              Real-Time Financial Performance & Dual Active Profit Analytics • Powering Your Needs.
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

      {/* DUAL ACTIVE PROFIT & LOSS OVERVIEW BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: TODAY'S ACTIVE PROFIT */}
        <div className="bg-gradient-to-br from-emerald-900 via-[#1b4332] to-[#2d6a4f] text-white p-4 sm:p-5 rounded-[5px] shadow-md relative overflow-hidden border border-emerald-700/50">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-600/40">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#ffffe3] animate-pulse" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#ffffe3]">
                Today's Active Profit Overview
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffffe3] text-emerald-950 font-mono">
              {metrics?.todayProfitMargin !== undefined ? `${metrics.todayProfitMargin.toFixed(1)}% Margin` : '0% Margin'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/20 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Today's Revenue</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                ₹{(metrics?.todaySales || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-black/20 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Cost of Goods (COGS)</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-200">
                ₹{(metrics?.todayCost || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-emerald-500/20 p-2.5 rounded-[5px] border border-emerald-400/40">
              <span className="text-[10px] text-[#ffffe3] block uppercase font-bold">Net Gross Profit</span>
              <span className="text-base sm:text-lg font-black font-mono text-[#ffffe3]">
                ₹{(metrics?.todayGrossProfit || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: SELECTED PERIOD ACTIVE PROFIT */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#334155] text-white p-4 sm:p-5 rounded-[5px] shadow-md relative overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#ffffe3]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#ffffe3]">
                {getPeriodLabel()} Active Profit
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffffe3] text-slate-900 font-mono">
              {metrics?.periodProfitMargin !== undefined ? `${metrics.periodProfitMargin.toFixed(1)}% Margin` : '0% Margin'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Period Revenue</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                ₹{(metrics?.periodSales || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white/5 p-2.5 rounded-[5px] border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Cost of Goods (COGS)</span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-300">
                ₹{(metrics?.periodCost || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-blue-500/20 p-2.5 rounded-[5px] border border-blue-400/40">
              <span className="text-[10px] text-[#ffffe3] block uppercase font-bold">Net Gross Profit</span>
              <span className="text-base sm:text-lg font-black font-mono text-[#ffffe3]">
                ₹{(metrics?.periodGrossProfit || 0).toLocaleString('en-IN')}
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

        {/* Period Gross Profit */}
        <div className="bg-white p-4 rounded-[5px] border border-emerald-300 shadow-sm bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
              Period Gross Profit
            </span>
            <div className="p-1.5 rounded-[5px] bg-emerald-100 text-emerald-800 font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-emerald-800">
              ₹{(metrics?.periodGrossProfit || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex justify-between">
              <span>Revenue minus COGS</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-mono font-bold text-[9px]">
                {metrics?.periodProfitMargin !== undefined ? `${metrics.periodProfitMargin.toFixed(1)}%` : '0%'}
              </span>
            </p>
          </div>
        </div>

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
            <div className="p-1.5 rounded-[5px] bg-purple-50 text-purple-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-purple-900">
              ₹{(metrics?.totalInventoryCostValue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Cost Value ({metrics?.totalProductCount || 0} items)</span>
              <ArrowUpRight className="w-3 h-3 text-purple-700" />
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
        {/* Sales, Profit & Collection Multi-Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#4a4a4a]">Sales, Profit & Collection Trend</h3>
              <p className="text-xs text-slate-500">Filtered financial trend for {getPeriodLabel()}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-[#6d8196]" />
                <span className="text-[#4a4a4a]">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-emerald-600" />
                <span className="text-[#4a4a4a]">Collection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-violet-600" />
                <span className="text-[#4a4a4a]">Net Profit</span>
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
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
                <Area type="monotone" dataKey="profit" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Profit Performance Leaderboard */}
        <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 mb-3">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#6d8196]" /> Category Profit Ranking
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Margin %</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categoryPerformance.length > 0 ? (
                categoryPerformance.map((cat, idx) => {
                  const catMargin = cat.sales > 0 ? (cat.profit / cat.sales) * 100 : 0;
                  return (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#4a4a4a] block truncate max-w-[140px]">{cat.name}</span>
                        <span className="text-[10px] text-slate-500">Sales: ₹{cat.sales.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-700 block">₹{cat.profit.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1 rounded">
                          {catMargin.toFixed(1)}% margin
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No category sales in period.</p>
              )}
            </div>
          </div>

          <Link
            href="/reports"
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#4a4a4a] font-bold rounded-[5px] text-xs text-center block transition-colors border border-[#cbcbcb]"
          >
            View Detailed Reports & Analytics →
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
                    <span className="font-extrabold text-[#4a4a4a] block">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
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
