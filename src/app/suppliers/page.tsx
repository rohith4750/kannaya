'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, DollarSign, MessageSquare, Phone, Mail, Building, X } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [payModalSupplier, setPayModalSupplier] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (Array.isArray(data)) setSuppliers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contactPerson, phone, email, address }),
      });
      if (res.ok) {
        setShowAddSupplierModal(false);
        setName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        loadSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSupplier || !paymentAmount) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          supplierId: payModalSupplier.id,
          amount: paymentAmount,
          notes: paymentNotes,
        }),
      });
      if (res.ok) {
        setPayModalSupplier(null);
        setPaymentAmount('');
        setPaymentNotes('');
        loadSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsAppReorder = async (supplier: any) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          supplierPhone: supplier.phone,
          supplierName: supplier.name,
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

  const totalSupplierDueAll = suppliers.reduce((sum, s) => sum + s.outstanding, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" /> Supplier Directory & Purchase Dues
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage wholesale suppliers, purchase order ledger, pending payables, and reorder notices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Supplier Pending: </span>
            <span className="font-black text-purple-400">₹{totalSupplierDueAll.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="glass-panel p-5 rounded-2xl glass-panel-hover border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white truncate">{s.name}</h3>
                {s.outstanding > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Payment Due
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Paid
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 mt-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-amber-400" /> {s.phone} ({s.contactPerson || 'Sales Head'})
                </div>
                {s.address && <div className="text-[11px] text-slate-500 truncate">{s.address}</div>}
              </div>

              {/* Financial Totals */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Stock Purchased</span>
                  <div className="font-bold text-white">₹{s.totalPurchased.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pending Payable</span>
                  <div className={`font-black text-sm ${s.outstanding > 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                    ₹{s.outstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setPayModalSupplier(s)}
                disabled={s.outstanding <= 0}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
              >
                <DollarSign className="w-3.5 h-3.5" /> Pay Supplier
              </button>
              <button
                onClick={() => handleWhatsAppReorder(s)}
                className="bg-emerald-800 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs flex items-center gap-1"
                title="Send Low Stock WhatsApp Reorder"
              >
                <MessageSquare className="w-4 h-4" /> Reorder
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" /> Add Wholesale Supplier
            </h3>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Supplier / Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Electrical Distributors"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Vikram Sharma"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9848012345"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Address / Market Depot</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Wholesale Market, Hub 1"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {payModalSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" /> Pay Supplier Account
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white">{payModalSupplier.name}</div>
              <div className="text-purple-400 font-bold mt-1">
                Pending Due Balance: ₹{payModalSupplier.outstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={payModalSupplier.outstanding}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ₹${payModalSupplier.outstanding}`}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-bold text-lg"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Bank RTGS Transfer for Polycab shipment"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalSupplier(null)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
