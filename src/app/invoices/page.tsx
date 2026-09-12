'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ExternalLink,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import InvoicePrintTemplate from '@/components/InvoicePrintTemplate';

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
        shopName: 'VENKATA LAKSHMI ELECTRONICS',
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Consolidated Sales Bills Card */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm flex flex-col h-full overflow-hidden">
        {/* Unified Table Top Header */}
        <div className="p-3.5 border-b border-[#cbcbcb] bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#6d8196]" />
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a]">Sales Bills & Invoices Directory</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Browse, search, reprint thermal receipts, and send WhatsApp bills for all completed transactions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-[5px] text-xs">
              <span className="text-slate-600 font-medium">Total Billed: </span>
              <span className="font-semibold text-emerald-700">₹{totalBilledAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-[5px] text-xs">
              <span className="text-slate-600 font-medium">Total Credit Due: </span>
              <span className="font-semibold text-amber-700">₹{totalBilledDue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Unified Compact Filter Toolbar */}
        <div className="px-3.5 py-2 border-b border-[#cbcbcb] bg-white flex flex-col md:flex-row gap-2.5 items-center justify-between shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number, customer name, or phone..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white"
            />
          </div>

          <MaterialSelect
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={[
              { value: '', label: 'All Payment Modes' },
              { value: 'CASH', label: 'Cash' },
              { value: 'UPI', label: 'UPI / QR' },
              { value: 'CREDIT', label: 'Credit Account' },
              { value: 'CARD', label: 'Card' },
            ]}
            className="w-48"
          />
        </div>

        {/* Integrated ERP Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
                <th>Credit Due</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono font-semibold text-[#6d8196]">{inv.invoiceNo}</td>
                    <td>
                      <div className="font-semibold text-[#4a4a4a] text-xs">{inv.customerName}</div>
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
                    <td className="text-slate-700 font-medium">{inv.items?.length || 1} items</td>
                    <td>
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="font-mono font-semibold text-[#4a4a4a] text-xs">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="font-mono text-slate-700 font-medium">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {inv.dueAmount > 0 ? (
                        <span className="text-amber-700 font-semibold">₹{inv.dueAmount.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">PAID</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-2.5 py-1 rounded-[5px] text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                          title="Open & Print A4 GST PDF Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF Bill
                        </Link>
                        <button
                          onClick={() => handleOpenReceipt(inv)}
                          className="p-1.5 rounded-[5px] bg-slate-100 hover:bg-amber-100 text-[#4a4a4a] hover:text-amber-700 transition-colors border border-[#cbcbcb]"
                          title="View & Print Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(inv)}
                          className="p-1.5 rounded-[5px] bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors"
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
                <div className="w-48">
                  <MaterialSelect
                    value={printerWidth}
                    onChange={(val: any) => setPrinterWidth(val)}
                    options={[
                      { value: 'A4', label: 'A4 GST Tax Invoice (PDF)' },
                      { value: '80mm', label: '80mm Thermal' },
                      { value: '58mm', label: '58mm Thermal' },
                    ]}
                  />
                </div>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] max-h-[440px] overflow-y-auto">
              <InvoicePrintTemplate
                invoice={selectedInvoice}
                settings={shopSettings}
                format={printerWidth as any}
              />
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
