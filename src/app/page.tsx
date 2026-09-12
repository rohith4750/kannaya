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
} from 'lucide-react';
import {
  AreaChart,
  Area,
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

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-[#cbcbcb] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
            <img src="/logo.jpg" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4a4a4a] flex items-center gap-2">
              Welcome to Venkata Lakshmi Electronics
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Real-time business performance overview • Powering Your Needs (Since 2023).
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
        {/* Sales Total in Period */}
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
              ₹{(metrics?.todaysSales || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Gross Billed Amount
            </p>
          </div>
        </div>

        {/* Cash Collection in Period */}
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
              ₹{(metrics?.todaysCollection || 0).toLocaleString('en-IN')}
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

        {/* Supplier Pending Due */}
        <Link href="/suppliers" className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm hover:border-[#6d8196] transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Supplier Dues</span>
            <div className="p-1.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#6d8196]">
              ₹{(metrics?.supplierDueTotal || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Payables Pending</span>
              <ArrowUpRight className="w-3 h-3 text-[#6d8196]" />
            </p>
          </div>
        </Link>

        {/* Low Stock Alert */}
        <Link href="/products?filter=low-stock" className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm hover:border-[#6d8196] transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Low Stock Items</span>
            <div className="p-1.5 rounded-[5px] bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-rose-700">
              {metrics?.lowStockCount !== undefined ? metrics.lowStockCount : 0}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Requires Restock</span>
              <ArrowUpRight className="w-3 h-3 text-rose-700" />
            </p>
          </div>
        </Link>
      </div>

      {/* Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#4a4a4a]">Sales & Collection Trend ({getPeriodLabel()})</h3>
              <p className="text-xs text-slate-500">Filtered revenue breakdown for {getPeriodLabel()}</p>
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

        {/* Quick Modules Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#4a4a4a]">Kannaya AI Assistant</h3>
                <p className="text-xs text-slate-500">Ask natural language shop queries</p>
              </div>
            </div>
            <p className="text-xs text-[#4a4a4a] mt-3 italic bg-[#ffffe3] p-2.5 rounded-[5px] border border-[#cbcbcb]">
              "How much total sales in {getPeriodLabel()}?"
            </p>
            <Link
              href="/ai-assistant"
              className="mt-3.5 w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold py-1.5 px-4 rounded-[5px] text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              Ask AI Assistant
            </Link>
          </div>

          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
            <h3 className="text-sm font-bold text-[#4a4a4a] mb-3">Quick ERP Modules</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/racks"
                className="p-2.5 rounded-[5px] bg-slate-50 border border-[#cbcbcb] hover:border-[#6d8196] text-xs font-semibold text-[#4a4a4a] flex items-center gap-2 transition-colors"
              >
                <Layers className="w-4 h-4 text-amber-700" /> Rack Map
              </Link>
              <Link
                href="/barcode"
                className="p-2.5 rounded-[5px] bg-slate-50 border border-[#cbcbcb] hover:border-[#6d8196] text-xs font-semibold text-[#4a4a4a] flex items-center gap-2 transition-colors"
              >
                <Package className="w-4 h-4 text-[#6d8196]" /> Barcode Studio
              </Link>
              <Link
                href="/whatsapp"
                className="p-2.5 rounded-[5px] bg-slate-50 border border-[#cbcbcb] hover:border-[#6d8196] text-xs font-semibold text-[#4a4a4a] flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" /> WhatsApp
              </Link>
              <Link
                href="/customers"
                className="p-2.5 rounded-[5px] bg-slate-50 border border-[#cbcbcb] hover:border-[#6d8196] text-xs font-semibold text-[#4a4a4a] flex items-center gap-2 transition-colors"
              >
                <Users className="w-4 h-4 text-[#6d8196]" /> Credit Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Bills Table */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#4a4a4a]">Invoices & Transactions ({getPeriodLabel()})</h3>
            <p className="text-xs text-slate-500">Filtered customer bills generated in {getPeriodLabel()}</p>
          </div>
          <Link href="/invoices" className="text-xs text-[#6d8196] hover:underline font-bold flex items-center gap-1">
            View All Bills <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-[5px] border border-[#cbcbcb]">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Items Count</th>
                <th>Payment Mode</th>
                <th>Total Amount</th>
                <th>Due Amount (Credit)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono font-bold text-[#6d8196]">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="font-medium text-slate-900">{inv.customerName}</td>
                    <td className="text-slate-600">{inv.items?.length || 1} items</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="font-bold text-emerald-700">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      {inv.dueAmount > 0 ? (
                        <span className="text-amber-700 font-bold">₹{inv.dueAmount.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">PAID</span>
                      )}
                    </td>
                    <td className="text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No invoices generated in {getPeriodLabel()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
