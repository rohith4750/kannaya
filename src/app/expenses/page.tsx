'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Calendar,
  Tag,
  Receipt,
  FileText,
  Trash2,
  X,
  CreditCard,
  Building,
  Zap,
  Truck,
  Coffee,
  Wrench,
  ShoppingBag,
  ShieldAlert,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import ConfirmModal from '@/components/ConfirmModal';

const EXPENSE_CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'RENT', label: 'Shop Rent & Lease' },
  { value: 'ELECTRICITY', label: 'Electricity & Power' },
  { value: 'SALARY', label: 'Staff Salary & Wages' },
  { value: 'TRANSPORT', label: 'Transport & Freight' },
  { value: 'TEA_SNACKS', label: 'Tea, Snacks & Refreshments' },
  { value: 'MAINTENANCE', label: 'Shop Maintenance & Repairs' },
  { value: 'SUPPLIES', label: 'Store Packing & Supplies' },
  { value: 'TAX', label: 'Taxes & Govt Fees' },
  { value: 'OTHER', label: 'Other Miscellaneous' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalTodayAmount: 0,
    totalMonthAmount: 0,
    totalLifetimeAmount: 0,
    totalCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Expense Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'TEA_SNACKS',
    amount: '',
    paymentMethod: 'CASH',
    expenseDate: new Date().toISOString().split('T')[0],
    recipientName: '',
    receiptRef: '',
    notes: '',
  });

  const loadExpenses = async () => {
    try {
      let url = '/api/expenses?';
      if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.expenses) {
        setExpenses(data.expenses);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory, searchQuery]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          category: 'TEA_SNACKS',
          amount: '',
          paymentMethod: 'CASH',
          expenseDate: new Date().toISOString().split('T')[0],
          recipientName: '',
          receiptRef: '',
          notes: '',
        });
        loadExpenses();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Failed to record expense: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteExpense = (id: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Expense Record',
      message: 'Are you sure you want to delete this expense record? Total expense balances will be updated automatically.',
      confirmText: 'Yes, Delete Expense',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            loadExpenses();
          } else {
            const err = await res.json();
            setConfirmModalState({
              isOpen: true,
              title: 'Delete Failed',
              message: err.error || 'Failed to delete expense',
              confirmText: 'Close',
              confirmVariant: 'primary',
              onConfirm: () => setConfirmModalState((prev) => ({ ...prev, isOpen: false })),
            });
          }
        } catch (e: any) {
          console.error('Error deleting expense:', e);
        }
      },
    });
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'RENT':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Rent & Lease</span>;
      case 'ELECTRICITY':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Electricity</span>;
      case 'SALARY':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Salary & Wages</span>;
      case 'TRANSPORT':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">Freight & Transport</span>;
      case 'TEA_SNACKS':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Tea & Refreshments</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">Maintenance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-[#cbcbcb]">{cat}</span>;
    }
  };

  return (
    <div className="w-full space-y-4 pb-10">
      {/* Top KPI Outflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Today's Total Outflow</span>
            <div className="text-2xl font-black text-rose-700 mt-1">₹{summary.totalTodayAmount?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">This Month's Outflow</span>
            <div className="text-2xl font-black text-[#4a4a4a] mt-1">₹{summary.totalMonthAmount?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-[#cbcbcb] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Lifetime Outflow</span>
            <div className="text-2xl font-black text-[#6d8196] mt-1">₹{summary.totalLifetimeAmount?.toLocaleString('en-IN') || 0}</div>
            <span className="text-[10px] text-slate-400 font-medium">{summary.totalCount || 0} Vouchers Recorded</span>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-slate-100 border border-[#cbcbcb] flex items-center justify-center text-[#6d8196]">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Single Card Container */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbcbcb] pb-4">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#6d8196]" />
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a]">Shop Expense & Voucher Tracker</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Record store operating expenses, tea/snacks, rent, salary, transport freight, and utility payments.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3.5 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </button>
        </div>

        {/* Toolbar Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by expense title, paid to person, bill number..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
            />
          </div>

          <div className="w-full sm:w-64">
            <MaterialSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={EXPENSE_CATEGORIES}
            />
          </div>
        </div>

        {/* Expense Table */}
        <div className="overflow-x-auto border border-[#cbcbcb] rounded-[5px]">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="text-left">Expense Title & Voucher</th>
                <th className="text-left">Category</th>
                <th className="text-left">Date & Time</th>
                <th className="text-center">Mode</th>
                <th className="text-left">Paid To / Recipient</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="text-left">
                      <div className="font-bold text-[#4a4a4a] text-xs">{e.title}</div>
                      {e.receiptRef && <div className="text-[10px] font-mono text-slate-400">Ref: {e.receiptRef}</div>}
                    </td>
                    <td className="text-left">{getCategoryBadge(e.category)}</td>
                    <td className="text-left text-slate-600">
                      {new Date(e.expenseDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-center">
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="text-left text-slate-700 font-medium">{e.recipientName || 'N/A'}</td>
                    <td className="text-right font-mono font-black text-rose-700 text-xs">
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1 rounded-[5px] bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-[#cbcbcb] transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No expense records found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#6d8196]" /> Record Shop Expense / Outflow
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">
                  Expense Description / Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Tea & Samosa for Electricians / Shop Rent August"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Category</label>
                  <MaterialSelect
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={EXPENSE_CATEGORIES.filter((c) => c.value !== 'ALL')}
                  />
                </div>

                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">
                    Amount Spent (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 font-mono font-bold text-rose-700 focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <MaterialSelect
                    label="Payment Mode"
                    value={formData.paymentMethod}
                    onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                    options={[
                      { value: 'CASH', label: 'Cash Payment' },
                      { value: 'UPI', label: 'UPI / PhonePe / Paytm' },
                      { value: 'CARD', label: 'Card Payment' },
                      { value: 'SPLIT', label: 'Bank Transfer' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Expense Date</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Paid To / Recipient</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="e.g. Ramesh Tea Stall, Landlord"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Voucher / Bill No</label>
                  <input
                    type="text"
                    value={formData.receiptRef}
                    onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                    placeholder="e.g. EB-10294 / V-001"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Remarks</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional expense remarks..."
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#cbcbcb]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 border border-[#cbcbcb] text-slate-700 px-4 py-1.5 rounded-[5px] font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-5 py-1.5 rounded-[5px] font-bold shadow-sm border border-[#cbcbcb]/40 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Styled Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        confirmVariant={confirmModalState.confirmVariant}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
