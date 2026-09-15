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
  Check,
  Filter,
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import SupplierPOPrintTemplate from '@/components/SupplierPOPrintTemplate';
import SupplierLedgerPrintTemplate from '@/components/SupplierLedgerPrintTemplate';

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itemized' | 'ledger' | 'orders'>('itemized');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // Delete Confirmation Modals State
  const [deleteConfirmPo, setDeleteConfirmPo] = useState<any>(null);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Inline Purchase Order Form State (On-Page, Not a Modal!)
  const [showPoForm, setShowPoForm] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poPaidAmount, setPoPaidAmount] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poPaymentMode, setPoPaymentMode] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [isReceivedImmediately, setIsReceivedImmediately] = useState(true);
  const [poItems, setPoItems] = useState<{ productId: string; price: string; quantity: string }[]>([]);

  // Product Selection Search & Filter
  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Inline product creation modal state
  const [showInlineProdModal, setShowInlineProdModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');

  // Inline GRN Godown Receiving State & Checkboxes
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<any>(null);
  const [grnReceivedQtyMap, setGrnReceivedQtyMap] = useState<{ [itemId: string]: number }>({});
  const [grnCheckedItemsMap, setGrnCheckedItemsMap] = useState<{ [itemId: string]: boolean }>({});
  const [savingGrn, setSavingGrn] = useState(false);

  // PDF / Print Modal State
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<any>(null);
  const [showLedgerPrintModal, setShowLedgerPrintModal] = useState<boolean>(false);

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
          paymentDate: payDate,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayAmount('');
        setPayNotes('');
        setPayDate(new Date().toISOString().split('T')[0]);
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Purchase Order Action
  const confirmDeletePo = async () => {
    if (!deleteConfirmPo) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/purchases?id=${deleteConfirmPo.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmPo(null);
        loadSupplierData();
      } else {
        const err = await res.json();
        alert(`Failed to delete PO: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Supplier Account Action
  const confirmDeleteSupplierAccount = async () => {
    if (!supplier) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/suppliers?id=${supplier.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/suppliers';
      } else {
        const err = await res.json();
        alert(`Failed to delete supplier: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Multi-select product toggle handler
  const handleToggleProductSelection = (product: any) => {
    const existsIndex = poItems.findIndex((it) => it.productId === product.id);
    if (existsIndex >= 0) {
      // Remove product from order list
      setPoItems(poItems.filter((it) => it.productId !== product.id));
      setSelectedProductIds(selectedProductIds.filter((pid) => pid !== product.id));
    } else {
      // Add product to order list
      const initialPrice = (product.purchasePrice || product.sellingPrice || 0).toString();
      setPoItems([...poItems, { productId: product.id, price: initialPrice, quantity: '1' }]);
      setSelectedProductIds([...selectedProductIds, product.id]);
    }
  };

  const handleRemovePoItem = (index: number) => {
    const itemToRemove = poItems[index];
    if (itemToRemove) {
      setSelectedProductIds(selectedProductIds.filter((pid) => pid !== itemToRemove.productId));
    }
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePoItemChange = (index: number, field: string, value: string) => {
    const updated = [...poItems];
    (updated[index] as any)[field] = value;
    setPoItems(updated);
  };

  const totalOrderItemsCostInPoForm = poItems.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0;
    const q = parseFloat(item.quantity) || 0;
    return sum + p * q;
  }, 0);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = poItems.filter((it) => it.productId && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please select at least one product for the purchase order.');
      return;
    }

    // Calculate paid amount based on payment payout status selection
    let finalPaidAmount = 0;
    if (poPaymentMode === 'paid') {
      finalPaidAmount = totalOrderItemsCostInPoForm;
    } else if (poPaymentMode === 'partial') {
      finalPaidAmount = parseFloat(poPaidAmount) || 0;
    } else {
      finalPaidAmount = 0; // pending / unpaid
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: id,
          poNumber,
          items: validItems,
          paidAmount: finalPaidAmount,
          notes: poNotes,
          isReceivedImmediately,
        }),
      });

      if (res.ok) {
        setShowPoForm(false);
        setPoNumber('');
        setPoPaidAmount('');
        setPoNotes('');
        setPoItems([]);
        setSelectedProductIds([]);
        setPoPaymentMode('paid');
        loadSupplierData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Godown GRN Submission (Inline On-Page Panel)
  const openGrnModal = (po: any) => {
    setSelectedPoForGrn(po);
    const initialQtyMap: { [itemId: string]: number } = {};
    const initialCheckMap: { [itemId: string]: boolean } = {};
    if (po.items) {
      po.items.forEach((item: any) => {
        const alreadyRec = item.receivedQuantity || 0;
        initialQtyMap[item.id] = alreadyRec;
        initialCheckMap[item.id] = alreadyRec > 0;
      });
    }
    setGrnReceivedQtyMap(initialQtyMap);
    setGrnCheckedItemsMap(initialCheckMap);
    setTimeout(() => {
      document.getElementById('grn-inline-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleToggleGrnItemCheck = (item: any) => {
    const isCurrentlyChecked = !!grnCheckedItemsMap[item.id];
    const newCheckState = !isCurrentlyChecked;

    setGrnCheckedItemsMap({
      ...grnCheckedItemsMap,
      [item.id]: newCheckState,
    });

    if (newCheckState) {
      if (!grnReceivedQtyMap[item.id] || grnReceivedQtyMap[item.id] === 0) {
        setGrnReceivedQtyMap({
          ...grnReceivedQtyMap,
          [item.id]: item.quantity,
        });
      }
    } else {
      setGrnReceivedQtyMap({
        ...grnReceivedQtyMap,
        [item.id]: 0,
      });
    }
  };

  const handleToggleAllGrnItems = () => {
    if (!selectedPoForGrn || !selectedPoForGrn.items) return;
    const allChecked = selectedPoForGrn.items.every((it: any) => grnCheckedItemsMap[it.id]);

    const newCheckMap: { [itemId: string]: boolean } = {};
    const newQtyMap: { [itemId: string]: number } = {};

    selectedPoForGrn.items.forEach((it: any) => {
      newCheckMap[it.id] = !allChecked;
      newQtyMap[it.id] = !allChecked ? it.quantity : 0;
    });

    setGrnCheckedItemsMap(newCheckMap);
    setGrnReceivedQtyMap(newQtyMap);
  };

  const handleSaveGrn = async () => {
    if (!selectedPoForGrn) return;
    setSavingGrn(true);
    try {
      const itemsReceived = Object.entries(grnReceivedQtyMap).map(([itemId, receivedQty]) => ({
        itemId,
        receivedQty: grnCheckedItemsMap[itemId] ? receivedQty : 0,
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
    let text = `Hello ${supplier.name}, this is Sri Venkata Lakshmi Electricals.\nWe would like to place an order for ${poRefText}. Please check attached details.`;
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
          const newPrice = (data.purchasePrice || data.sellingPrice || 0).toString();
          setPoItems([...poItems, { productId: data.id, price: newPrice, quantity: '1' }]);
          setSelectedProductIds([...selectedProductIds, data.id]);
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

  // Active Tab Specific Metric Calculations
  const totalItemizedLines = supplier.purchaseOrders?.reduce(
    (sum: number, po: any) => sum + (po.items?.length || 0),
    0
  ) || 0;

  const totalItemsReceivedCount = supplier.purchaseOrders?.reduce(
    (sum: number, po: any) =>
      sum +
      (po.items?.reduce(
        (iSum: number, item: any) =>
          iSum + (item.receivedQuantity >= item.quantity ? 1 : 0),
        0
      ) || 0),
    0
  ) || 0;

  const totalItemsPendingCount = Math.max(0, totalItemizedLines - totalItemsReceivedCount);

  const fullyReceivedPoCount = supplier.purchaseOrders?.filter(
    (po: any) => po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED'
  ).length || 0;

  const pendingShipmentPoCount = Math.max(0, totalPoCount - fullyReceivedPoCount);

  const totalOrderDuesVal = supplier.purchaseOrders?.reduce(
    (sum: number, po: any) => sum + (po.dueAmount || 0),
    0
  ) || 0;

  const ledgerEntriesCount = supplier.ledger?.length || 0;

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

  // Filtered products list for multi-select search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(prodSearchTerm.toLowerCase()))
  );

  const allGrnItemsChecked =
    selectedPoForGrn?.items &&
    selectedPoForGrn.items.length > 0 &&
    selectedPoForGrn.items.every((it: any) => grnCheckedItemsMap[it.id]);

  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto pb-12">
      {/* Interactive Printable Wholesale PO Modal */}
      {selectedPoForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-start p-4 overflow-y-auto print:p-0 print:static print:bg-white print:overflow-visible">
          {/* Modal Header Controls (Hidden during print) */}
          <div className="print:hidden bg-slate-900 text-white w-full max-w-[850px] p-3 rounded-t-lg flex items-center justify-between shadow-md mb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#ffffe3]" />
              <span className="font-bold text-xs">Wholesale PO #{selectedPoForPrint.poNumber} PDF Preview</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>

              <button
                onClick={() => setSelectedPoForPrint(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs font-bold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>

          <div className="w-full print:w-full">
            <SupplierPOPrintTemplate po={selectedPoForPrint} supplier={supplier} settings={shopSettings} />
          </div>
        </div>
      )}

      {/* Interactive Printable Supplier Ledger Statement Modal */}
      {showLedgerPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-start p-4 overflow-y-auto print:p-0 print:static print:bg-white print:overflow-visible">
          {/* Modal Header Controls (Hidden during print) */}
          <div className="print:hidden bg-slate-900 text-white w-full max-w-[850px] p-3 rounded-t-lg flex items-center justify-between shadow-md mb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#ffffe3]" />
              <span className="font-bold text-xs">Supplier Account Statement PDF Preview ({supplier.name})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>

              <button
                onClick={() => setShowLedgerPrintModal(false)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs font-bold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>

          <div className="w-full print:w-full">
            <SupplierLedgerPrintTemplate supplier={supplier} settings={shopSettings} />
          </div>
        </div>
      )}

      {/* Screen View Header Controls */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#cbcbcb] shadow-xs">
        <Link
          href="/suppliers"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-2 font-bold bg-slate-100 border border-[#cbcbcb] px-3.5 py-2 rounded-[5px] transition-all shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-[#6d8196]" /> Back to Supplier Accounts
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLedgerPrintModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-[#4a4a4a] border border-[#cbcbcb] px-3.5 py-2 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-[#6d8196]" /> Print Ledger PDF
          </button>

          <button
            onClick={() => setShowPoForm(!showPoForm)}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> {showPoForm ? 'Hide Order Builder' : 'New Stock Purchase Order'}
          </button>

          {outstandingVal > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <DollarSign className="w-4 h-4" /> Pay Supplier Dues
            </button>
          )}

          <button
            onClick={() => handleWhatsAppReorder()}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Reorder
          </button>

          <button
            onClick={() => setDeleteConfirmSupplier(true)}
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-3.5 py-2 rounded-[5px] text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Delete Supplier Account"
          >
            <Trash2 className="w-4 h-4" /> Delete Supplier
          </button>
        </div>
      </div>

      {/* SUPPLIER FINANCIAL HEADER & METRICS CARDS */}
      <div className="print:hidden bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-xs space-y-5">
        {/* Supplier Profile Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#cbcbcb] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{supplier.name}</h1>
              {outstandingVal > 0 ? (
                <span className="px-3 py-1 rounded-[5px] text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> ₹{outstandingVal.toLocaleString('en-IN')} Due
                </span>
              ) : (
                <span className="px-3 py-1 rounded-[5px] text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
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
              onClick={() => setShowPoForm(true)}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-4 py-2.5 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" /> Create Wholesale Order
            </button>
          </div>
        </div>
      </div>

      {/* INLINE WHOLESALE STOCK PURCHASE ORDER BUILDER (INLINE PAGE FORM) */}
      {showPoForm && (
        <div className="print:hidden bg-white border-2 border-[#6d8196] rounded-[5px] shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#4a4a4a] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#6d8196]" /> New Wholesale Purchase Order Builder
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Supplier: <span className="font-bold text-[#4a4a4a]">{supplier.name}</span>
              </p>
            </div>
            <button
              onClick={() => setShowPoForm(false)}
              className="text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-[5px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
            {/* Header Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  PO / Bill Ref Number (Optional)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Delivery Receiving Mode
                </label>
                <select
                  value={isReceivedImmediately ? 'immediate' : 'godown'}
                  onChange={(e) => setIsReceivedImmediately(e.target.value === 'immediate')}
                  className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-bold focus:outline-none focus:border-[#6d8196] text-xs"
                >
                  <option value="immediate">Direct In-Hand Stock (Instant)</option>
                  <option value="godown">Pending Godown Arrival (Track Shipment)</option>
                </select>
              </div>
            </div>

            {/* PAYMENT PAYOUT STATUS SELECTION */}
            <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb] space-y-2">
              <label className="text-[#4a4a4a] uppercase text-[10px] font-extrabold block">
                Order Payment Payout Status (From Our Side)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPoPaymentMode('paid')}
                  className={`p-2.5 rounded-[5px] border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    poPaymentMode === 'paid'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs font-extrabold'
                      : 'bg-white border-[#cbcbcb] text-slate-700 hover:border-[#6d8196]'
                  }`}
                >
                  <span>🟢 Paid Fully</span>
                  <span className="font-mono text-[11px]">₹{totalOrderItemsCostInPoForm.toLocaleString('en-IN')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPoPaymentMode('pending')}
                  className={`p-2.5 rounded-[5px] border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    poPaymentMode === 'pending'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs font-extrabold'
                      : 'bg-white border-[#cbcbcb] text-slate-700 hover:border-[#6d8196]'
                  }`}
                >
                  <span>🟡 Unpaid / Pending Dues</span>
                  <span className="font-mono text-[11px]">₹{totalOrderItemsCostInPoForm.toLocaleString('en-IN')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPoPaymentMode('partial')}
                  className={`p-2.5 rounded-[5px] border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    poPaymentMode === 'partial'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-extrabold'
                      : 'bg-white border-[#cbcbcb] text-slate-700 hover:border-[#6d8196]'
                  }`}
                >
                  <span>🔵 Partial Advance</span>
                  <span className="text-[10px]">Custom Paid</span>
                </button>
              </div>

              {poPaymentMode === 'partial' && (
                <div className="pt-2 flex items-center gap-3 bg-white p-2.5 rounded-[5px] border border-blue-200">
                  <div className="w-1/2">
                    <label className="text-slate-600 text-[10px] font-bold block mb-1">Enter Advance Paid Now (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={poPaidAmount}
                      onChange={(e) => setPoPaidAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 font-bold font-mono text-emerald-700 focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>
                  <div className="w-1/2 text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">Remaining Pending Dues</span>
                    <span className="font-mono font-extrabold text-amber-700 text-sm">
                      ₹{Math.max(0, totalOrderItemsCostInPoForm - (parseFloat(poPaidAmount) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* MULTI-SELECT PRODUCTS SECTION */}
            <div className="border border-[#cbcbcb] rounded-[5px] p-4 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cbcbcb] pb-2">
                <div className="font-extrabold text-[#4a4a4a] text-xs flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#6d8196]" /> Multi-Select Products from Store Inventory
                  <span className="bg-[#6d8196] text-white px-2 py-0.5 rounded-full text-[10px]">
                    {poItems.length} Selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineProdModal(true)}
                    className="text-emerald-700 hover:underline text-[11px] flex items-center gap-1 font-bold bg-emerald-50 px-2.5 py-1 rounded-[5px] border border-emerald-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Create New Product
                  </button>
                </div>
              </div>

              {/* Product Live Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={prodSearchTerm}
                  onChange={(e) => setProdSearchTerm(e.target.value)}
                  placeholder="Search products by name or category to multi-select..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#cbcbcb] rounded-[5px] text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              {/* Multi-Select Products Grid */}
              <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-1 border border-[#cbcbcb] rounded-[5px] bg-white">
                {filteredProducts.length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 text-xs py-4 italic">
                    No matching products found. Click "+ Create New Product" to add one.
                  </p>
                ) : (
                  filteredProducts.map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProductSelection(prod)}
                        className={`p-2.5 rounded-[5px] border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                            : 'bg-slate-50/70 border-[#cbcbcb] hover:border-[#6d8196] hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#4a4a4a] text-xs truncate">{prod.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Stock: {prod.stockQuantity} {prod.unit || 'pcs'} • Rate: ₹
                            {prod.purchasePrice || prod.sellingPrice}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="bg-emerald-700 text-white p-1 rounded-full text-[10px] flex items-center gap-1 font-bold px-2">
                              <Check className="w-3 h-3" /> Added
                            </span>
                          ) : (
                            <span className="bg-slate-200 hover:bg-[#6d8196] hover:text-white text-slate-700 px-2 py-1 rounded-[5px] text-[10px] font-bold transition-colors">
                              + Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ORDER ITEMS EDITABLE TABLE */}
            {poItems.length > 0 && (
              <div className="border border-[#cbcbcb] rounded-[5px] p-3.5 bg-white space-y-3">
                <div className="font-extrabold text-[#4a4a4a] text-xs pb-1 border-b border-[#cbcbcb]">
                  Selected Order Items List ({poItems.length})
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {poItems.map((item, idx) => {
                    const matchedProd = products.find((p) => p.id === item.productId);
                    const lineSubtotal = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-[5px] border border-[#cbcbcb]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#4a4a4a] text-xs">
                            {matchedProd ? matchedProd.name : `Product #${idx + 1}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Stock: {matchedProd?.stockQuantity || 0} {matchedProd?.unit || 'pcs'}
                          </div>
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="text-[9px] uppercase font-bold text-slate-500 block">Unit Cost (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.price}
                            onChange={(e) => handlePoItemChange(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-[#4a4a4a] font-mono font-bold text-xs"
                          />
                        </div>

                        <div className="w-full sm:w-24">
                          <label className="text-[9px] uppercase font-bold text-slate-500 block">Order Qty</label>
                          <input
                            type="number"
                            step="1"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-2 py-1 text-[#4a4a4a] font-bold text-xs"
                          />
                        </div>

                        <div className="w-full sm:w-28 text-right sm:self-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Subtotal</span>
                          <span className="font-mono font-extrabold text-[#4a4a4a] text-xs">
                            ₹{lineSubtotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePoItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 self-center"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Footer & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 p-4 rounded-[5px] border border-[#cbcbcb]">
              <div className="w-full sm:w-2/3">
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Order Notes / Supplier Invoice Ref
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Wire rolls batch shipment bill ref #456"
                  className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] text-xs focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="text-right w-full sm:w-auto">
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Purchase Amount</div>
                <div className="text-2xl font-extrabold text-[#4a4a4a] font-mono">
                  ₹{totalOrderItemsCostInPoForm.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPoForm(false)}
                className="w-1/3 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2.5 rounded-[5px] font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2.5 rounded-[5px] font-bold shadow-sm transition-all"
              >
                Complete & Save Wholesale Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INLINE GODOWN GOODS RECEIVING NOTE (GRN) LOGGER - ON-PAGE PANEL */}
      {selectedPoForGrn && (
        <div id="grn-inline-panel" className="print:hidden bg-white border-2 border-amber-500/80 rounded-[5px] shadow-md p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#4a4a4a] flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-600" /> Log Godown Stock Arrival (GRN)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                PO #<span className="font-mono font-bold text-[#6d8196]">{selectedPoForGrn.poNumber}</span> • Check off only the items that arrived at your godown
              </p>
            </div>
            <button
              onClick={() => setSelectedPoForGrn(null)}
              className="text-slate-400 hover:text-slate-700 p-1 bg-slate-100 rounded-[5px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-[#ffffe3] p-3 rounded-[5px] border border-[#cbcbcb] text-amber-900 text-xs">
              <p className="font-semibold">
                📦 Check the box next to each item that has arrived in your godown.
                Only checked items will be added to store stock inventory!
              </p>
            </div>

            <div className="overflow-x-auto border border-[#cbcbcb] rounded-[5px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#4a4a4a] text-white font-bold text-[11px] uppercase">
                    <th className="py-2.5 px-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedPoForGrn.items?.length > 0 &&
                          selectedPoForGrn.items.every((it: any) => grnCheckedItemsMap[it.id])
                        }
                        onChange={handleToggleAllGrnItems}
                        className="w-4 h-4 cursor-pointer accent-[#6d8196]"
                        title="Select All Items Arrived"
                      />
                    </th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                    <th className="py-2.5 px-3 text-center">Arrived Qty</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedPoForGrn.items?.map((item: any) => {
                    const isChecked = !!grnCheckedItemsMap[item.id];
                    const curVal = grnReceivedQtyMap[item.id] ?? 0;

                    return (
                      <tr key={item.id} className={isChecked ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleGrnItemCheck(item)}
                            className="w-4 h-4 cursor-pointer accent-emerald-700"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-[#4a4a4a]">
                          <div className="flex items-center gap-1.5">
                            <span>{item.product?.name || item.productName || 'Stock Product'}</span>
                          </div>
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
                            disabled={!isChecked}
                            value={curVal}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseFloat(e.target.value) || 0));
                              setGrnReceivedQtyMap({
                                ...grnReceivedQtyMap,
                                [item.id]: val,
                              });
                            }}
                            className={`w-24 text-center border rounded-[5px] px-2 py-1 font-bold ${
                              isChecked
                                ? 'bg-white border-emerald-400 text-emerald-900 focus:outline-none focus:border-emerald-600'
                                : 'bg-slate-100 border-[#cbcbcb] text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {isChecked ? (
                            <span className="text-emerald-700 font-extrabold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Arrived ({curVal}/{item.quantity})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Not Arrived (0)</span>
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
                onClick={() => setSelectedPoForGrn(null)}
                className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2.5 rounded-[5px] font-bold hover:bg-slate-200"
              >
                Close Panel
              </button>
              <button
                type="button"
                disabled={savingGrn}
                onClick={handleSaveGrn}
                className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2.5 rounded-[5px] font-bold shadow-sm transition-all flex items-center justify-center gap-2"
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
      )}

      {/* MAIN CONTENT TABBED CONTAINER */}
      <div className="print:hidden bg-white border border-[#cbcbcb] rounded-[5px] shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-[#cbcbcb] bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('itemized')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 border-r border-[#cbcbcb] transition-colors ${
              activeTab === 'itemized'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#6d8196]" /> Daily Itemized Purchase Orders
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 border-r border-[#cbcbcb] transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#6d8196]" /> Wholesale POs & PDF Receipts ({totalPoCount})
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ledger'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-2xs'
                : 'text-slate-600 hover:text-[#4a4a4a]'
            }`}
          >
            <History className="w-4 h-4 text-[#6d8196]" /> Financial Ledger & Dues
          </button>
        </div>

        {/* TAB 1: DAILY ITEMIZED PURCHASE ORDERS */}
        {activeTab === 'itemized' && (
          <div className="p-5 space-y-6 text-xs">
            {/* Active Tab Specific Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b border-[#cbcbcb] pb-4">
              <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Total Line Items</span>
                  <Package className="w-3.5 h-3.5 text-[#6d8196]" />
                </div>
                <div className="text-xl font-extrabold text-[#4a4a4a]">{totalItemizedLines} <span className="text-xs font-semibold text-slate-500">Items</span></div>
                <p className="text-[10px] text-slate-500 mt-0.5">Ordered across all batches</p>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-[5px] border border-emerald-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
                  <span>Stock Arrived</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-extrabold text-emerald-800">{totalItemsReceivedCount} <span className="text-xs font-semibold text-emerald-600">Lines</span></div>
                <p className="text-[10px] text-emerald-700 mt-0.5">Godown inventory updated</p>
              </div>

              <div className="bg-amber-50 p-3 rounded-[5px] border border-amber-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center justify-between">
                  <span>Pending Stock</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-amber-900">{totalItemsPendingCount} <span className="text-xs font-semibold text-amber-700">Lines</span></div>
                <p className="text-[10px] text-amber-800 mt-0.5">Awaiting godown GRN</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Itemized Value</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-xl font-extrabold text-[#4a4a4a] font-mono">₹{totalPurchasedVal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Total stock purchased</p>
              </div>
            </div>
            {Object.keys(orderGroups).length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No stock purchase orders recorded for this supplier yet.
                <div className="mt-3">
                  <button
                    onClick={() => setShowPoForm(true)}
                    className="bg-[#6d8196] text-white px-4 py-2 rounded-[5px] font-bold text-xs"
                  >
                    + Create First Purchase Order
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(orderGroups).map(([dateLabel, pos]) => (
                <div key={dateLabel} className="border border-[#cbcbcb] rounded-[5px] overflow-hidden bg-white shadow-2xs">
                  {/* Date Section Header */}
                  <div className="bg-[#4a4a4a] text-white px-4 py-2.5 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#ffffe3]" />
                      <span className="text-xs uppercase tracking-wide">{dateLabel}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#ffffe3] font-mono">
                      {pos.length} Order{pos.length > 1 ? 's' : ''} • Day Total: ₹
                      {pos.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Orders under Date */}
                  <div className="divide-y divide-slate-200">
                    {pos.map((po: any) => {
                      const isCompleted = po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED';
                      const isPartial = po.status === 'PARTIAL_RECEIVED' || po.status === 'PARTIAL';

                      return (
                        <div key={po.id} className="p-4 space-y-3">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 font-bold text-[#4a4a4a] text-xs flex-wrap">
                                <span className="text-[#6d8196] font-mono text-sm">PO #{po.poNumber}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 font-medium">
                                  {new Date(po.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {/* Receiving Status Badge */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold flex items-center gap-1 ${
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
                                <div className="font-extrabold text-base text-[#4a4a4a] font-mono">
                                  ₹{po.totalAmount.toLocaleString('en-IN')}
                                </div>
                              </div>

                              <button
                                onClick={() => openGrnModal(po)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                                title="Log Godown Shipment Arrival"
                              >
                                <PackageCheck className="w-3.5 h-3.5 text-amber-700" /> Log GRN / Receive Stock
                              </button>

                              <button
                                onClick={() => handlePrintPo(po)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                                title="Print Wholesale Purchase Order PDF"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" /> Printable PDF
                              </button>

                              <button
                                onClick={() => handleWhatsAppReorder(po)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 p-1.5 rounded-[5px] text-xs font-bold"
                                title="Send PO on WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmPo(po)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-1.5 rounded-[5px] text-xs font-bold transition-colors"
                                title="Delete Purchase Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Itemized Stock Table for this Purchase Order */}
                          <div className="bg-slate-50 rounded-[5px] border border-[#cbcbcb] p-3 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#cbcbcb] text-slate-500 font-bold uppercase text-[10px]">
                                  <th className="pb-2 px-2 text-left">#</th>
                                  <th className="pb-2 px-2 text-left">Product Name & Spec</th>
                                  <th className="pb-2 px-2 text-right">Unit Cost</th>
                                  <th className="pb-2 px-2 text-center">Ordered Qty</th>
                                  <th className="pb-2 px-2 text-center">Godown Received Qty</th>
                                  <th className="pb-2 px-2 text-right">Total Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {po.items?.map((item: any, idx: number) => {
                                  const recQty = item.receivedQuantity ?? (isCompleted ? item.quantity : 0);
                                  const pendingQty = Math.max(0, item.quantity - recQty);

                                  return (
                                    <tr key={item.id} className="hover:bg-white transition-colors">
                                      <td className="py-2 px-2 text-left font-mono text-slate-400">{idx + 1}</td>
                                      <td className="py-2 px-2 text-left font-bold text-[#4a4a4a]">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-3.5 h-3.5 text-[#6d8196] shrink-0" />
                                          <span>{item.product?.name || item.productName || 'Stock Product'}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-2 text-right text-slate-600 font-mono">
                                        ₹{item.price.toLocaleString('en-IN')}
                                      </td>
                                      <td className="py-2 px-2 text-center font-extrabold text-slate-800">
                                        {item.quantity} {item.product?.unit || 'pcs'}
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span
                                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
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
                                      <td className="py-2 px-2 text-right font-extrabold text-[#4a4a4a] font-mono">
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
            {/* Active Tab Specific Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b border-[#cbcbcb] pb-4">
              <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Total Purchase Orders</span>
                  <FileText className="w-3.5 h-3.5 text-[#6d8196]" />
                </div>
                <div className="text-xl font-extrabold text-[#4a4a4a]">{totalPoCount} <span className="text-xs font-semibold text-slate-500">Orders</span></div>
                <p className="text-[10px] text-slate-500 mt-0.5">Stock order batches</p>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-[5px] border border-emerald-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
                  <span>Completed POs</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-extrabold text-emerald-800">{fullyReceivedPoCount} <span className="text-xs font-semibold text-emerald-600">Completed</span></div>
                <p className="text-[10px] text-emerald-700 mt-0.5">Stock received & verified</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-[5px] border border-blue-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1 flex items-center justify-between">
                  <span>In-Transit / Pending</span>
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-xl font-extrabold text-blue-900">{pendingShipmentPoCount} <span className="text-xs font-semibold text-blue-700">In-Transit</span></div>
                <p className="text-[10px] text-blue-800 mt-0.5">Awaiting godown arrival</p>
              </div>

              <div className="bg-[#ffffe3] p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center justify-between">
                  <span>Unpaid PO Dues</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-amber-900 font-mono">₹{totalOrderDuesVal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-amber-800 mt-0.5">Remaining PO balances</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
              <span className="font-bold text-[#4a4a4a]">Wholesale Purchase Orders Summary</span>
              <button
                onClick={() => setShowPoForm(true)}
                className="bg-[#6d8196] text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5"
              >
                + New Wholesale Order
              </button>
            </div>

            {supplier.purchaseOrders?.length > 0 ? (
              <div className="overflow-x-auto rounded-[5px] border border-[#cbcbcb]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#4a4a4a] text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 text-left">PO Number</th>
                      <th className="py-3 px-3 text-left">Date</th>
                      <th className="py-3 px-3 text-right">Total Amount</th>
                      <th className="py-3 px-3 text-right">Paid Amount</th>
                      <th className="py-3 px-3 text-right">Due Balance</th>
                      <th className="py-3 px-3 text-center">Receiving Status</th>
                      <th className="py-3 px-3 text-right">PDF & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {supplier.purchaseOrders.map((po: any) => {
                      const isCompleted = po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED';
                      const isPartial = po.status === 'PARTIAL_RECEIVED' || po.status === 'PARTIAL';

                      return (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-left font-bold text-[#6d8196] font-mono text-sm">{po.poNumber}</td>
                          <td className="py-3 px-3 text-left text-slate-600 font-medium">
                            {new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-[#4a4a4a] font-mono">
                            ₹{po.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">
                            ₹{po.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-700 font-mono">
                            ₹{po.dueAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold ${
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
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#cbcbcb] px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" /> PDF Order
                              </button>
                              <button
                                onClick={() => setDeleteConfirmPo(po)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Delete Purchase Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
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
          <div className="p-5 space-y-4 text-xs">
            {/* Active Tab Specific Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b border-[#cbcbcb] pb-4">
              <div className={`p-3 rounded-[5px] border ${outstandingVal > 0 ? 'bg-[#ffffe3] border-[#cbcbcb]' : 'bg-slate-50 border-[#cbcbcb]'}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Outstanding Dues</span>
                  <AlertTriangle className={`w-3.5 h-3.5 ${outstandingVal > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                </div>
                <div className={`text-xl font-extrabold font-mono ${outstandingVal > 0 ? 'text-amber-800' : 'text-slate-700'}`}>₹{outstandingVal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Net balance payable</p>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-[5px] border border-emerald-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
                  <span>Total Paid Payouts</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-extrabold text-emerald-800 font-mono">₹{totalPaidVal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-emerald-700 mt-0.5">Cleared payout payments</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Total Stock Bills</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-xl font-extrabold text-[#4a4a4a] font-mono">₹{totalPurchasedVal.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Total stock orders cost</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Ledger Records</span>
                  <History className="w-3.5 h-3.5 text-[#6d8196]" />
                </div>
                <div className="text-xl font-extrabold text-[#6d8196]">{ledgerEntriesCount} <span className="text-xs font-semibold text-slate-500">Entries</span></div>
                <p className="text-[10px] text-slate-500 mt-0.5">Audit log records</p>
              </div>
            </div>
            {supplier.ledger?.length > 0 ? (
              supplier.ledger.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-[5px] border flex items-center justify-between text-xs transition-all ${
                    entry.type === 'PURCHASE' ? 'bg-[#ffffe3] border-[#cbcbcb]' : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold ${
                          entry.type === 'PURCHASE' ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="font-bold text-[#4a4a4a] text-xs">{entry.notes}</span>
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
                      className={`font-extrabold text-base font-mono ${
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



      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#cbcbcb]">
            <h3 className="text-base font-extrabold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-3">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Record Supplier Payment Payout
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={outstandingVal}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-4 py-2.5 text-emerald-700 font-black text-xl focus:outline-none focus:border-[#6d8196] font-mono"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Completion Date</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] font-semibold focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Ref / Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid via NEFT / UPI Bank Transfer"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2.5 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-[5px] font-bold shadow-sm"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE CREATE PRODUCT MODAL */}
      {showInlineProdModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#cbcbcb]">
            <h3 className="text-base font-extrabold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-3">
              <Package className="w-4 h-4 text-emerald-700" /> Create Store Product Line
            </h3>
            <form onSubmit={handleCreateInlineProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Havells 4sqmm Red Wire"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="MRP / Selling"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] font-mono font-bold focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="Purchase Rate"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] font-mono font-bold focus:outline-none focus:border-[#6d8196]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInlineProdModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE PO MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirmPo}
        title="Delete Purchase Order"
        message={
          deleteConfirmPo
            ? `Are you sure you want to delete Purchase Order #${deleteConfirmPo.poNumber}? This will roll back received stock counts and revert supplier dues.`
            : ''
        }
        confirmText="Delete Order"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeletePo}
        onClose={() => setDeleteConfirmPo(null)}
      />

      {/* CONFIRMATION DELETE SUPPLIER MODAL */}
      <ConfirmModal
        isOpen={deleteConfirmSupplier}
        title="Delete Supplier Account"
        message={
          supplier
            ? `Are you sure you want to delete supplier account "${supplier.name}"? All associated purchase orders, inventory history, and ledgers will be permanently deleted.`
            : ''
        }
        confirmText="Delete Supplier"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteSupplierAccount}
        onClose={() => setDeleteConfirmSupplier(false)}
      />
    </div>
  );
}
