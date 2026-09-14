'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Truck, Package, Printer } from 'lucide-react';
import AdminSecurityGuard from '@/components/AdminSecurityGuard';

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
    <AdminSecurityGuard
      moduleName="Business Analytics & Financial Reports"
      moduleDescription="Contains store financial audits, revenue profit & loss breakdown, inventory valuation, and credit receivables."
    >
      <div className="space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-[#4a4a4a] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#6d8196]" /> Business Analytics & Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Financial auditing, profit/loss breakdown, inventory valuation, and credit receivables.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-2 rounded-[5px] flex items-center gap-2 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
          >
            <Printer className="w-4 h-4" /> Print Financial Report
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] border-l-4 border-l-emerald-600 shadow-sm space-y-1.5">
            <div className="text-xs font-bold text-[#4a4a4a] uppercase">Estimated Today's Sales</div>
            <div className="text-2xl font-extrabold text-[#4a4a4a]">
              ₹{(metrics?.todaysSales || 24500).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-700 font-bold">+18.4% growth vs previous week</p>
          </div>

          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] border-l-4 border-l-amber-500 shadow-sm space-y-1.5">
            <div className="text-xs font-bold text-[#4a4a4a] uppercase">Total Customer Credit Outstanding</div>
            <div className="text-2xl font-extrabold text-amber-700">
              ₹{(metrics?.customerDueTotal || 71700).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500">Receivables pending clearance</p>
          </div>

          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] border-l-4 border-l-[#6d8196] shadow-sm space-y-1.5">
            <div className="text-xs font-bold text-[#4a4a4a] uppercase">Total Supplier Payables Due</div>
            <div className="text-2xl font-extrabold text-[#6d8196]">
              ₹{(metrics?.supplierDueTotal || 195000).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500">Pending stock invoices</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sales & Collection Report */}
          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" /> Revenue & Profit Breakdown
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-3 rounded-[5px] bg-slate-50 border border-[#cbcbcb]">
                <span className="text-slate-600 font-medium">Total Gross Monthly Sales</span>
                <span className="font-bold text-[#4a4a4a]">₹7,28,400</span>
              </div>
              <div className="flex justify-between p-3 rounded-[5px] bg-slate-50 border border-[#cbcbcb]">
                <span className="text-slate-600 font-medium">Estimated Cost of Goods Sold (COGS)</span>
                <span className="font-bold text-slate-700">₹5,18,200</span>
              </div>
              <div className="flex justify-between p-3 rounded-[5px] bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-800">Estimated Net Profit</span>
                <span className="font-black text-emerald-700 text-sm">₹2,10,200 (28.8%)</span>
              </div>
            </div>
          </div>

          {/* Inventory Valuation Report */}
          <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Package className="w-4 h-4 text-[#6d8196]" /> Inventory Stock Valuation
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-3 rounded-[5px] bg-slate-50 border border-[#cbcbcb]">
                <span className="text-slate-600 font-medium">Total Catalog Items</span>
                <span className="font-bold text-[#4a4a4a]">{metrics?.totalProductCount || 14} SKUs</span>
              </div>
              <div className="flex justify-between p-3 rounded-[5px] bg-slate-50 border border-[#cbcbcb]">
                <span className="text-slate-600 font-medium">Stock Purchase Cost Valuation</span>
                <span className="font-bold text-[#4a4a4a]">₹12,85,400</span>
              </div>
              <div className="flex justify-between p-3 rounded-[5px] bg-[#ffffe3] border border-[#cbcbcb]">
                <span className="font-bold text-[#4a4a4a]">Stock Selling Value</span>
                <span className="font-black text-[#6d8196] text-sm">₹17,42,800</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminSecurityGuard>
  );
}
