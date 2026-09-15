'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  MessageSquare,
  History as HistoryIcon,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  Package,
  FileText,
  ExternalLink,
  Mail,
  Pencil,
  Trash2,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [payModalCustomer, setPayModalCustomer] = useState<any>(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState<any>(null);
  const [customerLedgerData, setCustomerLedgerData] = useState<any>(null);

  // Edit Customer Form & Modal
  const [editModalCustomer, setEditModalCustomer] = useState<any>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustCreditLimit, setEditCustCreditLimit] = useState('');
  const [updatingCust, setUpdatingCust] = useState(false);

  // Delete Customer Modal
  const [deleteModalCustomer, setDeleteModalCustomer] = useState<any>(null);
  const [deletingCust, setDeletingCust] = useState(false);

  const handleOpenEditModal = (c: any) => {
    setEditModalCustomer(c);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '');
    setEditCustEmail(c.email || '');
    setEditCustAddress(c.address || '');
    setEditCustCreditLimit(c.creditLimit ? String(c.creditLimit) : '50000');
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalCustomer) return;
    setUpdatingCust(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModalCustomer.id,
          name: editCustName,
          phone: editCustPhone,
          email: editCustEmail,
          address: editCustAddress,
          creditLimit: editCustCreditLimit,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditModalCustomer(null);
        loadCustomers();
      } else {
        alert(`❌ Error updating customer: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error: ${e.message}`);
    } finally {
      setUpdatingCust(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteModalCustomer) return;
    setDeletingCust(true);
    try {
      const res = await fetch(`/api/customers?id=${deleteModalCustomer.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteModalCustomer(null);
        loadCustomers();
      } else {
        alert(`❌ Error deleting customer: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error: ${e.message}`);
    } finally {
      setDeletingCust(false);
    }
  };

  // Add Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('50000');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone,
          email: newCustEmail,
          address: newCustAddress,
          creditLimit: newCustCreditLimit,
        }),
      });
      if (res.ok) {
        setShowAddCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustAddress('');
        loadCustomers();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Udhar Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalCustomer || !paymentAmount) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          customerId: payModalCustomer.id,
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes,
        }),
      });
      if (res.ok) {
        setPayModalCustomer(null);
        setPaymentAmount('');
        setPaymentNotes('');
        loadCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Customer Ledger
  const handleOpenLedger = async (customer: any) => {
    setLedgerModalCustomer(customer);
    try {
      const res = await fetch(`/api/customers/${customer.id}/ledger`);
      const data = await res.json();
      setCustomerLedgerData(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Send WhatsApp Payment Reminder
  const handleSendWhatsAppReminder = async (customer: any) => {
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
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  const handleSendSmtpAlert = async (customer: any) => {
    setSendingAlertId(customer.id);
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
        alert(`✅ ${data.message || 'SMTP Email alert sent successfully!'}`);
      } else {
        alert(`⚠️ Could not send alert: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error sending SMTP email: ${e.message}`);
    } finally {
      setSendingAlertId(null);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalOutstandingAll = customers.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <div className="space-y-4">
      {/* Consolidated Top Header & Filter Card */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-[#cbcbcb] bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#6d8196]" />
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a]">Customer Credit Accounts & Ledger</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Track customer accounts, outstanding dues, payment histories, and WhatsApp reminders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-[5px] text-xs">
              <span className="text-slate-600 font-medium">Total Credit Due: </span>
              <span className="font-semibold text-amber-700">₹{totalOutstandingAll.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold px-3 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Customer
            </button>
          </div>
        </div>

        {/* Compact Search Bar */}
        <div className="p-2.5 bg-white">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or phone number..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCustomers.map((c) => {
          const isOverLimit = c.outstanding > c.creditLimit;
          return (
            <div key={c.id} className={`bg-white p-4 rounded-[5px] border shadow-sm flex flex-col justify-between transition-all ${isOverLimit ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-blue-500'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{c.name}</h3>
                  {isOverLimit ? (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" /> Limit Exceeded
                    </span>
                  ) : c.outstanding > 0 ? (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Credit Due
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Clear
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-blue-700" /> {c.phone}
                </div>
                {c.address && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{c.address}</p>}

                {/* Exceeded Warning Alert Banner */}
                {isOverLimit && (
                  <div className="mt-2.5 bg-red-50 border border-red-200 rounded-[5px] p-2 flex items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-red-800 leading-tight">
                      <span className="font-bold">🚨 Alert:</span> Limit ₹{c.creditLimit.toLocaleString('en-IN')} exceeded by <span className="font-extrabold text-red-700">₹{(c.outstanding - c.creditLimit).toLocaleString('en-IN')}</span>!
                    </div>
                    <button
                      onClick={() => handleSendSmtpAlert(c)}
                      disabled={sendingAlertId === c.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-[4px] flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50 shrink-0"
                      title="Send SMTP Email Alert to Admin/Customer"
                    >
                      <Mail className="w-3 h-3" />
                      {sendingAlertId === c.id ? 'Sending...' : 'Mail Alert'}
                    </button>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                    <div className="font-bold text-slate-900">₹{c.totalPurchases.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-slate-400">Limit: ₹{c.creditLimit.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Outstanding Due</span>
                    <div className={`font-black text-sm ${isOverLimit ? 'text-red-700' : c.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ₹{c.outstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-1.5">
                <Link
                  href={`/customers/${c.id}`}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold py-1.5 px-2 rounded-[5px] text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                  title="View Daily Itemized Purchase Statement"
                >
                  <FileText className="w-3.5 h-3.5 text-[#6d8196]" /> Items & Ledger
                </Link>

                <button
                  onClick={() => setPayModalCustomer(c)}
                  disabled={c.outstanding <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-[5px] text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Clear Payment
                </button>

                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 p-1.5 rounded-[5px] text-xs transition-colors shrink-0"
                  title="Edit Customer Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteModalCustomer(c)}
                  className="bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 p-1.5 rounded-[5px] text-xs transition-colors shrink-0"
                  title="Delete Customer Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {c.outstanding > 0 && (
                  <>
                    <button
                      onClick={() => handleSendWhatsAppReminder(c)}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 p-1.5 rounded-[5px] text-xs"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSendSmtpAlert(c)}
                      disabled={sendingAlertId === c.id}
                      className="bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 p-1.5 rounded-[5px] text-xs disabled:opacity-50"
                      title="Send SMTP Credit Email Alert"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Users className="w-4 h-4 text-[#6d8196]" /> Register Customer Account
            </h3>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / Electrician"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={(e) => setNewCustCreditLimit(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Address / Site Location</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Market Road, Phase 2 Site"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-4 h-4 text-emerald-700" /> Record Credit Payment
            </h3>

            <div className="bg-[#ffffe3] p-2.5 rounded-[5px] border border-[#cbcbcb] text-xs">
              <div className="font-bold text-[#4a4a4a]">{payModalCustomer.name}</div>
              <div className="text-amber-700 font-bold mt-0.5">
                Current Outstanding Balance: ₹{payModalCustomer.outstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={payModalCustomer.outstanding}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ₹${payModalCustomer.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-emerald-700 font-bold text-base focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div>
                <MaterialSelect
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val)}
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
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via GPay for INV-2026-001"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Clear Credit Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER HISTORY MODAL */}
      {ledgerModalCustomer && customerLedgerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-2xl w-full p-5 space-y-3 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Itemized Statement & Ledger</h3>
                <p className="text-xs text-slate-500">{customerLedgerData.name} ({customerLedgerData.phone})</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/customers/${customerLedgerData.id}`}
                  className="text-xs bg-[#6d8196] hover:bg-[#5b6f84] text-white px-2.5 py-1 rounded-[5px] font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Statement Page
                </Link>
                <button onClick={() => setLedgerModalCustomer(null)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {customerLedgerData.ledger?.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-[5px] border space-y-2 text-xs ${
                    entry.type === 'SALE'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                            entry.type === 'SALE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {entry.type}
                        </span>
                        <span className="font-bold text-slate-900">{entry.notes}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Date: {new Date(entry.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black text-sm ${
                          entry.type === 'SALE' ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {entry.type === 'SALE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Balance: ₹{entry.balance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Itemized Items Breakdown if Invoice exists */}
                  {entry.invoice?.items && entry.invoice.items.length > 0 && (
                    <div className="bg-white rounded-[5px] border border-amber-200 p-2 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                        <span>Items Purchased in this Bill:</span>
                        <Link
                          href={`/invoices/${entry.invoice.id}`}
                          className="text-[#6d8196] font-bold text-[10px] flex items-center gap-1 hover:underline normal-case"
                        >
                          <FileText className="w-3 h-3" /> Open PDF Bill
                        </Link>
                      </div>
                      <div className="space-y-1">
                        {entry.invoice.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-slate-700">
                            <span className="font-semibold flex items-center gap-1">
                              <Package className="w-3 h-3 text-[#6d8196]" /> {item.productName} ({item.quantity} {item.unit})
                            </span>
                            <span className="font-mono font-bold text-slate-900">₹{item.total.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Pencil className="w-4 h-4 text-[#6d8196]" /> Edit Customer Account
            </h3>

            <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={editCustCreditLimit}
                    onChange={(e) => setEditCustCreditLimit(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Email Address</label>
                <input
                  type="email"
                  value={editCustEmail}
                  onChange={(e) => setEditCustEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Address / Site Location</label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalCustomer(null)}
                  className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCust}
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm disabled:opacity-50"
                >
                  {updatingCust ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {deleteModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Trash2 className="w-4 h-4 text-red-600" /> Confirm Customer Deletion
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-[5px] p-3 text-xs text-red-900 space-y-1">
              <p className="font-bold">Are you sure you want to delete this customer account?</p>
              <p className="font-semibold text-[#4a4a4a]">Name: <span className="font-bold text-slate-900">{deleteModalCustomer.name}</span></p>
              <p className="font-semibold text-[#4a4a4a]">Phone: <span className="font-mono text-slate-900">{deleteModalCustomer.phone}</span></p>
              {deleteModalCustomer.outstanding > 0 && (
                <p className="text-amber-800 font-extrabold mt-1">
                  ⚠️ Warning: This customer has an outstanding balance of ₹{deleteModalCustomer.outstanding.toLocaleString('en-IN')}.
                </p>
              )}
              <p className="text-[11px] text-slate-500 pt-1">
                This action will remove the customer profile and their ledger history. Existing generated invoices will be preserved.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteModalCustomer(null)}
                className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deletingCust}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-[5px] font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {deletingCust ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
