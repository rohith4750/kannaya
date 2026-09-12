'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Truck, Package, Printer } from 'lucide-react';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" /> Business Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Financial auditing, profit/loss breakdown, inventory valuation, and credit receivables.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg shadow-amber-500/10"
        >
          <Printer className="w-4 h-4" /> Print Financial Report
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Estimated Today's Sales</div>
          <div className="text-3xl font-black text-white">
            ₹{(metrics?.todaysSales || 24500).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-400 font-semibold">+18.4% growth vs previous week</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Customer Udhar Outstanding</div>
          <div className="text-3xl font-black text-amber-400">
            ₹{(metrics?.customerDueTotal || 71700).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400">Receivables pending clearance</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Supplier Payables Due</div>
          <div className="text-3xl font-black text-purple-300">
            ₹{(metrics?.supplierDueTotal || 195000).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400">Pending stock invoices</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Collection Report */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue & Profit Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Total Gross Monthly Sales</span>
              <span className="font-bold text-white">₹7,28,400</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Estimated Cost of Goods Sold (COGS)</span>
              <span className="font-bold text-slate-300">₹5,18,200</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="font-bold text-emerald-300">Estimated Net Profit</span>
              <span className="font-black text-emerald-400 text-sm">₹2,10,200 (28.8%)</span>
            </div>
          </div>
        </div>

        {/* Inventory Valuation Report */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" /> Inventory Stock Valuation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Total Catalog Items</span>
              <span className="font-bold text-white">{metrics?.totalProductCount || 14} SKUs</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Stock Purchase Cost Valuation</span>
              <span className="font-bold text-white">₹12,85,400</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="font-bold text-amber-300">Stock Selling Value</span>
              <span className="font-black text-amber-400 text-sm">₹17,42,800</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
