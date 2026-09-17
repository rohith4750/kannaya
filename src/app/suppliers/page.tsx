'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Plus, DollarSign, MessageSquare, Phone, Mail, Building, X, FileText, Trash2, Printer, Search, Edit3, Filter } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [payModalSupplier, setPayModalSupplier] = useState<any>(null);
  const [deleteModalSupplier, setDeleteModalSupplier] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');

  // Form states (Add)
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Form states (Edit)
  const [editName, setEditName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

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

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSupplier.id,
          name: editName,
          contactPerson: editContactPerson,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
        }),
      });
      if (res.ok) {
        setEditSupplier(null);
        loadSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (supplier: any) => {
    setEditSupplier(supplier);
    setEditName(supplier.name || '');
    setEditContactPerson(supplier.contactPerson || '');
    setEditPhone(supplier.phone || '');
    setEditEmail(supplier.email || '');
    setEditAddress(supplier.address || '');
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
          paymentDate,
        }),
      });
      if (res.ok) {
        setPayModalSupplier(null);
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        loadSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteModalSupplier) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/suppliers?id=${deleteModalSupplier.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModalSupplier(null);
        loadSuppliers();
      } else {
        const err = await res.json();
        alert(`Error deleting supplier: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
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

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'DUE'
        ? s.outstanding > 0
        : s.outstanding <= 0;

    return matchesQuery && matchesStatus;
  });

  const totalSupplierDueAll = suppliers.reduce((sum, s) => sum + (s.outstanding || 0), 0);

  return (
    <div className="space-y-4 w-full">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#4a4a4a] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#6d8196]" /> Supplier Directory & Purchase Dues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale suppliers, purchase order ledger, pending payables, and reorder notices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#ffffe3] border border-[#cbcbcb] px-3.5 py-1.5 rounded-[5px] text-xs shadow-sm">
            <span className="text-slate-500 font-bold text-[10px] uppercase">Total Supplier Pending: </span>
            <span className="font-extrabold text-[#6d8196] font-mono">₹{(totalSupplierDueAll || 0).toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-[#4a4a4a] border border-[#cbcbcb] px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-[#6d8196]" /> Print Directory PDF
          </button>

          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-3 rounded-[5px] border border-[#cbcbcb] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by company name, contact person, or phone number..."
            className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-[#4a4a4a] focus:bg-white focus:outline-none focus:border-[#6d8196]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6d8196]" />
          <div className="flex bg-slate-100 p-1 rounded-[5px] border border-[#cbcbcb] text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-[4px] transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({suppliers.length})
            </button>
            <button
              onClick={() => setStatusFilter('DUE')}
              className={`px-3 py-1 rounded-[4px] transition-all ${
                statusFilter === 'DUE' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dues Pending ({suppliers.filter((s) => s.outstanding > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1 rounded-[4px] transition-all ${
                statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Paid Clear ({suppliers.filter((s) => s.outstanding <= 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* SUPPLIERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-[#cbcbcb] rounded-[5px] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-[#cbcbcb] pb-2.5">
                <div>
                  <h3 className="font-extrabold text-base text-[#4a4a4a] leading-tight">{s.name}</h3>
                  {s.contactPerson && (
                    <span className="text-xs text-slate-500 font-medium">Contact: {s.contactPerson}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {s.outstanding > 0 ? (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Payment Due
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Paid Clear
                    </span>
                  )}
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] border border-slate-200 transition-colors"
                    title="Edit Supplier Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#6d8196]" /> {s.phone} ({s.contactPerson || 'Sales Head'})
                </div>
                {s.address && <div className="text-[11px] text-slate-500 truncate">{s.address}</div>}
              </div>

              {/* Financial Totals */}
              <div className="mt-4 pt-3 border-t border-[#cbcbcb] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Stock Purchased</span>
                  <div className="font-bold text-[#4a4a4a]">₹{(s.totalPurchased || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Pending Payable</span>
                  <div className={`font-black text-sm ${(s.outstanding || 0) > 0 ? 'text-[#6d8196]' : 'text-emerald-700'}`}>
                    ₹{(s.outstanding || 0).toLocaleString('en-IN')}
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

              <button
                onClick={() => setDeleteModalSupplier(s)}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2 rounded-[5px] text-xs transition-colors"
                title="Delete Supplier Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT SUPPLIER MODAL */}
      {editSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <span className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#6d8196]" /> Edit Supplier Details
              </span>
              <button onClick={() => setEditSupplier(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </h3>

            <form onSubmit={handleEditSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Contact Person</label>
                  <input
                    type="text"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Warehouse / Market Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditSupplier(null)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* CONFIRMATION DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteModalSupplier}
        title="Delete Supplier Account"
        message={
          deleteModalSupplier
            ? `Are you sure you want to delete supplier "${deleteModalSupplier.name}"? This action will permanently remove all associated purchase orders, item records, and ledger history.`
            : ''
        }
        confirmText="Delete Supplier"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={confirmDeleteSupplier}
        onClose={() => setDeleteModalSupplier(null)}
      />

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
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
                    placeholder="e.g. 9848012345"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@abcelectricals.com"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Warehouse / Market Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Wholesale Electrical Market, Hubli"
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
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payModalSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Pay Supplier Account ({payModalSupplier.name})
            </h3>

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
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-emerald-700 font-bold text-lg focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Completion Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] font-semibold focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Bank Ref</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via Bank RTGS Transfer"
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
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-[5px] font-bold"
                >
                  Clear Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
