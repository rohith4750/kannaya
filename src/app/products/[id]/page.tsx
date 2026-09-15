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
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Package className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading product details...
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p>Product not found.</p>
        <Link href="/products" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isLowStock = product.stockQuantity <= product.minStockAlert;

  return (
    <div className="space-y-5 w-full">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>

        {/* <div className="flex items-center gap-2">
          <Link
            href="/barcode"
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white border border-[#cbcbcb]/40 px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Barcode className="w-4 h-4 text-[#ffffe3]" /> Print Barcode Label
          </Link>
        </div> */}
      </div>

      {/* Main Product Specs Card */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#cbcbcb] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/30 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
              </span>
              <span className="text-xs font-bold text-[#4a4a4a]">{product.brand?.name}</span>
              <span className="text-xs text-slate-500">| {product.category?.name}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{product.name}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-2">
              <span>HSN: <strong className="text-[#4a4a4a]">{product.hsnCode || '8544'}</strong></span>
              <span>GST: <strong className="text-[#4a4a4a]">{product.gstPercent || 18}%</strong></span>
            </div>
          </div>

          <div className="bg-[#ffffe3] p-4 rounded-[5px] border border-[#cbcbcb] min-w-[200px] text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Retail Selling Price</span>
            <div className="text-3xl font-black text-emerald-700">₹{product.sellingPrice}</div>
            {product.wholesalePrice && (
              <div className="text-xs text-amber-700 font-bold mt-1">
                Wholesale: ₹{product.wholesalePrice} (Min Qty: {product.minWholesaleQty || 10})
              </div>
            )}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Current Stock Level</span>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-extrabold ${isLowStock ? 'text-rose-600' : 'text-[#4a4a4a]'}`}>
                {product.stockQuantity} {product.unit}
              </span>
              {isLowStock && (
                <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Min Alert Level: {product.minStockAlert} {product.unit}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Warranty & Guarantee</span>
            <div className="font-bold text-[#4a4a4a] text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {product.warranty || 'Standard Manufacturer Warranty'}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Authorized Dealer Guarantee</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Purchase Cost</span>
            <div className="text-xl font-mono font-bold text-[#4a4a4a]">₹{product.purchasePrice}</div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
              Profit Margin: ₹{(product.sellingPrice - product.purchasePrice).toFixed(2)} ({(((product.sellingPrice - product.purchasePrice)/product.purchasePrice)*100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Technical Description */}
        {product.description && (
          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Technical Notes & Specifications</span>
            <p className="text-[#4a4a4a] leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>

      {/* Sales History Table for this Product */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
          <TrendingUp className="w-4 h-4 text-[#6d8196]" /> Recent Customer Sales History
        </h3>

        <div className="overflow-x-auto rounded-[5px] border border-[#cbcbcb]">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Quantity Sold</th>
                <th>Unit Price</th>
                <th>Total Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {product.invoiceItems && product.invoiceItems.length > 0 ? (
                product.invoiceItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-mono font-bold text-[#6d8196]">
                      <Link href={`/invoices/${item.invoiceId}`} className="hover:underline">
                        {item.invoice?.invoiceNo || 'INV-2026'}
                      </Link>
                    </td>
                    <td className="font-bold text-[#4a4a4a]">{item.invoice?.customerName || 'Walk-in Customer'}</td>
                    <td className="font-bold text-emerald-700">{item.quantity} {item.unit}</td>
                    <td className="font-mono">₹{item.price}</td>
                    <td className="font-bold text-[#4a4a4a]">₹{item.total}</td>
                    <td className="text-slate-500">
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
