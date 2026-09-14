'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  MessageSquare,
  History,
  CheckCircle,
  FileText,
  AlertCircle,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
  Printer,
  Package,
  X,
  ExternalLink,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import InvoicePrintTemplate from '@/components/InvoicePrintTemplate';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itemized' | 'ledger' | 'invoices'>('itemized');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');

  // PDF Bill Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [printerWidth, setPrinterWidth] = useState<'A4' | '80mm' | '58mm'>('A4');
  const [shopSettings, setShopSettings] = useState<any>(null);

  const handleOpenReceipt = (inv: any) => {
    setSelectedInvoice(inv);
    setShowReceiptModal(true);
  };

  const loadCustomerData = async () => {
    try {
      const [res, settingsRes] = await Promise.all([
        fetch(`/api/customers/${id}/ledger`),
        fetch('/api/settings'),
      ]);
      const data = await res.json();
      const settingsData = await settingsRes.json();
      setCustomer(data);
      if (settingsData) setShopSettings(settingsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          customerId: id,
          amount: payAmount,
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayAmount('');
        setPayNotes('');
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsAppReminder = async () => {
    if (!customer) return;
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reminder',
          customerPhone: customer.phone,
          customerName: customer.name,
          dueAmount: customer.outstanding,
        }),
      });
      const data = await res.json();
      if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const [sendingAlert, setSendingAlert] = useState(false);

  const handleSendSmtpAlert = async () => {
    if (!customer) return;
    setSendingAlert(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-alert',
          customerId: customer.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message || 'SMTP Alert email sent successfully!'}`);
      } else {
        alert(`⚠️ Alert failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error sending SMTP email: ${e.message}`);
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Users className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading customer account details...
      </div>
    );
  }

  if (!customer || customer.error) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p>Customer account not found.</p>
        <Link href="/customers" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  // Group Invoices by Date (Today, Yesterday, Date)
  const groupInvoicesByDate = () => {
    if (!customer.invoices) return {};
    const groups: { [dateStr: string]: any[] } = {};

    const todayStr = new Date().toLocaleDateString('en-IN');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');

    customer.invoices.forEach((inv: any) => {
      const d = new Date(inv.createdAt);
      const invDateStr = d.toLocaleDateString('en-IN');
      let displayKey = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (invDateStr === todayStr) {
        displayKey = `Today (${displayKey})`;
      } else if (invDateStr === yesterdayStr) {
        displayKey = `Yesterday (${displayKey})`;
      }

      if (!groups[displayKey]) groups[displayKey] = [];
      groups[displayKey].push(inv);
    });

    return groups;
  };

  const invoiceGroups = groupInvoicesByDate();

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/customers"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Accounts
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Print Statement
          </button>

          {customer.outstanding > 0 && (
            <>
              <button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <DollarSign className="w-4 h-4" /> Clear Credit Payment
              </button>
              <button
                onClick={handleWhatsAppReminder}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Reminder
              </button>
              <button
                onClick={handleSendSmtpAlert}
                disabled={sendingAlert}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                title="Send Credit Limit Alert Email via SMTP"
              >
                <Mail className="w-4 h-4" />
                {sendingAlert ? 'Sending SMTP Alert...' : 'Send SMTP Email Alert'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Credit Limit Warning Alert Banner */}
      {customer.outstanding > customer.creditLimit && (
        <div className="bg-red-50 border-2 border-red-300 rounded-[5px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-red-950">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-[5px] border border-red-300">
              <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-red-800">
                🚨 Credit Limit Exceeded Warning!
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                Current dues (₹{customer.outstanding.toLocaleString('en-IN')}) exceed maximum allowed credit limit (₹{customer.creditLimit.toLocaleString('en-IN')}) by <span className="font-black text-red-900 underline">₹{(customer.outstanding - customer.creditLimit).toLocaleString('en-IN')}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={handleSendSmtpAlert}
            disabled={sendingAlert}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 border border-red-400 disabled:opacity-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {sendingAlert ? 'Sending Email...' : 'Dispatch Alert Email Now'}
          </button>
        </div>
      )}

      {/* Customer Overview Card */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#cbcbcb] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{customer.name}</h1>
              {customer.outstanding > customer.creditLimit ? (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" /> Credit Limit Exceeded
                </span>
              ) : customer.outstanding > 0 ? (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Credit Due
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Clear
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.email}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {customer.address}
                </span>
              )}
            </div>
          </div>

          <div className={`${customer.outstanding > customer.creditLimit ? 'bg-red-50 border-red-300' : 'bg-[#ffffe3] border-[#cbcbcb]'} p-4 rounded-[5px] border min-w-[220px] text-right shadow-sm`}>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Current Outstanding Balance</span>
            <div className={`text-3xl font-black ${customer.outstanding > customer.creditLimit ? 'text-red-700' : customer.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              ₹{customer.outstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">
              Credit Limit: ₹{customer.creditLimit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Lifetime Purchases</span>
            <div className="text-xl font-extrabold text-[#4a4a4a]">₹{customer.totalPurchases.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Paid Amount</span>
            <div className="text-xl font-extrabold text-emerald-700">₹{customer.totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Invoices Issued</span>
            <div className="text-xl font-extrabold text-[#6d8196]">{customer.invoices?.length || 0} Bills</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#cbcbcb] bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('itemized')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r border-[#cbcbcb] transition-colors ${
              activeTab === 'itemized'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#6d8196]" /> Daily Itemized Purchase Breakdown
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r border-[#cbcbcb] transition-colors ${
              activeTab === 'ledger'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <History className="w-4 h-4 text-[#6d8196]" /> Financial Ledger & Payments
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'invoices'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#6d8196]" /> Invoices List ({customer.invoices?.length || 0})
          </button>
        </div>

        {/* TAB 1: DAILY ITEMIZED PURCHASE BREAKDOWN */}
        {activeTab === 'itemized' && (
          <div className="p-4 space-y-4 text-xs">
            {Object.keys(invoiceGroups).length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium">
                No purchase history or bills recorded for this customer yet.
              </div>
            ) : (
              Object.entries(invoiceGroups).map(([dateLabel, invs]) => (
                <div key={dateLabel} className="border border-[#cbcbcb] rounded-[5px] overflow-hidden bg-white">
                  {/* Date Section Header */}
                  <div className="bg-[#4a4a4a] text-white px-3.5 py-2 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#ffffe3]" />
                      <span>{dateLabel}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#ffffe3]">
                      {invs.length} Bill{invs.length > 1 ? 's' : ''} • Total Day Purchase: ₹
                      {invs.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Bills under Date */}
                  <div className="divide-y divide-slate-200">
                    {invs.map((inv: any) => {
                      const isExpanded = expandedInvoiceId === inv.id;
                      return (
                        <div key={inv.id} className="p-3.5 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 font-bold text-[#4a4a4a] text-xs">
                                <Link
                                  href={`/invoices/${inv.id}`}
                                  className="text-[#6d8196] hover:underline font-mono"
                                >
                                  Invoice #{inv.invoiceNo}
                                </Link>
                                <span className="text-slate-400">•</span>
                                <span>{new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  {inv.paymentMethod}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Items Count: {inv.items?.length || 0} product(s)
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-extrabold text-sm text-[#4a4a4a]">
                                  ₹{inv.totalAmount.toLocaleString('en-IN')}
                                </div>
                                {inv.dueAmount > 0 ? (
                                  <span className="text-[10px] text-amber-700 font-bold block">
                                    Added to Credit: ₹{inv.dueAmount.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-bold block">
                                    Paid Fully
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleOpenReceipt(inv)}
                                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-2.5 py-1 rounded-[5px] text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                                title="View & Print PDF / Thermal Bill"
                              >
                                <FileText className="w-3.5 h-3.5" /> PDF Bill
                              </button>

                              <button
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-[5px] border border-[#cbcbcb]"
                                title="Toggle Items List"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Items Table for this Invoice */}
                          <div className="bg-slate-50 rounded-[5px] border border-[#cbcbcb] p-2.5 overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse">
                              <thead>
                                <tr className="border-b border-[#cbcbcb] text-slate-500 font-bold uppercase text-[9px]">
                                  <th className="pb-1 px-2 text-left">Item / Product Name</th>
                                  <th className="pb-1 px-2 text-right">Unit Price</th>
                                  <th className="pb-1 px-2 text-center">Qty</th>
                                  <th className="pb-1 px-2 text-right">Total Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {inv.items?.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="py-1.5 px-2 text-left font-bold text-[#4a4a4a]">
                                      <div className="flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-[#6d8196] shrink-0" />
                                        <span>{item.productName}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 text-right text-slate-600 font-mono">
                                      ₹{item.price.toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-bold text-slate-800">
                                      {item.quantity} {item.unit}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-extrabold text-slate-900 font-mono">
                                      ₹{item.total.toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: FINANCIAL LEDGER & PAYMENTS */}
        {activeTab === 'ledger' && (
          <div className="p-4 space-y-3 text-xs">
            {customer.ledger?.length > 0 ? (
              customer.ledger.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-[5px] border flex items-center justify-between text-xs ${
                    entry.type === 'SALE' ? 'bg-[#ffffe3] border-[#cbcbcb]' : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                          entry.type === 'SALE' ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="font-bold text-[#4a4a4a]">{entry.notes}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(entry.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-extrabold text-base ${
                        entry.type === 'SALE' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {entry.type === 'SALE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Running Balance: ₹{entry.balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No ledger entries recorded yet.</p>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES LIST */}
        {activeTab === 'invoices' && (
          <div className="p-4 text-xs">
            {customer.invoices?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#4a4a4a] text-white font-semibold text-[11px]">
                      <th className="py-2.5 px-3 text-left">Invoice No</th>
                      <th className="py-2.5 px-3 text-left">Date</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3 text-right">Due Amount</th>
                      <th className="py-2.5 px-3 text-center">Payment Mode</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {customer.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-left font-bold text-[#6d8196] font-mono">{inv.invoiceNo}</td>
                        <td className="py-2.5 px-3 text-left text-slate-600">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-[#4a4a4a]">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-700">₹{inv.dueAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReceipt(inv)}
                              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-2.5 py-1 rounded-[5px] text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                              title="Open & Print A4 GST PDF Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF Bill
                            </button>
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-[5px] border border-[#cbcbcb] text-[11px] font-bold"
                              title="Open Full Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No invoices generated for this customer.</p>
            )}
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Record Credit Payment
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={customer.outstanding}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${customer.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-emerald-700 font-bold text-lg focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <MaterialSelect
                  label="Payment Method"
                  value={payMethod}
                  onChange={(val) => setPayMethod(val)}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                    { value: 'CARD', label: 'Bank Transfer / Card' },
                  ]}
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Receipt Ref</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received via PhonePe"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-[5px] font-bold"
                >
                  Clear Credit Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT / VIEW RECEIPT MODAL */}
      {showReceiptModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6d8196]" /> Invoice #{selectedInvoice.invoiceNo} - {selectedInvoice.customerName || customer.name}
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

            <div className="flex-1 bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] overflow-y-auto min-h-0">
              <InvoicePrintTemplate
                invoice={{
                  ...selectedInvoice,
                  customerName: selectedInvoice.customerName || customer.name,
                  customerPhone: selectedInvoice.customerPhone || customer.phone,
                  customerAddress: selectedInvoice.customerAddress || customer.address,
                }}
                settings={shopSettings}
                format={printerWidth as any}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
