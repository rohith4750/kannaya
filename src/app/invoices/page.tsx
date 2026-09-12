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
import MaterialSelect from '@/components/MaterialSelect';

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

      setShopSettings({
        shopName: 'SRI LAKSHMI ELECTRICALS & HARDWARE',
        address: 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001',
        phone: '+91 98765 43210',
        gstin: '36ABCDE1234F1Z5',
      });
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
    <div className="space-y-4">
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Sales Bills & Invoices Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, search, reprint thermal receipts, and send WhatsApp bills for all completed transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-[5px] text-xs">
            <span className="text-slate-600">Total Billed: </span>
            <span className="font-extrabold text-emerald-700">₹{totalBilledAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-[5px] text-xs">
            <span className="text-slate-600">Total Due (Udhar): </span>
            <span className="font-extrabold text-amber-700">₹{totalBilledDue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-300 p-3 rounded-[5px] flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-2026-001), customer name, or phone..."
            className="w-full bg-slate-50 border border-slate-300 rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <MaterialSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          options={[
            { value: '', label: 'All Payment Modes' },
            { value: 'CASH', label: 'Cash' },
            { value: 'UPI', label: 'UPI / QR' },
            { value: 'CREDIT', label: 'Udhar (Credit)' },
            { value: 'CARD', label: 'Card' },
          ]}
          className="w-48"
        />
      </div>

      {/* Invoices Compact Table */}
      <div className="bg-white border border-slate-300 rounded-[5px] overflow-hidden shadow-sm max-h-[calc(100vh-14rem)] overflow-y-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer Details</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Mode</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Due (Udhar)</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono font-bold text-blue-700">{inv.invoiceNo}</td>
                  <td>
                    <div className="font-bold text-slate-900">{inv.customerName}</div>
                    {inv.customerPhone !== 'N/A' && (
                      <div className="text-[10px] text-slate-500">{inv.customerPhone}</div>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="text-slate-700 font-semibold">{inv.items?.length || 1} items</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="font-bold text-emerald-700 text-xs">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="text-slate-700 font-semibold">
                    ₹{inv.paidAmount.toLocaleString('en-IN')}
                  </td>
                  <td>
                    {inv.dueAmount > 0 ? (
                      <span className="text-amber-700 font-bold">₹{inv.dueAmount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-slate-400 font-semibold">PAID</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenReceipt(inv)}
                        className="p-1 rounded-[5px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-700 transition-colors border border-slate-200"
                        title="View & Print Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppShare(inv)}
                        className="p-1 rounded-[5px] bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors"
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
                <td colSpan={9} className="py-6 text-center text-slate-500">
                  No bills found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* THERMAL PRINT RECEIPT MODAL */}
      {showReceiptModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Bill {selectedInvoice.invoiceNo}
              </h3>
              <div className="flex items-center gap-2">
                <MaterialSelect
                  value={printerWidth}
                  onChange={(val: any) => setPrinterWidth(val)}
                  options={[
                    { value: '80mm', label: '80mm Thermal' },
                    { value: '58mm', label: '58mm Thermal' },
                  ]}
                  className="w-32"
                />
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white text-slate-950 p-4 rounded-[5px] font-mono text-xs shadow-inner max-h-[380px] overflow-y-auto" id="thermal-receipt-printable">
              <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                <h2 className="font-bold text-sm uppercase">{shopSettings?.shopName || 'SRI LAKSHMI ELECTRICALS'}</h2>
                <p className="text-[10px] text-slate-700">{shopSettings?.address}</p>
                <p className="text-[10px] text-slate-700">Ph: {shopSettings?.phone}</p>
                <p className="text-[10px] font-bold mt-1">GSTIN: {shopSettings?.gstin}</p>
              </div>

              <div className="flex justify-between text-[11px] mb-2 font-bold">
                <span>Inv: {selectedInvoice.invoiceNo}</span>
                <span>{new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => handleWhatsAppShare(selectedInvoice)}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors"
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
