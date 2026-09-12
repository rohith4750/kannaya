'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Truck,
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
  Plus,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itemized' | 'ledger' | 'orders'>('itemized');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Purchase Order Modal State
  const [showPoModal, setShowPoModal] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poPaidAmount, setPoPaidAmount] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; price: string; quantity: string }[]>([
    { productId: '', price: '', quantity: '1' },
  ]);

  const loadSupplierData = async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        fetch(`/api/suppliers/${id}/ledger`),
        fetch('/api/products'),
      ]);
      const suppData = await suppRes.json();
      const prodData = await prodRes.json();
      setSupplier(suppData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          supplierId: id,
          amount: payAmount,
          notes: payNotes,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayAmount('');
        setPayNotes('');
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = poItems.filter((it) => it.productId && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid product to the purchase order.');
      return;
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: id,
          poNumber,
          items: validItems,
          paidAmount: poPaidAmount,
          notes: poNotes,
        }),
      });

      if (res.ok) {
        setShowPoModal(false);
        setPoNumber('');
        setPoPaidAmount('');
        setPoNotes('');
        setPoItems([{ productId: '', price: '', quantity: '1' }]);
        loadSupplierData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPoItem = () => {
    setPoItems([...poItems, { productId: '', price: '', quantity: '1' }]);
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePoItemChange = (index: number, field: string, value: string) => {
    const updated = [...poItems];
    (updated[index] as any)[field] = value;

    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === value);
      if (selectedProd) {
        updated[index].price = selectedProd.purchasePrice.toString();
      }
    }
    setPoItems(updated);
  };

  const handleWhatsAppReorder = async () => {
    if (!supplier) return;
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
      if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Truck className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading supplier account details...
      </div>
    );
  }

  if (!supplier || supplier.error) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p>Supplier account not found.</p>
        <Link href="/suppliers" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Suppliers
        </Link>
      </div>
    );
  }

  // Group Purchase Orders by Date
  const groupOrdersByDate = () => {
    if (!supplier.purchaseOrders) return {};
    const groups: { [dateStr: string]: any[] } = {};

    const todayStr = new Date().toLocaleDateString('en-IN');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');

    supplier.purchaseOrders.forEach((po: any) => {
      const d = new Date(po.createdAt);
      const poDateStr = d.toLocaleDateString('en-IN');
      let displayKey = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (poDateStr === todayStr) {
        displayKey = `Today (${displayKey})`;
      } else if (poDateStr === yesterdayStr) {
        displayKey = `Yesterday (${displayKey})`;
      }

      if (!groups[displayKey]) groups[displayKey] = [];
      groups[displayKey].push(po);
    });

    return groups;
  };

  const orderGroups = groupOrdersByDate();

  return (
    <div className="space-y-4 w-full">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/suppliers"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supplier Accounts
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Print Statement
          </button>

          <button
            onClick={() => setShowPoModal(true)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
          >
            <Plus className="w-4 h-4" /> New Stock Order
          </button>

          {supplier.outstanding > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Pay Supplier Account
            </button>
          )}

          <button
            onClick={handleWhatsAppReorder}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#cbcbcb]/40"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Reorder
          </button>
        </div>
      </div>

      {/* Supplier Overview Card */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#cbcbcb] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{supplier.name}</h1>
              {supplier.outstanding > 0 ? (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Payment Due
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Paid Clear
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-[#6d8196]" /> {supplier.phone} ({supplier.contactPerson || 'Contact Person'})
              </span>
              {supplier.email && (
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#6d8196]" /> {supplier.email}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {supplier.address}
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#ffffe3] p-4 rounded-[5px] border border-[#cbcbcb] min-w-[220px] text-right shadow-sm">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Pending Supplier Payable</span>
            <div className={`text-3xl font-black ${supplier.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              ₹{supplier.outstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Total Dues Outstanding
            </span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Stock Purchased</span>
            <div className="text-xl font-extrabold text-[#4a4a4a]">₹{supplier.totalPurchased.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Paid to Supplier</span>
            <div className="text-xl font-extrabold text-emerald-700">₹{supplier.totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Purchase Orders Placed</span>
            <div className="text-xl font-extrabold text-[#6d8196]">{supplier.purchaseOrders?.length || 0} Orders</div>
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
            <ShoppingBag className="w-4 h-4 text-[#6d8196]" /> Daily Itemized Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r border-[#cbcbcb] transition-colors ${
              activeTab === 'ledger'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <History className="w-4 h-4 text-[#6d8196]" /> Supplier Financial Ledger & Dues
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#6d8196]" /> Purchase Orders ({supplier.purchaseOrders?.length || 0})
          </button>
        </div>

        {/* TAB 1: DAILY ITEMIZED PURCHASE ORDERS */}
        {activeTab === 'itemized' && (
          <div className="p-4 space-y-4 text-xs">
            {Object.keys(orderGroups).length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium">
                No stock purchase orders recorded for this supplier yet.
              </div>
            ) : (
              Object.entries(orderGroups).map(([dateLabel, pos]) => (
                <div key={dateLabel} className="border border-[#cbcbcb] rounded-[5px] overflow-hidden bg-white">
                  {/* Date Section Header */}
                  <div className="bg-[#4a4a4a] text-white px-3.5 py-2 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#ffffe3]" />
                      <span>{dateLabel}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#ffffe3]">
                      {pos.length} Purchase Order{pos.length > 1 ? 's' : ''} • Total Day Cost: ₹
                      {pos.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Orders under Date */}
                  <div className="divide-y divide-slate-200">
                    {pos.map((po: any) => {
                      const isExpanded = expandedPoId === po.id;
                      return (
                        <div key={po.id} className="p-3.5 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 font-bold text-[#4a4a4a] text-xs">
                                <span className="text-[#6d8196] font-mono">
                                  PO #{po.poNumber}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span>{new Date(po.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  {po.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Items Count: {po.items?.length || 0} product(s) ordered
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-extrabold text-sm text-[#4a4a4a]">
                                  ₹{po.totalAmount.toLocaleString('en-IN')}
                                </div>
                                {po.dueAmount > 0 ? (
                                  <span className="text-[10px] text-amber-700 font-bold block">
                                    Added to Dues: ₹{po.dueAmount.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-bold block">
                                    Paid Fully
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-[5px] border border-[#cbcbcb]"
                                title="Toggle Items List"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Items Table for this Purchase Order */}
                          <div className="bg-slate-50 rounded-[5px] border border-[#cbcbcb] p-2.5 overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse">
                              <thead>
                                <tr className="border-b border-[#cbcbcb] text-slate-500 font-bold uppercase text-[9px]">
                                  <th className="pb-1 px-2">Stock Product Name</th>
                                  <th className="pb-1 px-2 text-center">Unit Wholesale Rate</th>
                                  <th className="pb-1 px-2 text-center">Ordered Qty</th>
                                  <th className="pb-1 px-2 text-right">Total Order Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {po.items?.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="py-1.5 px-2 font-bold text-[#4a4a4a]">
                                      <div className="flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-[#6d8196] shrink-0" />
                                        <span>{item.product?.name || item.productName || 'Stock Product'}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-600 font-mono">
                                      ₹{item.price.toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-bold text-slate-800">
                                      {item.quantity} {item.product?.unit || 'pcs'}
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

        {/* TAB 2: FINANCIAL LEDGER & SUPPLIER PAYMENTS */}
        {activeTab === 'ledger' && (
          <div className="p-4 space-y-3 text-xs">
            {supplier.ledger?.length > 0 ? (
              supplier.ledger.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-[5px] border flex items-center justify-between text-xs ${
                    entry.type === 'PURCHASE' ? 'bg-[#ffffe3] border-[#cbcbcb]' : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                          entry.type === 'PURCHASE' ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'
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
                        entry.type === 'PURCHASE' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {entry.type === 'PURCHASE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Running Dues Balance: ₹{entry.balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No ledger entries recorded yet.</p>
            )}
          </div>
        )}

        {/* TAB 3: PURCHASE ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="p-4 text-xs">
            {supplier.purchaseOrders?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#4a4a4a] text-white font-semibold text-[11px]">
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Paid Amount</th>
                      <th className="py-2.5 px-3">Due Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {supplier.purchaseOrders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-[#6d8196] font-mono">{po.poNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(po.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#4a4a4a]">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">₹{po.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-700">₹{po.dueAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className="px-2 py-0.5 rounded-[5px] text-[10px] bg-slate-100 border border-slate-300">
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                          {po.items?.length || 0} product(s)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No purchase orders recorded for this supplier.</p>
            )}
          </div>
        )}
      </div>

      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Record Supplier Payment
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={supplier.outstanding}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${supplier.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-emerald-700 font-bold text-lg focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Bank Ref</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid via Bank RTGS Transfer"
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
                  Clear Supplier Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW STOCK PURCHASE ORDER MODAL */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#6d8196]" /> New Wholesale Purchase Order ({supplier.name})
              </h3>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="flex-1 flex flex-col min-h-0 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">PO / Bill Ref Number (Optional)</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Initial Amount Paid Now (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={poPaidAmount}
                    onChange={(e) => setPoPaidAmount(e.target.value)}
                    placeholder="Full amount if blank"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-emerald-700 font-bold focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 overflow-y-auto min-h-0 border border-[#cbcbcb] rounded-[5px] p-3 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between font-bold text-[#4a4a4a] pb-1 border-b border-[#cbcbcb]">
                  <span>Ordered Products List</span>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-[#6d8196] hover:underline text-[11px] flex items-center gap-1 font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Item Line
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-[5px] border border-[#cbcbcb]">
                    <div className="flex-1 min-w-0">
                      <MaterialSelect
                        label={`Item #${idx + 1}`}
                        value={item.productId}
                        onChange={(val) => handlePoItemChange(idx, 'productId', val)}
                        options={[
                          { value: '', label: '-- Select Product --' },
                          ...products.map((p) => ({ value: p.id, label: `${p.name} (Stock: ${p.stockQuantity} ${p.unit})` })),
                        ]}
                      />
                    </div>

                    <div className="w-24">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Unit Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.price}
                        onChange={(e) => handlePoItemChange(idx, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div className="w-20">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Qty</label>
                      <input
                        type="number"
                        step="1"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-slate-900 font-bold"
                      />
                    </div>

                    {poItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePoItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 mt-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Order Notes / Invoice Ref</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Polycab 90m Wire Bundle Invoice #789"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Save Stock Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
