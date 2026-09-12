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
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-300 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" /> Customer Credit (Udhar) & Ledger Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer accounts, outstanding dues, payment histories, and WhatsApp reminders.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-[5px] text-xs">
            <span className="text-slate-600">Total Udhar Due: </span>
            <span className="font-extrabold text-amber-700">₹{totalOutstandingAll.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-300 p-3 rounded-[5px] flex items-center gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full bg-slate-50 border border-slate-300 rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCustomers.map((c) => {
          const isOverLimit = c.outstanding >= c.creditLimit;
          return (
            <div key={c.id} className="bg-white p-4 rounded-[5px] border border-slate-300 hover:border-blue-500 shadow-sm flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{c.name}</h3>
                  {c.outstanding > 0 ? (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Udhar Due
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

                {/* Financial Summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Purchases</span>
                    <div className="font-bold text-slate-900">₹{c.totalPurchases.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Outstanding Due</span>
                    <div className={`font-black text-sm ${c.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ₹{c.outstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setPayModalCustomer(c)}
                  disabled={c.outstanding <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-[5px] text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Clear Payment
                </button>
                <button
                  onClick={() => handleOpenLedger(c)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-1.5 rounded-[5px] text-xs"
                  title="View Ledger History"
                >
                  <History className="w-4 h-4" />
                </button>
                {c.outstanding > 0 && (
                  <button
                    onClick={() => handleSendWhatsAppReminder(c)}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 p-1.5 rounded-[5px] text-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Register Customer Account
            </h3>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / Electrician"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={(e) => setNewCustCreditLimit(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Address / Site Location</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Market Road, Phase 2 Site"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 py-2 rounded-[5px] font-bold border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-[5px] font-bold shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-700" /> Record Udhar Payment
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-[5px] border border-slate-300 text-xs">
              <div className="font-bold text-slate-900">{payModalCustomer.name}</div>
              <div className="text-amber-700 font-bold mt-0.5">
                Current Outstanding Udhar: ₹{payModalCustomer.outstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Payment Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={payModalCustomer.outstanding}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ₹${payModalCustomer.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-emerald-700 font-bold text-base focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Bank Transfer / Card</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Notes / Receipt Ref</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via GPay for INV-2026-001"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="w-1/2 bg-slate-100 text-slate-700 py-2 rounded-[5px] font-bold border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-[5px] font-bold shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-2xl w-full p-5 space-y-3 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Ledger Statement</h3>
                <p className="text-xs text-slate-500">{customerLedgerData.name} ({customerLedgerData.phone})</p>
              </div>
              <button onClick={() => setLedgerModalCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {customerLedgerData.ledger?.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-[5px] border flex items-center justify-between text-xs ${
                    entry.type === 'SALE'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
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
                      <span className="font-semibold text-slate-900">{entry.notes}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(entry.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-xs ${
                        entry.type === 'SALE' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {entry.type === 'SALE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Balance: ₹{entry.balance.toLocaleString('en-IN')}</div>
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
