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
  Download,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import InvoicePrintTemplate from '@/components/InvoicePrintTemplate';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printFormat, setPrintFormat] = useState<'A4' | '80mm' | '58mm'>('A4');

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

  const handlePrint = () => {
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
    <div className="space-y-5 w-full">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-[#cbcbcb] rounded-[5px] shadow-sm">
        <Link
          href="/invoices"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices List
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-48">
            <MaterialSelect
              label="Select Format"
              value={printFormat}
              onChange={(val) => setPrintFormat(val as any)}
              options={[
                { value: 'A4', label: 'A4 GST Tax Invoice (PDF)' },
                { value: '80mm', label: '80mm POS Thermal Bill' },
                { value: '58mm', label: '58mm Mini Thermal Bill' },
              ]}
            />
          </div>

          <button
            onClick={handlePrint}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" /> Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Render Selected Printable Invoice Template */}
      <InvoicePrintTemplate invoice={invoice} settings={settings} format={printFormat} />
    </div>
  );
}
