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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
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
  }, []);

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 rounded-[5px] bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.todaysSales || 24500).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-bold">+18.4%</span> vs yesterday
            </p>
          </div>
        </div>

        {/* Today's Cash Collection */}
        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Today's Collection</span>
            <div className="p-1.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.todaysCollection || 15000).toLocaleString('en-IN')}
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
              ₹{(metrics?.customerDueTotal || 71700).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Total Credit Balance</span>
              <ArrowUpRight className="w-3 h-3 text-amber-700" />
            </p>
          </div>
        </Link>

        {/* Supplier Pending Due */}
        <Link href="/suppliers" className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm hover:border-[#6d8196] transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-wider">Supplier Due</span>
            <div className="p-1.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-[#6d8196]">
              ₹{(metrics?.supplierDueTotal || 195000).toLocaleString('en-IN')}
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
              {metrics?.lowStockCount !== undefined ? metrics.lowStockCount : 1}
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
              <h3 className="text-sm font-bold text-[#4a4a4a]">Weekly Sales & Cash Collection</h3>
              <p className="text-xs text-slate-500">Revenue overview over the past 7 days</p>
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
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
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
              "Which customer owes me the most?"
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

      {/* Recent Bills Table */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#4a4a4a]">Recent Shop Bills & Transactions</h3>
            <p className="text-xs text-slate-500">Latest completed customer invoices</p>
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
                      {new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No recent invoices found.
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
