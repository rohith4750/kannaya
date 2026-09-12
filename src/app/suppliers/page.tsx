'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Plus, DollarSign, MessageSquare, Phone, Mail, Building, X, FileText } from 'lucide-react';

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
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#4a4a4a] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#6d8196]" /> Supplier Directory & Purchase Dues
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage wholesale suppliers, purchase order ledger, pending payables, and reorder notices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#6d8196]/10 border border-[#6d8196]/30 px-3.5 py-1.5 rounded-[5px] text-xs">
            <span className="text-[#4a4a4a]">Total Supplier Pending: </span>
            <span className="font-extrabold text-[#6d8196]">₹{totalSupplierDueAll.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-2 rounded-[5px] flex items-center gap-2 text-xs shadow-sm transition-all border border-[#cbcbcb]/40"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm flex flex-col justify-between hover:border-[#6d8196] transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#4a4a4a] truncate">{s.name}</h3>
                {s.outstanding > 0 ? (
                  <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/30">
                    Payment Due
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Paid
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3 h-3 text-[#6d8196]" /> {s.phone} ({s.contactPerson || 'Sales Head'})
                </div>
                {s.address && <div className="text-[11px] text-slate-500 truncate">{s.address}</div>}
              </div>

              {/* Financial Totals */}
              <div className="mt-4 pt-3 border-t border-[#cbcbcb] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Stock Purchased</span>
                  <div className="font-bold text-[#4a4a4a]">₹{s.totalPurchased.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Pending Payable</span>
                  <div className={`font-black text-sm ${s.outstanding > 0 ? 'text-[#6d8196]' : 'text-emerald-700'}`}>
                    ₹{s.outstanding.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-[#cbcbcb] flex items-center justify-between gap-1.5">
              <Link
                href={`/suppliers/${s.id}`}
                className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-slate-800 font-bold py-2 px-2.5 rounded-[5px] text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                title="View Daily Itemized Purchase Orders & Ledger Statement"
              >
                <FileText className="w-3.5 h-3.5 text-[#6d8196]" /> Orders & Ledger
              </Link>

              <button
                onClick={() => setPayModalSupplier(s)}
                disabled={s.outstanding <= 0}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-2 rounded-[5px] text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5" /> Pay Supplier
              </button>

              <button
                onClick={() => handleWhatsAppReorder(s)}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 p-2 rounded-[5px] text-xs"
                title="Send Low Stock WhatsApp Reorder"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Truck className="w-5 h-5 text-[#6d8196]" /> Add Wholesale Supplier
            </h3>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Supplier / Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Electrical Distributors"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Vikram Sharma"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9848012345"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Address / Market Depot</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Wholesale Market, Hub 1"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-[#6d8196]" /> Pay Supplier Account
            </h3>

            <div className="bg-[#ffffe3] p-3 rounded-[5px] border border-[#cbcbcb] text-xs">
              <div className="font-bold text-[#4a4a4a]">{payModalSupplier.name}</div>
              <div className="text-[#6d8196] font-bold mt-1">
                Pending Due Balance: ₹{payModalSupplier.outstanding.toLocaleString('en-IN')}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={payModalSupplier.outstanding}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max ₹${payModalSupplier.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#6d8196] font-bold text-lg focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Bank RTGS Transfer for Polycab shipment"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalSupplier(null)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold"
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
