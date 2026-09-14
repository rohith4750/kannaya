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
  PackageCheck,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import SupplierPOPrintTemplate from '@/components/SupplierPOPrintTemplate';

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shopSettings, setShopSettings] = useState<any>(null);
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
  const [isReceivedImmediately, setIsReceivedImmediately] = useState(true);
  const [poItems, setPoItems] = useState<{ productId: string; price: string; quantity: string }[]>([
    { productId: '', price: '', quantity: '1' },
  ]);

  // Inline product creation modal state inside PO
  const [showInlineProdModal, setShowInlineProdModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');

  // GRN Godown Receiving Modal State
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<any>(null);
  const [grnReceivedQtyMap, setGrnReceivedQtyMap] = useState<{ [itemId: string]: number }>({});
  const [savingGrn, setSavingGrn] = useState(false);

  // PDF / Print Modal State
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<any>(null);

  // Search filter for PO items
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const loadSupplierData = async () => {
    try {
      const [suppRes, prodRes, setRes] = await Promise.all([
        fetch(`/api/suppliers/${id}/ledger`),
        fetch('/api/products'),
        fetch('/api/settings'),
      ]);
      const suppData = await suppRes.json();
      const prodData = await prodRes.json();
      const setData = await setRes.json();
      setSupplier(suppData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (setData && !setData.error) setShopSettings(setData);
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
      alert('Please select at least one product for the purchase order.');
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
          isReceivedImmediately,
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
        updated[index].price = (selectedProd.purchasePrice || selectedProd.sellingPrice || 0).toString();
      }
    }
    setPoItems(updated);
  };

  // Godown GRN Submission
  const openGrnModal = (po: any) => {
    setSelectedPoForGrn(po);
    const initialMap: { [itemId: string]: number } = {};
    if (po.items) {
      po.items.forEach((item: any) => {
        initialMap[item.id] = item.receivedQuantity ?? (po.status === 'COMPLETED' || po.status === 'FULLY_RECEIVED' ? item.quantity : 0);
      });
    }
    setGrnReceivedQtyMap(initialMap);
    setShowGrnModal(true);
  };

  const handleSaveGrn = async () => {
    if (!selectedPoForGrn) return;
    setSavingGrn(true);
    try {
      const itemsReceived = Object.entries(grnReceivedQtyMap).map(([itemId, receivedQty]) => ({
        itemId,
        receivedQty,
      }));

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receive',
          purchaseOrderId: selectedPoForGrn.id,
          itemsReceived,
        }),
      });

      if (res.ok) {
        setShowGrnModal(false);
        setSelectedPoForGrn(null);
        loadSupplierData();
      } else {
        const err = await res.json();
        alert(`Failed to save GRN entry: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGrn(false);
    }
  };

  const handleWhatsAppReorder = async (po?: any) => {
    if (!supplier) return;
    const poRefText = po ? `PO #${po.poNumber}` : 'a new stock order';
    let text = `Hello ${supplier.name}, this is Venkata Lakshmi Electronics.\nWe would like to place an order for ${poRefText}. Please check attached details.`;
    if (po && po.items && po.items.length > 0) {
      text += `\n\n*Requested Products:*`;
      po.items.forEach((it: any, i: number) => {
        text += `\n${i + 1}. ${it.product?.name || 'Product'} - ${it.quantity} pcs @ ₹${it.price}`;
      });
      text += `\n*Total PO Cost:* ₹${po.totalAmount.toLocaleString('en-IN')}`;
    }
    const encoded = encodeURIComponent(text);
    const cleanPhone = (supplier.phone || '').replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encoded}`, '_blank');
  };

  const handleCreateInlineProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName.trim(),
          sellingPrice: parseFloat(newProdPrice),
          purchasePrice: parseFloat(newProdCost) || 0,
          stockQuantity: 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data) {
        setShowInlineProdModal(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdCost('');
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
          if (poItems.length > 0) {
            const updated = [...poItems];
            updated[updated.length - 1] = {
              productId: data.id,
              price: String(data.purchasePrice || data.sellingPrice || 0),
              quantity: '1',
            };
            setPoItems(updated);
          }
        }
      } else {
        alert(data.error || 'Failed to create product');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrintPo = (po: any) => {
    setSelectedPoForPrint(po);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
        <Truck className="w-8 h-8 animate-spin text-[#6d8196]" />
        <p className="font-semibold text-slate-700">Loading supplier account & stock orders...</p>
      </div>
    );
  }

  if (!supplier || supplier.error) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <p>Supplier account not found.</p>
        <Link href="/suppliers" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Supplier Accounts
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totalPoCount = supplier.purchaseOrders?.length || 0;
  const totalPurchasedVal = supplier.totalPurchased || 0;
  const totalPaidVal = supplier.totalPaid || 0;
  const outstandingVal = supplier.outstanding || 0;

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

  const totalOrderItemsCostInPoModal = poItems.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0;
    const q = parseFloat(item.quantity) || 0;
    return sum + p * q;
  }, 0);

  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto pb-12">
      {/* Printable PO Modal (Hidden when not printing) */}
      {selectedPoForPrint && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <SupplierPOPrintTemplate po={selectedPoForPrint} supplier={supplier} settings={shopSettings} />
        </div>
      )}

      {/* Screen View Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <Link
          href="/suppliers"
          className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-2 font-bold bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-lg transition-all shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" /> Back to Supplier Accounts
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" /> Print Statement
          </button>

          <button
            onClick={() => setShowPoModal(true)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm border border-[#6d8196]/40 transition-all"
          >
            <Plus className="w-4 h-4" /> Bulk Stock Order
          </button>

          {outstandingVal > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <DollarSign className="w-4 h-4" /> Pay Supplier Dues
            </button>
          )}

          <button
            onClick={() => handleWhatsAppReorder()}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs border border-emerald-900/40 transition-all"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Reorder
          </button>
        </div>
      </div>

      {/* SUPPLIER FINANCIAL HEADER & METRICS CARDS (REDESIGNED) */}
      <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Supplier Profile Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{supplier.name}</h1>
              {outstandingVal > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> ₹{outstandingVal.toLocaleString('en-IN')} Due
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Account Fully Paid
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Phone className="w-4 h-4 text-[#6d8196]" /> {supplier.phone} ({supplier.contactPerson || 'Contact Person'})
              </span>
              {supplier.email && (
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Mail className="w-4 h-4 text-[#6d8196]" /> {supplier.email}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-700" /> {supplier.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPoModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" /> Create Wholesale Order
            </button>
          </div>
        </div>

        {/* Financial Stat Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Outstanding Payable Dues */}
          <div className={`p-4 rounded-xl border transition-all ${outstandingVal > 0 ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <span>Pending Dues Payable</span>
              <AlertTriangle className={`w-4 h-4 ${outstandingVal > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div className={`text-2xl font-black tracking-tight ${outstandingVal > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              ₹{outstandingVal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Unsettled supplier balance</p>
          </div>

          {/* Card 2: Total Stock Purchased */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <span>Total Stock Purchased</span>
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900">
              ₹{totalPurchasedVal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Lifetime purchase total</p>
          </div>

          {/* Card 3: Total Paid to Supplier */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-950">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              <span>Total Paid to Supplier</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-800">
              ₹{totalPaidVal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Cleared financial payouts</p>
          </div>

          {/* Card 4: Orders Count */}
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-blue-950">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              <span>Purchase Orders</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black tracking-tight text-blue-900">
              {totalPoCount} <span className="text-sm font-semibold text-blue-700">Orders</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1 font-medium">Total stock batches</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT TABBED CONTAINER */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('itemized')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 border-r border-slate-200 transition-colors ${
              activeTab === 'itemized'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#6d8196]" /> Daily Itemized Purchase Orders
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 border-r border-slate-200 transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-[#6d8196]" /> Wholesale POs & PDF Receipts ({totalPoCount})
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ledger'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-[#6d8196]" /> Financial Ledger & Dues
          </button>
        </div>

        {/* TAB 1: DAILY ITEMIZED PURCHASE ORDERS */}
        {activeTab === 'itemized' && (
          <div className="p-5 space-y-6 text-xs">
            {Object.keys(orderGroups).length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No stock purchase orders recorded for this supplier yet.
                <div className="mt-3">
                  <button
                    onClick={() => setShowPoModal(true)}
                    className="bg-[#6d8196] text-white px-4 py-2 rounded-lg font-bold text-xs"
                  >
                    + Create First Purchase Order
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(orderGroups).map(([dateLabel, pos]) => (
                <div key={dateLabel} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {/* Date Section Header */}
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-xs uppercase tracking-wide">{dateLabel}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {pos.length} Order{pos.length > 1 ? 's' : ''} • Day Total: ₹
                      {pos.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Orders under Date */}
                  <div className="divide-y divide-slate-100">
                    {pos.map((po: any) => {
                      const isExpanded = expandedPoId === po.id || true; // Expand by default for clarity
                      const isCompleted = po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED';
                      const isPartial = po.status === 'PARTIAL_RECEIVED' || po.status === 'PARTIAL';

                      return (
                        <div key={po.id} className="p-4 space-y-3">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-xs flex-wrap">
                                <span className="text-[#6d8196] font-mono text-sm">PO #{po.poNumber}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 font-medium">
                                  {new Date(po.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {/* Receiving Status Badge */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                    isCompleted
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isPartial
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                                  }`}
                                >
                                  {isCompleted ? '✓ FULLY RECEIVED' : isPartial ? '⚡ PARTIAL ARRIVED' : '⏳ PENDING GODOWN ARRIVAL'}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span>{po.items?.length || 0} product(s) ordered</span>
                                {po.dueAmount > 0 ? (
                                  <span className="text-amber-700 font-bold">Due: ₹{po.dueAmount.toLocaleString('en-IN')}</span>
                                ) : (
                                  <span className="text-emerald-700 font-bold">Paid Fully</span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for this PO */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-right pr-2">
                                <div className="font-black text-base text-slate-900 font-mono">
                                  ₹{po.totalAmount.toLocaleString('en-IN')}
                                </div>
                              </div>

                              <button
                                onClick={() => openGrnModal(po)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                                title="Log Godown Shipment Arrival"
                              >
                                <PackageCheck className="w-3.5 h-3.5 text-amber-700" /> Log GRN / Receive Stock
                              </button>

                              <button
                                onClick={() => handlePrintPo(po)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                                title="Print Wholesale Purchase Order PDF"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" /> Printable PDF
                              </button>

                              <button
                                onClick={() => handleWhatsAppReorder(po)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 p-1.5 rounded-lg text-xs font-bold"
                                title="Send PO on WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                              </button>
                            </div>
                          </div>

                          {/* Itemized Stock Table for this Purchase Order */}
                          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                  <th className="pb-2 px-2">#</th>
                                  <th className="pb-2 px-2">Product Name & Spec</th>
                                  <th className="pb-2 px-2 text-center">Unit Cost</th>
                                  <th className="pb-2 px-2 text-center">Ordered Qty</th>
                                  <th className="pb-2 px-2 text-center">Godown Received Qty</th>
                                  <th className="pb-2 px-2 text-right">Total Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/80">
                                {po.items?.map((item: any, idx: number) => {
                                  const recQty = item.receivedQuantity ?? (isCompleted ? item.quantity : 0);
                                  const pendingQty = Math.max(0, item.quantity - recQty);

                                  return (
                                    <tr key={item.id} className="hover:bg-white transition-colors">
                                      <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                                      <td className="py-2 px-2 font-bold text-slate-900">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-3.5 h-3.5 text-[#6d8196] shrink-0" />
                                          <span>{item.product?.name || item.productName || 'Stock Product'}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-2 text-center text-slate-600 font-mono">
                                        ₹{item.price.toLocaleString('en-IN')}
                                      </td>
                                      <td className="py-2 px-2 text-center font-extrabold text-slate-800">
                                        {item.quantity} {item.product?.unit || 'pcs'}
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span
                                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold ${
                                            recQty >= item.quantity
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                              : recQty > 0
                                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                              : 'bg-slate-200 text-slate-700'
                                          }`}
                                        >
                                          {recQty} / {item.quantity} {item.product?.unit || 'pcs'}
                                        </span>
                                        {pendingQty > 0 && (
                                          <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                                            ({pendingQty} pending godown)
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">
                                        ₹{item.total.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })}
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

        {/* TAB 2: PURCHASE ORDERS & PDF RECEIPTS LIST */}
        {activeTab === 'orders' && (
          <div className="p-5 text-xs space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Wholesale Purchase Orders Summary</span>
              <button
                onClick={() => setShowPoModal(true)}
                className="bg-[#6d8196] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                + New Wholesale Order
              </button>
            </div>

            {supplier.purchaseOrders?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">PO Number</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-3">Paid Amount</th>
                      <th className="py-3 px-3">Due Balance</th>
                      <th className="py-3 px-3">Receiving Status</th>
                      <th className="py-3 px-3 text-right">PDF & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {supplier.purchaseOrders.map((po: any) => {
                      const isCompleted = po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED';
                      const isPartial = po.status === 'PARTIAL_RECEIVED' || po.status === 'PARTIAL';

                      return (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#6d8196] font-mono text-sm">{po.poNumber}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 font-mono">
                            ₹{po.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700 font-mono">
                            ₹{po.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-700 font-mono">
                            ₹{po.dueAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {isCompleted ? '✓ FULLY RECEIVED' : isPartial ? '⚡ PARTIAL ARRIVED' : '⏳ ORDERED'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openGrnModal(po)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <PackageCheck className="w-3.5 h-3.5" /> GRN Log
                              </button>
                              <button
                                onClick={() => handlePrintPo(po)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" /> PDF Order
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">No purchase orders recorded for this supplier.</p>
            )}
          </div>
        )}

        {/* TAB 3: FINANCIAL LEDGER */}
        {activeTab === 'ledger' && (
          <div className="p-5 space-y-3 text-xs">
            {supplier.ledger?.length > 0 ? (
              supplier.ledger.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    entry.type === 'PURCHASE' ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          entry.type === 'PURCHASE' ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{entry.notes}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-base font-mono ${
                        entry.type === 'PURCHASE' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {entry.type === 'PURCHASE' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Account Dues Balance: ₹{entry.balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">No ledger entries recorded yet.</p>
            )}
          </div>
        )}
      </div>

      {/* GODOWN GOODS RECEIVING NOTE (GRN) MODAL */}
      {showGrnModal && selectedPoForGrn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-amber-600" /> Log Godown Stock Arrival (GRN)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">PO #{selectedPoForGrn.poNumber} • Verify arrived vs missing items</p>
              </div>
              <button onClick={() => setShowGrnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <p className="font-semibold">
                  📦 Enter the total received quantity for each item when stock arrives at your central godown.
                  The store inventory will be automatically incremented by newly arrived items.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                      <th className="py-2.5 px-3 text-center">Received at Godown</th>
                      <th className="py-2.5 px-3 text-right">Pending / Missing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPoForGrn.items?.map((item: any) => {
                      const curVal = grnReceivedQtyMap[item.id] ?? 0;
                      const pending = Math.max(0, item.quantity - curVal);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {item.product?.name || item.productName || 'Stock Product'}
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-slate-800">
                            {item.quantity} {item.product?.unit || 'pcs'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              step="1"
                              value={curVal}
                              onChange={(e) =>
                                setGrnReceivedQtyMap({
                                  ...grnReceivedQtyMap,
                                  [item.id]: Math.min(item.quantity, Math.max(0, parseFloat(e.target.value) || 0)),
                                })
                              }
                              className="w-24 text-center bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {pending > 0 ? (
                              <span className="text-red-600 font-bold">{pending} {item.product?.unit || 'pcs'} pending</span>
                            ) : (
                              <span className="text-emerald-700 font-extrabold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified All
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrnModal(false)}
                  className="w-1/2 bg-slate-100 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingGrn}
                  onClick={handleSaveGrn}
                  className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {savingGrn ? (
                    'Saving GRN Entry...'
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" /> Save Godown Entry & Update Stock
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Record Supplier Payment Payout
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 uppercase text-[10px] font-extrabold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={outstandingVal}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${outstandingVal.toLocaleString('en-IN')}`}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-emerald-700 font-black text-xl focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 uppercase text-[10px] font-extrabold">Payment Ref / Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid via NEFT / UPI Bank Transfer"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="w-1/2 bg-slate-100 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold shadow-sm"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK STOCK PURCHASE ORDER MODAL */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#6d8196]" /> Wholesale Bulk Stock Order Builder
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Supplier: <span className="font-bold text-slate-900">{supplier.name}</span></p>
              </div>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="flex-1 flex flex-col min-h-0 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <div>
                  <label className="text-slate-600 uppercase text-[10px] font-extrabold">PO / Reference #</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#6d8196] font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-600 uppercase text-[10px] font-extrabold">Advance Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={poPaidAmount}
                    onChange={(e) => setPoPaidAmount(e.target.value)}
                    placeholder="Full payment if blank"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-emerald-700 font-bold focus:outline-none focus:border-[#6d8196] font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-600 uppercase text-[10px] font-extrabold">Delivery Receiving Mode</label>
                  <select
                    value={isReceivedImmediately ? 'immediate' : 'godown'}
                    onChange={(e) => setIsReceivedImmediately(e.target.value === 'immediate')}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#6d8196]"
                  >
                    <option value="immediate">Direct In-Hand Stock (Instant)</option>
                    <option value="godown">Pending Godown Arrival (Track Shipment)</option>
                  </select>
                </div>
              </div>

              {/* Items List Builder */}
              <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/60">
                <div className="flex items-center justify-between font-extrabold text-slate-800 pb-2 border-b border-slate-200">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Package className="w-4 h-4 text-[#6d8196]" /> Itemized Products Order List ({poItems.length})
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineProdModal(true)}
                      className="text-emerald-700 hover:underline text-[11px] flex items-center gap-1 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + New Product
                    </button>

                    <button
                      type="button"
                      onClick={handleAddPoItem}
                      className="bg-white text-slate-800 hover:bg-slate-100 text-[11px] flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#6d8196]" /> Add Product Line
                    </button>
                  </div>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <MaterialSelect
                        label={`Select Stock Product #${idx + 1}`}
                        value={item.productId}
                        onChange={(val) => handlePoItemChange(idx, 'productId', val)}
                        options={[
                          { value: '', label: '-- Select Store Product --' },
                          ...products.map((p) => ({
                            value: p.id,
                            label: `${p.name} (Stock: ${p.stockQuantity} ${p.unit || 'pcs'}) - ₹${p.purchasePrice || p.sellingPrice}`,
                          })),
                        ]}
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="text-[9px] uppercase font-extrabold text-slate-500">Unit Wholesale Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.price}
                        onChange={(e) => handlePoItemChange(idx, 'price', e.target.value)}
                        placeholder="Rate"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold text-xs"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <label className="text-[9px] uppercase font-extrabold text-slate-500">Qty</label>
                      <input
                        type="number"
                        step="1"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs"
                      />
                    </div>

                    <div className="w-full sm:w-28 text-right sm:self-end sm:pb-1">
                      <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Subtotal</span>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        ₹{((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {poItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePoItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 self-center"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Total Footer & Notes */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
                <div className="w-full sm:w-2/3">
                  <label className="text-slate-300 uppercase text-[9px] font-extrabold">Order Notes / Supplier Invoice Ref</label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Wire rolls shipment bill ref #456"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="text-right w-full sm:w-auto">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Purchase Amount</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    ₹{totalOrderItemsCostInPoModal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="w-1/2 bg-slate-100 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2.5 rounded-xl font-bold shadow-sm transition-all"
                >
                  Complete & Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE CREATE PRODUCT MODAL */}
      {showInlineProdModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-4 h-4 text-emerald-600" /> Create Store Product Line
            </h3>
            <form onSubmit={handleCreateInlineProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 uppercase text-[10px] font-extrabold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Havells 4sqmm Red Wire"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 uppercase text-[10px] font-extrabold">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="MRP / Selling"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 uppercase text-[10px] font-extrabold">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="Purchase Rate"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInlineProdModal(false)}
                  className="w-1/2 bg-slate-100 border border-slate-300 text-slate-700 py-2 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl font-bold shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
