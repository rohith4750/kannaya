'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  MessageSquare,
  Eye,
  Filter,
  CheckCircle,
  X,
  User,
  Calendar,
  DollarSign,
  Layers,
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>('80mm');
  const [shopSettings, setShopSettings] = useState<any>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      let url = '/api/invoices';
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (paymentFilter) params.append('paymentMethod', paymentFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);

      const setRes = await fetch('/api/dashboard');
      const setJson = await setRes.json();
      if (setJson.recentInvoices) {
        setShopSettings({
          shopName: 'SRI LAKSHMI ELECTRICALS & HARDWARE',
          address: 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001',
          phone: '+91 98765 43210',
          gstin: '36ABCDE1234F1Z5',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchQuery, paymentFilter]);

  const handleOpenReceipt = (inv: any) => {
    setSelectedInvoice(inv);
    setShowReceiptModal(true);
  };

  const handlePrintThermal = () => {
    window.print();
  };

  const handleWhatsAppShare = async (inv: any) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bill',
          customerPhone: inv.customerPhone,
          customerName: inv.customerName,
          invoiceNo: inv.invoiceNo,
          totalAmount: inv.totalAmount,
          dueAmount: inv.dueAmount,
        }),
      });
      const data = await res.json();
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalBilledAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalBilledDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Sales Bills & Invoices Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search, reprint thermal receipts, and send WhatsApp bills for all completed transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Billed: </span>
            <span className="font-black text-emerald-400">₹{totalBilledAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Due (Udhar): </span>
            <span className="font-black text-amber-400">₹{totalBilledDue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-2026-001), customer name, or phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 w-full md:w-auto"
        >
          <option value="">All Payment Modes</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI / QR</option>
          <option value="CREDIT">Udhar (Credit)</option>
          <option value="CARD">Card</option>
        </select>
      </div>

      {/* Invoices List Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Due (Udhar)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{inv.invoiceNo}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{inv.customerName}</div>
                      {inv.customerPhone !== 'N/A' && (
                        <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">{inv.items?.length || 1} items</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.dueAmount > 0 ? (
                        <span className="text-amber-400 font-bold">₹{inv.dueAmount.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold">PAID</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReceipt(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                          title="View & Print Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(inv)}
                          className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 transition-colors"
                          title="Share Invoice on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No bills found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* THERMAL PRINT RECEIPT MODAL */}
      {showReceiptModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Bill {selectedInvoice.invoiceNo}
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={printerWidth}
                  onChange={(e) => setPrinterWidth(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-2 py-1 rounded"
                >
                  <option value="80mm">80mm Thermal</option>
                  <option value="58mm">58mm Thermal</option>
                </select>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PREVIEW OF THERMAL RECEIPT */}
            <div className="bg-white text-slate-950 p-4 rounded-xl font-mono text-xs shadow-inner max-h-[380px] overflow-y-auto" id="thermal-receipt-printable">
              <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                <h2 className="font-bold text-sm uppercase">{shopSettings?.shopName || 'SRI LAKSHMI ELECTRICALS'}</h2>
                <p className="text-[10px] text-slate-700">{shopSettings?.address}</p>
                <p className="text-[10px] text-slate-700">Ph: {shopSettings?.phone}</p>
                <p className="text-[10px] font-bold mt-1">GSTIN: {shopSettings?.gstin}</p>
              </div>

              <div className="flex justify-between text-[11px] mb-2">
                <span>Inv: {selectedInvoice.invoiceNo}</span>
                <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-1 mb-2">
                <p className="font-bold text-[11px]">Customer: {selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone !== 'N/A' && (
                  <p className="text-[10px]">Ph: {selectedInvoice.customerPhone}</p>
                )}
              </div>

              <table className="w-full text-left text-[11px] mb-2">
                <thead>
                  <tr className="border-b border-slate-400">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-300">
                  {selectedInvoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-1 pr-1">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-[9px] text-slate-600">[{item.rackLocation}]</div>
                      </td>
                      <td className="py-1 text-center font-bold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-1 text-right font-bold">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-950 pt-2 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                  <span>TOTAL:</span>
                  <span>₹{selectedInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({selectedInvoice.paymentMethod}):</span>
                  <span>₹{selectedInvoice.paidAmount}</span>
                </div>
                {selectedInvoice.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>Due Balance:</span>
                    <span>₹{selectedInvoice.dueAmount}</span>
                  </div>
                )}
              </div>

              <div className="text-center border-t border-dashed border-slate-400 mt-3 pt-2 text-[10px] text-slate-700">
                *** THANK YOU FOR YOUR BUSINESS! ***
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintThermal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => handleWhatsAppShare(selectedInvoice)}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
