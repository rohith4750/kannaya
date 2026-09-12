'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Tag,
  Layers,
  ShieldCheck,
  Barcode,
  TrendingUp,
  Edit2,
  Printer,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <Package className="w-4 h-4 animate-spin text-amber-400" /> Loading product details...
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <p>Product not found.</p>
        <Link href="/products" className="text-amber-400 hover:underline mt-2 inline-block font-bold">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isLowStock = product.stockQuantity <= product.minStockAlert;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/barcode"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Barcode className="w-4 h-4 text-blue-400" /> Print Barcode Label
          </Link>
        </div>
      </div>

      {/* Main Product Specs Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
              </span>
              <span className="text-xs font-bold text-slate-300">{product.brand?.name}</span>
              <span className="text-xs text-slate-500">| {product.category?.name}</span>
            </div>
            <h1 className="text-2xl font-black text-white">{product.name}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-2">
              <span>Barcode: <strong className="text-amber-400">{product.barcode}</strong></span>
              {product.sku && <span>SKU: <strong className="text-slate-300">{product.sku}</strong></span>}
              <span>HSN: <strong className="text-slate-300">{product.hsnCode || '8544'}</strong></span>
              <span>GST: <strong className="text-slate-300">{product.gstPercent || 18}%</strong></span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[200px] text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Retail Selling Price</span>
            <div className="text-3xl font-black text-emerald-400">₹{product.sellingPrice}</div>
            {product.wholesalePrice && (
              <div className="text-xs text-amber-400 font-semibold mt-1">
                Wholesale: ₹{product.wholesalePrice} (Min Qty: {product.minWholesaleQty || 10})
              </div>
            )}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">Current Stock Level</span>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                {product.stockQuantity} {product.unit}
              </span>
              {isLowStock && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Min Alert Level: {product.minStockAlert} {product.unit}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">Warranty & Guarantee</span>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {product.warranty || 'Standard Manufacturer Warranty'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Authorized Dealer Guarantee</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">Purchase Cost</span>
            <div className="text-xl font-mono text-slate-300">₹{product.purchasePrice}</div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
              Profit Margin: ₹{(product.sellingPrice - product.purchasePrice).toFixed(2)} ({(((product.sellingPrice - product.purchasePrice)/product.purchasePrice)*100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Technical Description */}
        {product.description && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">Technical Notes & Specifications</span>
            <p className="text-slate-300 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>

      {/* Sales History Table for this Product */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Recent Customer Sales History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Quantity Sold</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {product.invoiceItems && product.invoiceItems.length > 0 ? (
                product.invoiceItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      <Link href={`/invoices/${item.invoiceId}`} className="hover:underline">
                        {item.invoice?.invoiceNo || 'INV-2026'}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{item.invoice?.customerName || 'Walk-in Customer'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 font-mono">₹{item.price}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{item.total}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(item.invoice?.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No recent sales transactions logged for this product.
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
