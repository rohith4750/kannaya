'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  MessageSquare,
  History,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [payModalCustomer, setPayModalCustomer] = useState<any>(null);
  const [ledgerModalCustomer, setLedgerModalCustomer] = useState<any>(null);
  const [customerLedgerData, setCustomerLedgerData] = useState<any>(null);

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

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalOutstandingAll = customers.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Customer Credit (Udhar) & Ledger Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer accounts, outstanding dues, payment histories, and WhatsApp reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Udhar Due: </span>
            <span className="font-black text-amber-400">₹{totalOutstandingAll.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const isOverLimit = c.outstanding >= c.creditLimit;
          return (
            <div key={c.id} className="glass-panel p-5 rounded-2xl glass-panel-hover border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white truncate">{c.name}</h3>
                  {c.outstanding > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Udhar Due
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Clear
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-amber-400" /> {c.phone}
                </div>
                {c.address && <p className="text-[11px] text-slate-500 mt-1 truncate">{c.address}</p>}

                {/* Financial Summary */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                    <div className="font-bold text-white">₹{c.totalPurchases.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Outstanding Due</span>
                    <div className={`font-black text-sm ${c.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹{c.outstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPayModalCustomer(c)}
                  disabled={c.outstanding <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Clear Payment
                </button>
                <button
                  onClick={() => handleOpenLedger(c)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs"
                  title="View Ledger History"
                >
                  <History className="w-4 h-4" />
                </button>
                {c.outstanding > 0 && (
                  <button
                    onClick={() => handleSendWhatsAppReminder(c)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs"
                    title="Send WhatsApp Payment Reminder"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Register Customer Account
            </h3>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / Electrician"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={(e) => setNewCustCreditLimit(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Address / Site Location</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Market Road, Phase 2 Site"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Record Udhar Payment
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white">{payModalCustomer.name}</div>
              <div className="text-amber-400 font-bold mt-1">
                Current Outstanding Udhar: ₹{payModalCustomer.outstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Payment Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={payModalCustomer.outstanding}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ₹${payModalCustomer.outstanding}`}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold text-lg"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Bank Transfer / Card</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Notes / Receipt Ref</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via GPay for INV-2026-001"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold"
                >
                  Clear Udhar Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER HISTORY MODAL */}
      {ledgerModalCustomer && customerLedgerData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Customer Ledger Statement</h3>
                <p className="text-xs text-slate-400">{customerLedgerData.name} ({customerLedgerData.phone})</p>
              </div>
              <button onClick={() => setLedgerModalCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {customerLedgerData.ledger?.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    entry.type === 'SALE'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === 'SALE'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="font-semibold text-white">{entry.notes}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        entry.type === 'SALE' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {entry.type === 'SALE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">Balance: ₹{entry.balance.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
