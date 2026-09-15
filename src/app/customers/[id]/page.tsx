'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
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
  X,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Filter,
  CreditCard,
  Receipt,
  Check,
  Boxes,
  Pencil,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import InvoicePrintTemplate from '@/components/InvoicePrintTemplate';
import ConfirmModal from '@/components/ConfirmModal';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'ledger' | 'invoices'>('products');
  const [collapsedInvoices, setCollapsedInvoices] = useState<{ [invId: string]: boolean }>({});

  // Edit Customer Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState('');
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  // Delete Customer state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const handleOpenEditModal = () => {
    if (!customer) return;
    setEditName(customer.name || '');
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditAddress(customer.address || '');
    setEditCreditLimit(customer.creditLimit ? String(customer.creditLimit) : '50000');
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setUpdatingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customer.id,
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          creditLimit: editCreditLimit,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        loadCustomerData();
      } else {
        alert(`❌ Update failed: ${data.error || 'Failed to update customer'}`);
      }
    } catch (err: any) {
      alert(`❌ Error updating customer: ${err.message}`);
    } finally {
      setUpdatingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    setDeletingCustomer(true);
    try {
      const res = await fetch(`/api/customers?id=${customer.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Customer "${customer.name}" deleted successfully.`);
        router.push('/customers');
      } else {
        alert(`❌ Delete failed: ${data.error || 'Failed to delete customer'}`);
      }
    } catch (err: any) {
      alert(`❌ Error deleting customer: ${err.message}`);
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Active Tabs: Edit Bill / Invoice State & Handlers
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editInvoiceItems, setEditInvoiceItems] = useState<any[]>([]);
  const [editInvoiceDiscount, setEditInvoiceDiscount] = useState('0');
  const [editInvoicePaidAmount, setEditInvoicePaidAmount] = useState('0');
  const [submittingInvoiceEdit, setSubmittingInvoiceEdit] = useState(false);

  const handleOpenEditInvoiceModal = (inv: any) => {
    setEditingInvoice(inv);
    setEditInvoiceItems(
      (inv.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        quantity: it.quantity,
        unit: it.unit || 'pcs',
        total: it.total,
        rackLocation: it.rackLocation || 'Default',
      }))
    );
    setEditInvoiceDiscount(String(inv.discount || 0));
    setEditInvoicePaidAmount(String(inv.paidAmount || 0));
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setSubmittingInvoiceEdit(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: editingInvoice.id,
          items: editInvoiceItems,
          discount: editInvoiceDiscount,
          paidAmount: editInvoicePaidAmount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingInvoice(null);
        loadCustomerData();
      } else {
        alert(`❌ Failed to update bill: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`❌ Error saving bill edit: ${err.message}`);
    } finally {
      setSubmittingInvoiceEdit(false);
    }
  };

  // Custom Confirmation Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteInvoice = (invoiceId: string, invoiceNo: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Bill & Invoice',
      message: `Are you sure you want to delete Invoice #${invoiceNo}? Outstanding customer credit balance and inventory product stock will be updated automatically.`,
      confirmText: 'Yes, Delete Invoice',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/invoices?id=${invoiceId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            loadCustomerData();
          } else {
            setConfirmModalState({
              isOpen: true,
              title: 'Delete Failed',
              message: data.error || 'Failed to delete invoice',
              confirmText: 'Close',
              confirmVariant: 'primary',
              onConfirm: () => setConfirmModalState((prev) => ({ ...prev, isOpen: false })),
            });
          }
        } catch (err: any) {
          console.error('Error deleting invoice:', err);
        }
      },
    });
  };

  const handleDeleteLedgerEntry = (ledgerId: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Payment / Ledger Record',
      message: 'Are you sure you want to delete this payment/ledger record? Outstanding customer balance will be adjusted automatically.',
      confirmText: 'Yes, Delete Record',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/customers?ledgerId=${ledgerId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            loadCustomerData();
          } else {
            setConfirmModalState({
              isOpen: true,
              title: 'Delete Failed',
              message: data.error || 'Failed to delete ledger record',
              confirmText: 'Close',
              confirmVariant: 'primary',
              onConfirm: () => setConfirmModalState((prev) => ({ ...prev, isOpen: false })),
            });
          }
        } catch (err: any) {
          console.error('Error deleting ledger entry:', err);
        }
      },
    });
  };

  // Ledger Filter State
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'PAYMENT' | 'SALE'>('ALL');

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Quick Add Product Purchase / Bill In-Page Form State
  const [showInPageAddBill, setShowInPageAddBill] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billItems, setBillItems] = useState<any[]>([]);
  const [billDiscount, setBillDiscount] = useState('0');
  const [billPaymentMode, setBillPaymentMode] = useState<'CREDIT' | 'CASH' | 'UPI' | 'CARD'>('CREDIT');
  const [billPaidNowAmount, setBillPaidNowAmount] = useState('0');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittingBill, setSubmittingBill] = useState(false);

  // PDF Bill Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [printerWidth, setPrinterWidth] = useState<'A4' | '80mm' | '58mm'>('A4');
  const [shopSettings, setShopSettings] = useState<any>(null);

  const handleOpenReceipt = (inv: any) => {
    setSelectedInvoice(inv);
    setShowReceiptModal(true);
  };

  const toggleInvoiceCollapse = (invId: string) => {
    setCollapsedInvoices((prev) => ({ ...prev, [invId]: !prev[invId] }));
  };

  const loadCustomerData = async () => {
    try {
      const [res, settingsRes] = await Promise.all([
        fetch(`/api/customers/${id}/ledger`),
        fetch('/api/settings'),
      ]);
      const data = await res.json();
      const settingsData = await settingsRes.json();
      setCustomer(data);
      if (settingsData) setShopSettings(settingsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCatalogProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCatalogProducts(data);
      }
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleToggleInPageAddBill = () => {
    if (!showInPageAddBill) {
      setBillItems([]);
      setBillSearchQuery('');
      setBillDiscount('0');
      setBillPaymentMode('CREDIT');
      setBillPaidNowAmount('0');
      setBillDate(new Date().toISOString().split('T')[0]);
      loadCatalogProducts();
    }
    setShowInPageAddBill(!showInPageAddBill);
  };

  const handleAddItemToBill = (product: any) => {
    const existingIndex = billItems.findIndex((it) => it.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...billItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].sellingPrice;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          id: product.id,
          name: product.name,
          unit: product.unit || 'pcs',
          sellingPrice: product.sellingPrice || 0,
          quantity: 1,
          total: product.sellingPrice || 0,
          stockQuantity: product.stockQuantity,
          rack: product.rack,
        },
      ]);
    }
  };

  const handleRemoveItemFromBill = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    const newQty = Math.max(0.1, qty);
    const updated = [...billItems];
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].sellingPrice;
    setBillItems(updated);
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    const newPrice = Math.max(0, price);
    const updated = [...billItems];
    updated[index].sellingPrice = newPrice;
    updated[index].total = updated[index].quantity * newPrice;
    setBillItems(updated);
  };

  // Calculate quick bill totals
  const subtotalBill = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountVal = parseFloat(billDiscount) || 0;
  const totalAmountBill = Math.max(0, subtotalBill - discountVal);

  const calculatePaidAndDue = () => {
    if (billPaymentMode === 'CREDIT') {
      const paid = Math.min(totalAmountBill, Math.max(0, parseFloat(billPaidNowAmount) || 0));
      return { paidAmount: paid, dueAmount: Math.max(0, totalAmountBill - paid) };
    } else {
      return { paidAmount: totalAmountBill, dueAmount: 0 };
    }
  };

  const handleCreateCustomerBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (billItems.length === 0) {
      alert('Please add at least one product to create the bill.');
      return;
    }

    setSubmittingBill(true);
    const { paidAmount, dueAmount } = calculatePaidAndDue();

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          items: billItems,
          subtotal: subtotalBill,
          discount: discountVal,
          tax: 0,
          totalAmount: totalAmountBill,
          paidAmount,
          dueAmount,
          paymentMethod: billPaymentMode,
          invoiceDate: billDate, // Pass selected bill date for previous data entry
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowInPageAddBill(false);
        setBillItems([]);
        loadCustomerData();
      } else {
        alert(`❌ Error creating bill: ${data.error || 'Failed to process'}`);
      }
    } catch (e: any) {
      alert(`❌ Error saving bill: ${e.message}`);
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          customerId: id,
          amount: payAmount,
          paymentMethod: payMethod,
          notes: payNotes,
          paymentDate: payDate,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayAmount('');
        setPayNotes('');
        setPayDate(new Date().toISOString().split('T')[0]);
        loadCustomerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsAppReminder = async () => {
    if (!customer) return;
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
      if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const [sendingAlert, setSendingAlert] = useState(false);

  const handleSendSmtpAlert = async () => {
    if (!customer) return;
    setSendingAlert(true);
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
        alert(`✅ ${data.message || 'SMTP Alert email sent successfully!'}`);
      } else {
        alert(`⚠️ Alert failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error sending SMTP email: ${e.message}`);
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Users className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading customer account details...
      </div>
    );
  }

  if (!customer || customer.error) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p>Customer account not found.</p>
        <Link href="/customers" className="text-[#6d8196] hover:underline mt-2 inline-block font-bold">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  // Filtered Products Search for Modal
  const filteredCatalogProducts = catalogProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(billSearchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(billSearchQuery))
  );

  // Group Invoices by Date (Today, Yesterday, Date)
  const groupInvoicesByDate = () => {
    if (!customer.invoices) return {};
    const groups: { [dateStr: string]: any[] } = {};

    const todayStr = new Date().toLocaleDateString('en-IN');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-IN');

    customer.invoices.forEach((inv: any) => {
      const d = new Date(inv.createdAt);
      const invDateStr = d.toLocaleDateString('en-IN');
      let displayKey = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (invDateStr === todayStr) {
        displayKey = `Today (${displayKey})`;
      } else if (invDateStr === yesterdayStr) {
        displayKey = `Yesterday (${displayKey})`;
      }

      if (!groups[displayKey]) groups[displayKey] = [];
      groups[displayKey].push(inv);
    });

    return groups;
  };

  const invoiceGroups = groupInvoicesByDate();

  // Aggregate All Products Purchased by this Customer across all invoices
  const getAllPurchasedProducts = () => {
    if (!customer.invoices) return [];
    const productMap: { [key: string]: any } = {};

    customer.invoices.forEach((inv: any) => {
      const isPaid = inv.dueAmount <= 0;
      (inv.items || []).forEach((item: any) => {
        const key = item.productName;
        if (!productMap[key]) {
          productMap[key] = {
            productName: item.productName,
            unit: item.unit,
            lastPrice: item.price,
            totalQuantity: 0,
            totalAmountSpent: 0,
            timesPurchased: 0,
            lastPurchasedAt: inv.createdAt,
            hasCreditDue: false,
          };
        }
        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalAmountSpent += item.total;
        productMap[key].timesPurchased += 1;
        if (!isPaid) productMap[key].hasCreditDue = true;
        if (new Date(inv.createdAt) > new Date(productMap[key].lastPurchasedAt)) {
          productMap[key].lastPurchasedAt = inv.createdAt;
          productMap[key].lastPrice = item.price;
        }
      });
    });

    return Object.values(productMap).sort((a, b) => b.totalAmountSpent - a.totalAmountSpent);
  };

  const allPurchasedProductsList = getAllPurchasedProducts();

  // Filtered Ledger Entries
  const filteredLedger = (customer.ledger || []).filter((entry: any) => {
    if (ledgerFilter === 'PAYMENT') return entry.type === 'PAYMENT';
    if (ledgerFilter === 'SALE') return entry.type === 'SALE';
    return true;
  });

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/customers"
          className="text-xs text-[#4a4a4a] hover:text-[#6d8196] flex items-center gap-1.5 font-bold bg-white border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] transition-colors shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Accounts
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#cbcbcb] px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Print Statement
          </button>
        </div>
      </div>

      {/* Credit Limit Warning Alert Banner */}
      {customer.outstanding > customer.creditLimit && (
        <div className="bg-red-50 border-2 border-red-300 rounded-[5px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-red-950">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-[5px] border border-red-300">
              <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-red-800">
                🚨 Credit Limit Exceeded Warning!
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                Current dues (₹{customer.outstanding.toLocaleString('en-IN')}) exceed maximum allowed credit limit (₹{customer.creditLimit.toLocaleString('en-IN')}) by <span className="font-black text-red-900 underline">₹{(customer.outstanding - customer.creditLimit).toLocaleString('en-IN')}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={handleSendSmtpAlert}
            disabled={sendingAlert}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 border border-red-400 disabled:opacity-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {sendingAlert ? 'Sending Email...' : 'Dispatch Alert Email Now'}
          </button>
        </div>
      )}

      {/* Customer Overview Card */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#cbcbcb] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#4a4a4a]">{customer.name}</h1>
              {customer.outstanding > customer.creditLimit ? (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" /> Credit Limit Exceeded
                </span>
              ) : customer.outstanding > 0 ? (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Credit Due
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Clear
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#6d8196]" /> {customer.email}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {customer.address}
                </span>
              )}
            </div>
          </div>

          <div className={`${customer.outstanding > customer.creditLimit ? 'bg-red-50 border-red-300' : 'bg-[#ffffe3] border-[#cbcbcb]'} p-4 rounded-[5px] border min-w-[220px] text-right shadow-sm`}>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Current Outstanding Balance</span>
            <div className={`text-3xl font-black ${customer.outstanding > customer.creditLimit ? 'text-red-700' : customer.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              ₹{customer.outstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">
              Credit Limit: ₹{customer.creditLimit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Lifetime Purchases</span>
            <div className="text-xl font-extrabold text-[#4a4a4a]">₹{customer.totalPurchases.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Paid Amount</span>
            <div className="text-xl font-extrabold text-emerald-700">₹{customer.totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Invoices Issued</span>
            <div className="text-xl font-extrabold text-[#6d8196]">{customer.invoices?.length || 0} Bills</div>
          </div>
        </div>
      </div>

      {/* IN-PAGE PRODUCT & BILL ENTRY CARD PANEL (NOT IN MODAL - DIRECTLY ON PAGE) */}
      {showInPageAddBill && (
        <div className="bg-white border-2 border-[#6d8196] rounded-[5px] p-5 shadow-lg space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#4a4a4a] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#6d8196]" /> Add Products & Record Bill for {customer.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Enter current or previous purchase data for this customer directly into their account ledger.
              </p>
            </div>
            <button
              onClick={() => setShowInPageAddBill(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
              title="Close Section"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Date Picker & Payment Mode Bar */}
            <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-700 block mb-1">
                  📅 Bill / Purchase Date <span className="text-[#6d8196] font-semibold">(Select previous date for past data entry)</span>
                </label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <MaterialSelect
                  label="Payment Type / Mode"
                  value={billPaymentMode}
                  onChange={(val: any) => setBillPaymentMode(val)}
                  options={[
                    { value: 'CREDIT', label: 'Credit Account Sale (Add to Udhar Balance)' },
                    { value: 'CASH', label: 'Cash Payment (Fully Paid Now)' },
                    { value: 'UPI', label: 'UPI / GPay / PhonePe (Fully Paid Now)' },
                    { value: 'CARD', label: 'Bank Transfer / Card (Fully Paid Now)' },
                  ]}
                />
              </div>
            </div>

            {/* Product Catalog Grid / Selector */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-extrabold uppercase text-[10px] block">
                  Inventory Catalog Products ({filteredCatalogProducts.length}) - Click to Add to Bill:
                </label>
                <span className="text-[10px] text-[#6d8196] font-bold bg-slate-200 px-2 py-0.5 rounded">
                  {billItems.length} Product(s) Selected
                </span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  placeholder="Type to filter inventory products by name, barcode..."
                  className="w-full pl-9 pr-3 py-2 border border-[#cbcbcb] rounded-[5px] bg-white text-xs font-semibold focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              {/* Catalog List */}
              <div className="max-h-60 overflow-y-auto border border-[#cbcbcb] rounded-[5px] bg-white divide-y divide-slate-100 shadow-inner">
                {loadingProducts ? (
                  <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Package className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading inventory catalog...
                  </div>
                ) : filteredCatalogProducts.length > 0 ? (
                  filteredCatalogProducts.map((prod) => {
                    const selectedInCart = billItems.find((it) => it.id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleAddItemToBill(prod)}
                        className={`p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors ${selectedInCart ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : ''
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Package className={`w-4 h-4 shrink-0 ${selectedInCart ? 'text-emerald-700' : 'text-[#6d8196]'}`} />
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">{prod.name}</span>
                            <span className="text-[10px] text-slate-500 block">
                              Unit: <span className="font-bold text-slate-700">{prod.unit}</span> • Stock Available:{' '}
                              <span className={prod.stockQuantity <= 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                                {prod.stockQuantity} {prod.unit}
                              </span>
                              {prod.barcode && ` • Barcode: ${prod.barcode}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div className="font-extrabold text-slate-900 font-mono text-sm">
                            ₹{prod.sellingPrice?.toLocaleString('en-IN')}
                          </div>
                          {selectedInCart ? (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded font-extrabold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" /> Added ({selectedInCart.quantity})
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="text-[10px] text-white bg-[#6d8196] hover:bg-[#5b6f84] px-2.5 py-1 rounded font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Select Product
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No matching products found in inventory catalog.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Products Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 text-xs flex items-center justify-between">
                <span>Selected Products for Bill ({billItems.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">Edit unit prices or quantities below</span>
              </h4>

              {billItems.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-[5px] text-slate-400">
                  Click products above to add them to this bill.
                </div>
              ) : (
                <div className="border border-[#cbcbcb] rounded-[5px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#4a4a4a] text-white font-bold text-[10px] uppercase">
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-2 text-right">Price (₹)</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Total (₹)</th>
                        <th className="py-2 px-2 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {billItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right border border-slate-300 rounded px-1.5 py-1 font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0.1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(idx, parseFloat(e.target.value) || 1)}
                                className="w-16 text-center border border-slate-300 rounded px-1.5 py-1 font-bold"
                              />
                              <span className="text-[10px] text-slate-500 font-semibold">{item.unit}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                            ₹{item.total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromBill(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary and Upfront Payment Section */}
            {billItems.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-700 block mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={billDiscount}
                      onChange={(e) => setBillDiscount(e.target.value)}
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs font-bold"
                      placeholder="0"
                    />
                  </div>

                  {billPaymentMode === 'CREDIT' && (
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-700 block mb-1">
                        Paid Upfront Now (₹) <span className="font-normal text-slate-500">(Rest will be added to credit balance)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmountBill}
                        value={billPaidNowAmount}
                        onChange={(e) => setBillPaidNowAmount(e.target.value)}
                        className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs font-bold font-mono text-emerald-700"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-[5px] border border-[#cbcbcb] space-y-1 text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">₹{subtotalBill.toLocaleString('en-IN')}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">-₹{discountVal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Total Bill Amount:</span>
                    <span className="font-mono font-black text-slate-900">₹{totalAmountBill.toLocaleString('en-IN')}</span>
                  </div>
                  {billPaymentMode === 'CREDIT' ? (
                    <div className="flex justify-between text-xs font-bold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                      <span>Adding to Udhar / Credit (Date: {billDate}):</span>
                      <span className="font-mono font-extrabold">₹{calculatePaidAndDue().dueAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-1">
                      <span>Status:</span>
                      <span>Paid Fully In Cash/UPI (Date: {billDate})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-200 justify-end">
              <button
                type="button"
                onClick={() => setShowInPageAddBill(false)}
                className="bg-slate-100 border border-[#cbcbcb] text-slate-700 px-4 py-2 rounded-[5px] font-bold hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomerBill}
                disabled={submittingBill || billItems.length === 0}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-5 py-2 rounded-[5px] font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-md"
              >
                {submittingBill ? (
                  'Saving Bill & Updating Customer Ledger...'
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Bill & Add Products to Customer Account ({billDate})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION BAR WITH EDIT AND DELETE ACTIONS */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#cbcbcb] bg-slate-50 text-xs font-bold gap-2 p-1">
          <div className="flex items-center overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2.5 px-3.5 flex items-center justify-center gap-1.5 border-r border-[#cbcbcb] transition-colors whitespace-nowrap rounded-t-[4px] ${activeTab === 'products'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
                }`}
            >
              <Boxes className="w-4 h-4 text-[#6d8196]" /> All Purchased Products ({allPurchasedProductsList.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-2.5 px-3.5 flex items-center justify-center gap-1.5 border-r border-[#cbcbcb] transition-colors whitespace-nowrap rounded-t-[4px] ${activeTab === 'ledger'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
                }`}
            >
              <History className="w-4 h-4 text-[#6d8196]" /> Financial Ledger & Payments ({customer.ledger?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-2.5 px-3.5 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap rounded-t-[4px] ${activeTab === 'invoices'
                ? 'bg-white text-[#6d8196] border-b-2 border-b-[#6d8196] font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-[#4a4a4a]'
                }`}
            >
              <FileText className="w-4 h-4 text-[#6d8196]" /> Invoices List ({customer.invoices?.length || 0})
            </button>
          </div>

        </div>

        {/* TAB 2: ALL PURCHASED PRODUCTS SUMMARY */}
        {activeTab === 'products' && (
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#4a4a4a] flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#6d8196]" /> Products Purchased by {customer.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Consolidated breakdown of all products, total quantities purchased, and spending history.
                </p>
              </div>
              <button
                onClick={handleToggleInPageAddBill}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Products
              </button>
            </div>

            {allPurchasedProductsList.length > 0 ? (
              <div className="overflow-x-auto border border-[#cbcbcb] rounded-[5px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#4a4a4a] text-white font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">Total Quantity Bought</th>
                      <th className="py-2.5 px-3 text-right">Last Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Amount Spent</th>
                      <th className="py-2.5 px-3 text-center">Bills Count</th>
                      <th className="py-2.5 px-3 text-center">Latest Purchase Date</th>
                      <th className="py-2.5 px-3 text-center">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {allPurchasedProductsList.map((prod: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-extrabold text-[#4a4a4a] flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#6d8196] shrink-0" />
                          <span>{prod.productName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 bg-slate-50 font-mono">
                          {prod.totalQuantity} {prod.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ₹{prod.lastPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold font-mono text-slate-900">
                          ₹{prod.totalAmountSpent.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          {prod.timesPurchased} Bill{prod.timesPurchased > 1 ? 's' : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {new Date(prod.lastPurchasedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {!prod.hasCreditDue ? (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Fully Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              Credit Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-300 rounded-[5px]">
                No products have been purchased by this customer yet.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: FINANCIAL LEDGER & PAYMENTS */}
        {activeTab === 'ledger' && (
          <div className="p-4 space-y-4 text-xs">
            {/* Ledger Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbcbcb] pb-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-[#cbcbcb]">
                <button
                  onClick={() => setLedgerFilter('ALL')}
                  className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all ${ledgerFilter === 'ALL'
                    ? 'bg-white text-[#4a4a4a] shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  All Transactions ({customer.ledger?.length || 0})
                </button>
                <button
                  onClick={() => setLedgerFilter('PAYMENT')}
                  className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all ${ledgerFilter === 'PAYMENT'
                    ? 'bg-emerald-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Payments Received ({customer.ledger?.filter((l: any) => l.type === 'PAYMENT').length || 0})
                </button>
                <button
                  onClick={() => setLedgerFilter('SALE')}
                  className={`px-3 py-1 rounded-[4px] text-[11px] font-bold transition-all ${ledgerFilter === 'SALE'
                    ? 'bg-amber-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Credit Sales ({customer.ledger?.filter((l: any) => l.type === 'SALE').length || 0})
                </button>
              </div>

              {customer.outstanding > 0 && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-[5px] text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Record Payment Received
                </button>
              )}
            </div>

            {/* Ledger Entries List */}
            {filteredLedger.length > 0 ? (
              <div className="space-y-2.5">
                {filteredLedger.map((entry: any) => {
                  const isPayment = entry.type === 'PAYMENT';
                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-[5px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm transition-all ${isPayment ? 'bg-emerald-50/70 border-emerald-300' : 'bg-[#ffffe3] border-[#cbcbcb]'
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold flex items-center gap-1 ${isPayment ? 'bg-emerald-700 text-white' : 'bg-amber-800 text-white'
                              }`}
                          >
                            {isPayment ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> PAYMENT RECEIVED
                              </>
                            ) : (
                              <>
                                <Receipt className="w-3 h-3" /> CREDIT SALE / BILL
                              </>
                            )}
                          </span>
                          <span className="font-extrabold text-[#4a4a4a] text-xs">{entry.notes}</span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-3">
                          <span>📅 {new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          {entry.invoice && (
                            <Link href={`/invoices/${entry.invoice.id}`} className="text-[#6d8196] font-mono font-bold hover:underline">
                              Invoice #{entry.invoice.invoiceNo}
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div
                          className={`font-black text-lg font-mono ${isPayment ? 'text-emerald-700' : 'text-amber-800'
                            }`}
                        >
                          {isPayment ? '-' : '+'}₹{entry.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-[11px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                            Running Balance: <span className="text-slate-900 font-extrabold font-mono">₹{entry.balance.toLocaleString('en-IN')}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteLedgerEntry(entry.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 p-1.5 rounded-[4px] text-[10px] font-bold"
                            title="Delete Ledger Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-300 rounded-[5px]">
                No ledger transactions found for this filter view.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES LIST (WITH ALL RECORDED ITEMS DISPLAYED) */}
        {activeTab === 'invoices' && (
          <div className="p-4 space-y-3.5 text-xs">
            {customer.invoices?.length > 0 ? (
              customer.invoices.map((inv: any) => {
                const isFullyPaid = inv.dueAmount <= 0;
                const isPartial = inv.paidAmount > 0 && inv.dueAmount > 0;
                const isCollapsed = collapsedInvoices[inv.id] === true;

                let paymentStatusBadge;
                if (isFullyPaid) {
                  paymentStatusBadge = (
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> PAID FULLY
                    </span>
                  );
                } else if (isPartial) {
                  paymentStatusBadge = (
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-blue-700" /> PARTIALLY PAID (Paid ₹{inv.paidAmount.toLocaleString('en-IN')})
                    </span>
                  );
                } else {
                  paymentStatusBadge = (
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-700" /> CREDIT (UNPAID)
                    </span>
                  );
                }

                return (
                  <div key={inv.id} className="border border-[#cbcbcb] rounded-[5px] overflow-hidden bg-white shadow-sm">
                    {/* Invoice Card Header */}
                    <div className="bg-slate-50 p-3 border-b border-[#cbcbcb] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 font-bold text-[#4a4a4a]">
                          <Link href={`/invoices/${inv.id}`} className="text-[#6d8196] hover:underline font-mono text-sm font-extrabold">
                            Invoice #{inv.invoiceNo}
                          </Link>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold">
                            📅 {new Date(inv.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300 uppercase">
                            {inv.paymentMethod} Mode
                          </span>
                          {paymentStatusBadge}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Total Recorded Items: <span className="font-bold text-slate-800">{inv.items?.length || 0} product(s)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-base text-slate-900 font-mono">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </div>
                          {inv.dueAmount > 0 ? (
                            <span className="text-[10px] text-amber-800 font-bold block bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Due: ₹{inv.dueAmount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-800 font-bold block bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Paid Fully
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenReceipt(inv)}
                            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-2.5 py-1.5 rounded-[5px] text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                            title="Open & Print A4 GST PDF Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF Bill
                          </button>
                          <button
                            onClick={() => handleOpenEditInvoiceModal(inv)}
                            className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded-[5px] text-[11px] font-bold"
                            title="Edit Bill & Items"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNo)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-[5px] text-[11px] font-bold"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleInvoiceCollapse(inv.id)}
                            className="bg-white hover:bg-slate-100 text-slate-700 p-1.5 rounded-[5px] border border-[#cbcbcb]"
                            title="Toggle Recorded Items Table"
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* All Items Recorded in this Invoice */}
                    {!isCollapsed && (
                      <div className="p-3 bg-white overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-[5px]">
                          <thead>
                            <tr className="bg-[#4a4a4a] text-white font-bold text-[10px] uppercase">
                              <th className="py-2 px-3">Date Purchased</th>
                              <th className="py-2 px-3">Product Name</th>
                              <th className="py-2 px-3 text-right">Unit Price (₹)</th>
                              <th className="py-2 px-3 text-center">Quantity</th>
                              <th className="py-2 px-3 text-right">Total Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {inv.items?.map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-600 whitespace-nowrap text-[11px]">
                                  📅 {new Date(item.createdAt || inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-2 px-3 font-bold text-[#4a4a4a]">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#6d8196] shrink-0" />
                                    <span>{item.productName}</span>
                                    {item.rackLocation && (
                                      <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
                                        📍 {item.rackLocation}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-slate-900 font-mono">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-2 px-3 text-right font-extrabold font-mono text-slate-900">
                                  ₹{item.total.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-300 rounded-[5px]">
                No invoices generated for this customer yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Record Credit Payment
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={customer.outstanding}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${customer.outstanding}`}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-emerald-700 font-bold text-lg focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <MaterialSelect
                  label="Payment Method"
                  value={payMethod}
                  onChange={(val) => setPayMethod(val)}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                    { value: 'CARD', label: 'Bank Transfer / Card' },
                  ]}
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
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Notes / Receipt Ref</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received via PhonePe"
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
                  Clear Credit Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT / VIEW RECEIPT MODAL */}
      {showReceiptModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-3xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6d8196]" /> Invoice #{selectedInvoice.invoiceNo} - {selectedInvoice.customerName || customer.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-48">
                  <MaterialSelect
                    value={printerWidth}
                    onChange={(val: any) => setPrinterWidth(val)}
                    options={[
                      { value: 'A4', label: 'A4 GST Tax Invoice (PDF)' },
                      { value: '80mm', label: '80mm Thermal' },
                      { value: '58mm', label: '58mm Thermal' },
                    ]}
                  />
                </div>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] overflow-y-auto min-h-0">
              <InvoicePrintTemplate
                invoice={{
                  ...selectedInvoice,
                  customerName: selectedInvoice.customerName || customer.name,
                  customerPhone: selectedInvoice.customerPhone || customer.phone,
                  customerAddress: selectedInvoice.customerAddress || customer.address,
                }}
                settings={shopSettings}
                format={printerWidth as any}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" /> Edit Customer Account Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Email Address (Optional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. ramesh@gmail.com"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Address (Optional)</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Shop #12, Main Market"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Credit Limit (₹)</label>
                <input
                  type="number"
                  required
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#cbcbcb]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCustomer}
                  className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-[5px] font-bold transition-all disabled:opacity-50"
                >
                  {updatingCustomer ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-300 rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-red-200 pb-3">
              <div className="bg-red-100 p-2 rounded-full border border-red-300">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-red-900">Delete Customer Account</h3>
                <p className="text-xs text-red-700 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Are you sure you want to permanently delete customer account <span className="font-bold text-slate-900">"{customer.name}"</span> ({customer.phone})? All associated invoice history and ledger records will be removed.
            </p>

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deletingCustomer}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-[5px] font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingCustomer ? 'Deleting...' : 'Yes, Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BILL / INVOICE MODAL (For Active Tabs) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" /> Edit Bill #{editingInvoice.invoiceNo} & Item Prices
              </h3>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-slate-700 font-bold uppercase text-[10px] block mb-1">Products & Items in this Bill:</label>
                <div className="border border-[#cbcbcb] rounded-[5px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#4a4a4a] text-white font-bold text-[10px] uppercase">
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-2 text-right">Price (₹)</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Total (₹)</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {editInvoiceItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => {
                                const updated = [...editInvoiceItems];
                                updated[idx].productName = e.target.value;
                                setEditInvoiceItems(updated);
                              }}
                              className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-bold"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.price}
                              onChange={(e) => {
                                const p = parseFloat(e.target.value) || 0;
                                const updated = [...editInvoiceItems];
                                updated[idx].price = p;
                                updated[idx].total = p * updated[idx].quantity;
                                setEditInvoiceItems(updated);
                              }}
                              className="w-24 text-right border border-slate-300 rounded px-1.5 py-1 font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => {
                                const q = parseFloat(e.target.value) || 1;
                                const updated = [...editInvoiceItems];
                                updated[idx].quantity = q;
                                updated[idx].total = updated[idx].price * q;
                                setEditInvoiceItems(updated);
                              }}
                              className="w-16 text-center border border-slate-300 rounded px-1.5 py-1 font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditInvoiceItems(editInvoiceItems.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb]">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editInvoiceDiscount}
                    onChange={(e) => setEditInvoiceDiscount(e.target.value)}
                    className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">Paid Upfront Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editInvoicePaidAmount}
                    onChange={(e) => setEditInvoicePaidAmount(e.target.value)}
                    className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#cbcbcb]">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoiceEdit || editInvoiceItems.length === 0}
                  className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-[5px] font-bold transition-all disabled:opacity-50"
                >
                  {submittingInvoiceEdit ? 'Saving Bill Changes...' : 'Save Bill Changes'}
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
