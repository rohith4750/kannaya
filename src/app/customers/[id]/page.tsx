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
} from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');

  const loadCustomerData = async () => {
    try {
      const res = await fetch(`/api/customers/${id}/ledger`);
      const data = await res.json();
      setCustomer(data);
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

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Udhar Accounts
        </Link>

        <div className="flex items-center gap-2">
          {customer.outstanding > 0 && (
            <>
              <button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <DollarSign className="w-4 h-4" /> Clear Udhar Payment
              </button>
              <button
                onClick={handleWhatsAppReminder}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
              >
                <MessageSquare className="w-4 h-4" /> Send WhatsApp Reminder
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Overview Card */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#cbcbcb] pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1 font-medium"><Phone className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1 font-medium"><Mail className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5 text-emerald-700" /> {customer.address}</span>}
            </div>
          </div>

          <div className="bg-[#ffffe3] p-4 rounded-[5px] border border-[#cbcbcb] min-w-[220px] text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Outstanding Udhar Balance</span>
            <div className={`text-3xl font-black ${customer.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              ₹{customer.outstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Credit Limit: ₹{customer.creditLimit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Lifetime Purchases</span>
            <div className="text-2xl font-extrabold text-[#4a4a4a]">₹{customer.totalPurchases.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Paid Amount</span>
            <div className="text-2xl font-extrabold text-emerald-700">₹{customer.totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Invoices Count</span>
            <div className="text-2xl font-extrabold text-[#6d8196]">{customer.invoices?.length || 0} Bills</div>
          </div>
        </div>
      </div>

      {/* Customer Chronological Ledger Statement Table */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
          <History className="w-4 h-4 text-[#6d8196]" /> Complete Account Ledger Statement
        </h3>

        <div className="space-y-2.5">
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
                  <div className={`font-extrabold text-base ${entry.type === 'SALE' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {entry.type === 'SALE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Balance: ₹{entry.balance.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No ledger entries found for this customer.</p>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Record Udhar Payment
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
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Bank Transfer / Card</option>
                </select>
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
                  Clear Udhar Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
