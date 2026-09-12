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
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b] p-6 rounded-[5px] border border-slate-700/80 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Welcome to Kannaya ERP
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time business performance overview for Sri Lakshmi Electricals & Hardware.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-[5px] bg-[#0f172a] border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/billing"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-[5px] flex items-center gap-2 shadow-md text-xs transition-all"
          >
            <ShoppingCart className="w-4 h-4" /> Start POS Billing
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-[#1e293b] p-5 rounded-[5px] border border-slate-700/80 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-[5px] bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              ₹{(metrics?.todaysSales || 24500).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">+18.4%</span> vs yesterday
            </p>
          </div>
        </div>

        {/* Today's Cash Collection */}
        <div className="bg-[#1e293b] p-5 rounded-[5px] border border-slate-700/80 border-l-4 border-l-cyan-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Collection</span>
            <div className="p-2 rounded-[5px] bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              ₹{(metrics?.todaysCollection || 15000).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Cash + UPI Received</p>
          </div>
        </div>

        {/* Customer Udhar Due */}
        <Link href="/customers" className="bg-[#1e293b] p-5 rounded-[5px] border border-slate-700/80 border-l-4 border-l-amber-500 shadow-sm hover:border-amber-500/50 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Due</span>
            <div className="p-2 rounded-[5px] bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-400">
              ₹{(metrics?.customerDueTotal || 71700).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Total Udhar Balance</span>
              <ArrowUpRight className="w-3 h-3 text-amber-400" />
            </p>
          </div>
        </Link>

        {/* Supplier Pending Due */}
        <Link href="/suppliers" className="bg-[#1e293b] p-5 rounded-[5px] border border-slate-700/80 border-l-4 border-l-indigo-500 shadow-sm hover:border-indigo-500/50 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier Due</span>
            <div className="p-2 rounded-[5px] bg-indigo-500/10 text-indigo-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-indigo-300">
              ₹{(metrics?.supplierDueTotal || 195000).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Payables Pending</span>
              <ArrowUpRight className="w-3 h-3 text-indigo-400" />
            </p>
          </div>
        </Link>

        {/* Low Stock Alert */}
        <Link href="/products?filter=low-stock" className="bg-[#1e293b] p-5 rounded-[5px] border border-slate-700/80 border-l-4 border-l-rose-500 shadow-sm hover:border-rose-500/50 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</span>
            <div className="p-2 rounded-[5px] bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-400">
              {metrics?.lowStockCount !== undefined ? metrics.lowStockCount : 1}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Requires Restock</span>
              <ArrowUpRight className="w-3 h-3 text-rose-400" />
            </p>
          </div>
        </Link>
      </div>

      {/* Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-[5px] border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly Sales & Cash Collection</h3>
              <p className="text-xs text-slate-400">Revenue overview over the past 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-indigo-500" />
                <span className="text-slate-300">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[5px] bg-emerald-500" />
                <span className="text-slate-300">Collection</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '5px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collection" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#collectGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Modules Shortcuts */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-[5px] border border-slate-700/80 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[5px] bg-indigo-500/20 text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kannaya AI Assistant</h3>
                <p className="text-xs text-slate-400">Ask natural language shop queries</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 italic bg-[#0f172a] p-3 rounded-[5px] border border-slate-700">
              "Which customer owes me the most?"
            </p>
            <Link
              href="/ai-assistant"
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-[5px] text-xs flex items-center justify-center gap-2 transition-colors"
            >
              Ask AI Assistant
            </Link>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[5px] border border-slate-700/80 shadow-md">
            <h3 className="text-sm font-bold text-white mb-3">Quick Material ERP Modules</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/racks"
                className="p-3 rounded-[5px] bg-[#0f172a] border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
              >
                <Layers className="w-4 h-4 text-amber-400" /> Rack Map
              </Link>
              <Link
                href="/barcode"
                className="p-3 rounded-[5px] bg-[#0f172a] border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
              >
                <Package className="w-4 h-4 text-blue-400" /> Barcode Studio
              </Link>
              <Link
                href="/whatsapp"
                className="p-3 rounded-[5px] bg-[#0f172a] border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
              </Link>
              <Link
                href="/customers"
                className="p-3 rounded-[5px] bg-[#0f172a] border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-400" /> Udhar Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="bg-[#1e293b] p-6 rounded-[5px] border border-slate-700/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Shop Bills & Transactions</h3>
            <p className="text-xs text-slate-400">Latest completed customer invoices</p>
          </div>
          <Link href="/invoices" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
            View All Bills <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Due (Udhar)</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{inv.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{inv.items?.length || 1} items</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-[#0f172a] text-slate-300 border border-slate-700">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      {inv.dueAmount > 0 ? (
                        <span className="text-amber-400 font-bold">₹{inv.dueAmount.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold">PAID</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
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
