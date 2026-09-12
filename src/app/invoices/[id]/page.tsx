'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Printer,
  MessageSquare,
  CheckCircle,
  User,
  Phone,
  Layers,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>('80mm');

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <FileText className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading invoice details...
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p>Invoice not found.</p>
        <Link href="/invoices" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  const { invoice, settings } = data;

  const handlePrintThermal = () => {
    window.print();
  };

  const handleWhatsAppShare = async () => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bill',
          customerPhone: invoice.customerPhone,
          customerName: invoice.customerName,
          invoiceNo: invoice.invoiceNo,
          totalAmount: invoice.totalAmount,
          dueAmount: invoice.dueAmount,
        }),
      });
      const resData = await res.json();
      if (resData.whatsappUrl) window.open(resData.whatsappUrl, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Invoices
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-36">
            <MaterialSelect
              value={printerWidth}
              onChange={(val) => setPrinterWidth(val as any)}
              options={[
                { value: '80mm', label: '80mm Thermal' },
                { value: '58mm', label: '58mm Thermal' },
              ]}
            />
          </div>
          <button
            onClick={handlePrintThermal}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
          >
            <Printer className="w-4 h-4" /> Print Thermal Bill
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" /> Share WhatsApp
          </button>
        </div>
      </div>

      {/* Invoice Overview Card & Thermal Printable Paper Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Screen Summary Card */}
        <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Invoice Number</span>
              <h2 className="text-xl font-extrabold text-[#6d8196] font-mono">{invoice.invoiceNo}</h2>
            </div>
            <span className="px-2.5 py-1 rounded-[5px] text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {invoice.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Customer Name:</span>
              <span className="font-bold text-[#4a4a4a]">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Customer Phone:</span>
              <span className="font-mono text-[#4a4a4a]">{invoice.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payment Mode:</span>
              <span className="font-bold text-[#6d8196]">{invoice.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Date:</span>
              <span className="text-[#4a4a4a]">{new Date(invoice.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#cbcbcb] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Subtotal:</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount:</span>
                <span>-₹{invoice.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#4a4a4a] pt-2 border-t border-[#cbcbcb]">
              <span>Total Amount:</span>
              <span>₹{invoice.totalAmount}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Paid Amount:</span>
              <span>₹{invoice.paidAmount}</span>
            </div>
            {invoice.dueAmount > 0 && (
              <div className="flex justify-between font-bold text-amber-700">
                <span>Due Udhar:</span>
                <span>₹{invoice.dueAmount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Thermal Receipt Roll Container (Printable) */}
        <div className="bg-white text-[#4a4a4a] p-5 rounded-[5px] font-mono text-xs shadow-md border border-[#cbcbcb]" id="thermal-receipt-printable">
          <div className="text-center border-b border-dashed border-[#cbcbcb] pb-3 mb-3">
            <h2 className="font-extrabold text-base uppercase">{settings?.shopName || 'VENKATA LAKSHMI ELECTRONICS'}</h2>
            <p className="text-[10px] text-slate-600">{settings?.address}</p>
            <p className="text-[10px] text-slate-600">Ph: {settings?.phone}</p>
          </div>

          <div className="flex justify-between text-[11px] mb-2 font-bold">
            <span>Bill: {invoice.invoiceNo}</span>
            <span>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
          </div>

          <div className="border-b border-dashed border-[#cbcbcb] pb-2 mb-2">
            <p className="font-bold text-[11px]">Customer: {invoice.customerName}</p>
            {invoice.customerPhone !== 'N/A' && <p className="text-[10px]">Ph: {invoice.customerPhone}</p>}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px] mb-3">
            <thead>
              <tr className="border-b border-[#cbcbcb]">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-[#cbcbcb]">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1 pr-1">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-[9px] text-slate-500">[{item.rackLocation}]</div>
                  </td>
                  <td className="py-1 text-center font-bold">{item.quantity} {item.unit}</td>
                  <td className="py-1 text-right font-bold">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-[#4a4a4a] pt-2 space-y-1 text-right text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span>-₹{invoice.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-[#cbcbcb]">
              <span>TOTAL:</span>
              <span>₹{invoice.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid ({invoice.paymentMethod}):</span>
              <span>₹{invoice.paidAmount}</span>
            </div>
            {invoice.dueAmount > 0 && (
              <div className="flex justify-between font-bold text-amber-700">
                <span>Due Balance:</span>
                <span>₹{invoice.dueAmount}</span>
              </div>
            )}
          </div>

          <div className="text-center border-t border-dashed border-[#cbcbcb] mt-4 pt-2 text-[10px] text-slate-600">
            *** THANK YOU FOR YOUR BUSINESS! ***
          </div>
        </div>
      </div>
    </div>
  );
}
