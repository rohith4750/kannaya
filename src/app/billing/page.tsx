'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  CheckCircle,
  AlertCircle,
  User,
  Barcode,
  Layers,
  MessageSquare,
  X,
  Zap,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import InvoicePrintTemplate from '@/components/InvoicePrintTemplate';

export default function BillingPOSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('ALL');

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  // Loose Hardware Modal State
  const [showLooseHardwareModal, setShowLooseHardwareModal] = useState(false);
  const [looseItemTitle, setLooseItemTitle] = useState('');
  const [looseItemPrice, setLooseItemPrice] = useState('');
  const [looseItemQty, setLooseItemQty] = useState('1');
  const [looseItemUnit, setLooseItemUnit] = useState('pcs');

  // Quick Misc Amount State
  const [quickMiscAmount, setQuickMiscAmount] = useState('');

  const addQuickMiscItem = (amount: number, name = 'Miscellaneous Hardware Item') => {
    if (!amount || amount <= 0) return;
    const customId = `misc-${Date.now()}`;
    const itemObj = {
      id: customId,
      name: `${name} (₹${amount})`,
      barcode: 'MISC-HARDWARE',
      sellingPrice: amount,
      effectivePrice: amount,
      quantity: 1,
      unit: 'pcs',
      stockQuantity: 999,
      minStockAlert: 0,
      rack: { rackName: 'Misc Bin', shelfCode: 'General' },
      brand: { name: 'Miscellaneous' },
    };
    setCart((prevCart) => [...prevCart, itemObj]);
    setQuickMiscAmount('');
  };

  // Billing Fields
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');

  // Thermal Receipt & Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>('80mm');
  const [loading, setLoading] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number>(5);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (showReceiptModal) {
      setAutoCloseCountdown(5);
      interval = setInterval(() => {
        setAutoCloseCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowReceiptModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showReceiptModal]);

  const loadData = async () => {
    try {
      const [prodRes, custRes, settingsRes, brandRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/settings'),
        fetch('/api/brands'),
        fetch('/api/categories'),
      ]);
      const prods = await prodRes.json();
      const custs = await custRes.json();
      const settings = await settingsRes.json();
      const bData = await brandRes.json();
      const cData = await catRes.json();

      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(custs)) setCustomers(custs);
      if (Array.isArray(bData)) setBrands(bData);
      if (Array.isArray(cData)) setCategories(cData);
      if (settings) {
        if (settings.printerType) setPrinterWidth(settings.printerType as any);
        if (settings.defaultGstPercent !== undefined) setTaxPercent(settings.defaultGstPercent);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find((cust) => cust.id === selectedCustomerId);
      setSelectedCustomer(c || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, customers]);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesBrand =
      selectedBrandId === 'ALL' ||
      p.brandId === selectedBrandId ||
      (p.brand && p.brand.id === selectedBrandId);

    if (!matchesBrand) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.name.toLowerCase().includes(q)) ||
      (p.category && p.category.name.toLowerCase().includes(q))
    );
  });

  const displayProducts = filteredProducts.slice(0, 150);

  const handleAddLooseHardwareItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!looseItemTitle || !looseItemPrice) return;
    const itemPrice = parseFloat(looseItemPrice) || 0;
    const itemQty = parseFloat(looseItemQty) || 1;
    const customId = `loose-${Date.now()}`;

    const looseItemObj = {
      id: customId,
      name: looseItemTitle,
      barcode: 'LOOSE-HARDWARE',
      sellingPrice: itemPrice,
      effectivePrice: itemPrice,
      quantity: itemQty,
      unit: looseItemUnit,
      stockQuantity: 999,
      minStockAlert: 0,
      rack: { rackName: 'Hardware Bin', shelfCode: 'Loose' },
      brand: { name: 'Loose Hardware' },
    };

    setCart([...cart, looseItemObj]);
    setShowLooseHardwareModal(false);
    setLooseItemTitle('');
    setLooseItemPrice('');
    setLooseItemQty('1');
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const exactMatch = products.find(
        (p) => p.barcode === searchQuery.trim() || (p.sku && p.sku === searchQuery.trim())
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  };

  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + 1;
      const effectivePrice =
        product.wholesalePrice && newQty >= (product.minWholesaleQty || 10)
          ? product.wholesalePrice
          : product.sellingPrice;
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].effectivePrice = effectivePrice;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          effectivePrice: product.sellingPrice,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            const effectivePrice =
              item.wholesalePrice && newQty >= (item.minWholesaleQty || 10)
                ? item.wholesalePrice
                : item.sellingPrice;
            return newQty > 0 ? { ...item, quantity: newQty, effectivePrice } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.effectivePrice || item.sellingPrice) * item.quantity,
    0
  );
  const taxAmount = (subtotal * taxPercent) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);
  const paidAmount = paidAmountInput !== '' ? parseFloat(paidAmountInput) : totalAmount;
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
          customerPhone: selectedCustomer ? selectedCustomer.phone : 'N/A',
          items: cart.map((c) => ({ ...c, sellingPrice: c.effectivePrice || c.sellingPrice })),
          subtotal,
          discount,
          tax: taxAmount,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReceiptData({
          invoice: data.invoice,
          customer: data.customer,
          settings: data.settings,
        });
        setShowReceiptModal(true);
        setCart([]);
        setDiscount(0);
        setPaidAmountInput('');
        loadData();
      } else {
        alert(`Billing Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Transaction failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintThermal = () => {
    window.print();
  };

  const handleWhatsAppShare = async () => {
    if (!receiptData?.invoice) return;
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bill',
          customerPhone: receiptData.invoice.customerPhone,
          customerName: receiptData.invoice.customerName,
          invoiceNo: receiptData.invoice.invoiceNo,
          totalAmount: receiptData.invoice.totalAmount,
          dueAmount: receiptData.invoice.dueAmount,
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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3.5 overflow-hidden">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[5px] border border-[#cbcbcb] p-3.5 overflow-hidden shadow-sm h-full">
        {/* Brand Filter Pills Bar */}
        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 shrink-0 custom-scrollbar text-xs">
          <span className="text-[10px] font-extrabold uppercase text-[#4a4a4a] mr-1 shrink-0">Brand:</span>
          <button
            onClick={() => setSelectedBrandId('ALL')}
            className={`px-2.5 py-1 rounded-[5px] text-[11px] font-bold transition-all shrink-0 border ${
              selectedBrandId === 'ALL'
                ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm'
                : 'bg-slate-100 text-slate-700 border-[#cbcbcb] hover:bg-slate-200'
            }`}
          >
            All Brands ({products.length})
          </button>
          {brands.map((b) => {
            const count = products.filter((p) => p.brandId === b.id || p.brand?.id === b.id).length;
            if (count === 0) return null;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBrandId(b.id)}
                className={`px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-all shrink-0 border ${
                  selectedBrandId === b.id
                    ? 'bg-[#6d8196] text-white border-[#6d8196] shadow-sm font-bold'
                    : 'bg-slate-50 text-slate-700 border-[#cbcbcb] hover:bg-slate-100'
                }`}
              >
                {b.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Loose Hardware Toolbar */}
        <div className="flex gap-2.5 mb-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Search product name, barcode, brand, or SKU..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-10 pr-4 py-2 text-xs text-[#4a4a4a] placeholder-slate-400 focus:outline-none focus:border-[#6d8196] focus:bg-white"
            />
          </div>

          <button
            onClick={() => setShowLooseHardwareModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-[5px] text-xs flex items-center gap-1.5 shadow-sm transition-all border border-[#cbcbcb]/40 shrink-0"
            title="Add Detailed Loose Hardware (Screws, Nuts, Wires, Tape)"
          >
            <Plus className="w-4 h-4" /> Loose Hardware Item
          </button>
        </div>

        {/* Instant Quick Misc Amount Bar */}
        <div className="bg-[#ffffe3] border border-[#cbcbcb] rounded-[5px] p-2 mb-3 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#4a4a4a]">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>Quick Misc Amount:</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addQuickMiscItem(parseFloat(quickMiscAmount));
            }}
            className="flex items-center gap-1.5 flex-1 max-w-xs"
          >
            <input
              type="number"
              step="1"
              value={quickMiscAmount}
              onChange={(e) => setQuickMiscAmount(e.target.value)}
              placeholder="Enter amount (e.g. 20, 50, 100)..."
              className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-2.5 py-1 text-xs font-bold text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
            />
            <button
              type="submit"
              disabled={!quickMiscAmount || parseFloat(quickMiscAmount) <= 0}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3 py-1 rounded-[5px] text-xs transition-all shadow-sm shrink-0 disabled:opacity-50 border border-[#cbcbcb]/40"
            >
              + Add Misc
            </button>
          </form>

          {/* Quick Preset Amount Pills */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => addQuickMiscItem(10)}
              className="bg-white hover:bg-slate-100 border border-[#cbcbcb] text-slate-800 font-bold px-2 py-1 rounded-[4px] text-[11px] transition-colors shadow-sm"
              title="Add ₹10 Misc Item"
            >
              + ₹10
            </button>
            <button
              type="button"
              onClick={() => addQuickMiscItem(20)}
              className="bg-white hover:bg-slate-100 border border-[#cbcbcb] text-slate-800 font-bold px-2 py-1 rounded-[4px] text-[11px] transition-colors shadow-sm"
              title="Add ₹20 Misc Item"
            >
              + ₹20
            </button>
            <button
              type="button"
              onClick={() => addQuickMiscItem(50)}
              className="bg-white hover:bg-slate-100 border border-[#cbcbcb] text-slate-800 font-bold px-2 py-1 rounded-[4px] text-[11px] transition-colors shadow-sm"
              title="Add ₹50 Misc Item"
            >
              + ₹50
            </button>
            <button
              type="button"
              onClick={() => addQuickMiscItem(100)}
              className="bg-white hover:bg-slate-100 border border-[#cbcbcb] text-slate-800 font-bold px-2 py-1 rounded-[4px] text-[11px] transition-colors shadow-sm"
              title="Add ₹100 Misc Item"
            >
              + ₹100
            </button>
          </div>
        </div>

        {/* Clean Flat Product Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min content-start custom-scrollbar">
          {displayProducts.length > 0 ? (
            displayProducts.map((product) => {
              const isLowStock = product.stockQuantity <= product.minStockAlert;
              const inCart = cart.find((item) => item.id === product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className={`text-left p-3 rounded-[5px] border transition-all flex flex-col justify-between relative group min-h-[135px] ${
                    product.stockQuantity <= 0
                      ? 'opacity-40 bg-slate-100 border-[#cbcbcb] cursor-not-allowed'
                      : inCart
                      ? 'bg-[#ffffe3] border-[#6d8196] shadow-sm ring-1 ring-[#6d8196]'
                      : 'bg-white border-[#cbcbcb] hover:border-[#6d8196] hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-1 pr-5">
                      <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 flex items-center gap-1 shrink-0">
                        <Layers className="w-2.5 h-2.5 text-[#6d8196]" />
                        {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
                      </span>
                      <span className="text-[10px] font-bold text-[#6d8196] truncate max-w-[80px] text-right">
                        {product.brand?.name}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#4a4a4a] line-clamp-2 leading-snug group-hover:text-[#6d8196]">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#cbcbcb]/70 flex items-center justify-between">
                    <div className="text-xs font-bold text-[#4a4a4a]">
                      ₹{product.sellingPrice}
                      <span className="text-[9px] font-normal text-slate-500">/{product.unit}</span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] ${
                        isLowStock ? 'bg-rose-100 text-rose-700 border border-rose-200 font-semibold' : 'bg-slate-100 text-slate-600 border border-[#cbcbcb]/50'
                      }`}
                    >
                      Stock: {product.stockQuantity}
                    </span>
                  </div>

                  {inCart && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[3px] bg-[#6d8196] text-white font-bold text-[10px] shadow-sm flex items-center justify-center">
                      {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center text-slate-400 text-xs font-medium">
              No matching products found.
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Checkout */}
      <div className="w-full lg:w-[400px] bg-white border border-[#cbcbcb] rounded-[5px] flex flex-col h-full overflow-hidden shadow-sm shrink-0">
        {/* Customer Selector */}
        <div className="p-3 border-b border-[#cbcbcb] bg-slate-50 shrink-0">
          <MaterialSelect
            label="Customer Credit Account"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            options={[
              { value: '', label: 'Walk-in Customer (Cash Sale)' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.phone}) - Due: ₹${c.outstanding}`,
              })),
            ]}
          />
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 divide-y divide-[#cbcbcb]">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-[3px] bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20">
                      {item.rack ? `${item.rack.rackName} ${item.rack.shelfCode}` : 'Rack A1'}
                    </span>
                    <h5 className="text-xs font-semibold text-[#4a4a4a] truncate">{item.name}</h5>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    ₹{item.effectivePrice || item.sellingPrice} x {item.quantity} {item.unit} ={' '}
                    <span className="text-[#4a4a4a] font-semibold">
                      ₹{(item.effectivePrice || item.sellingPrice) * item.quantity}
                    </span>
                    {item.effectivePrice && item.effectivePrice < item.sellingPrice && (
                      <span className="text-amber-700 font-semibold text-[9px] ml-1">(Wholesale!)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-[#cbcbcb]">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-[#4a4a4a] hover:text-[#6d8196]">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold text-[#4a4a4a]">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-[#4a4a4a] hover:text-[#6d8196]">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Calculations & Submit */}
        <div className="p-3 border-t border-[#cbcbcb] bg-slate-50 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold">Discount (₹)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full mt-1 bg-white border border-[#cbcbcb] rounded-[5px] px-2.5 py-1 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
              />
            </div>
            <div>
              <MaterialSelect
                label="Payment Mode"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'UPI', label: 'UPI / QR' },
                  { value: 'CREDIT', label: 'Credit Account' },
                  { value: 'CARD', label: 'Card' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold">Paid Amount (₹)</label>
              <input
                type="number"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={`₹${totalAmount}`}
                className="w-full mt-1 bg-white border border-[#cbcbcb] rounded-[5px] px-2.5 py-1 text-[#4a4a4a] font-semibold focus:outline-none focus:border-[#6d8196]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 uppercase font-semibold">Due Balance (Credit)</label>
              <div className="mt-1 bg-white border border-[#cbcbcb] rounded-[5px] px-2.5 py-1 text-amber-700 font-semibold">
                ₹{dueAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#cbcbcb] flex items-center justify-between text-xs">
            <span className="text-[#4a4a4a] font-semibold">Grand Total</span>
            <span className="text-base font-bold text-[#4a4a4a]">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={handleGenerateBill}
            disabled={loading || cart.length === 0}
            className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2.5 rounded-[5px] flex items-center justify-center gap-2 shadow-sm text-xs transition-all disabled:opacity-50 border border-[#cbcbcb]/40"
          >
            <Printer className="w-4 h-4" />
            {loading ? 'Processing...' : 'Generate Bill & Print Thermal Receipt'}
          </button>
        </div>
      </div>

      {/* THERMAL PRINT RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-700" /> Invoice Generated
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-0.5">
                  ⏱️ Auto-closing in {autoCloseCountdown}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-48">
                  <MaterialSelect
                    value={printerWidth}
                    onChange={(val) => setPrinterWidth(val as any)}
                    options={[
                      { value: 'A4', label: 'A4 GST Tax Invoice (PDF)' },
                      { value: '80mm', label: '80mm Thermal' },
                      { value: '58mm', label: '58mm Thermal' },
                    ]}
                  />
                </div>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-[#4a4a4a] p-1" title="Close Now">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Template Container */}
            <div className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] max-h-[440px] overflow-y-auto">
              <InvoicePrintTemplate
                invoice={receiptData.invoice}
                settings={receiptData.settings}
                format={printerWidth as any}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintThermal}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold py-2.5 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" /> Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOOSE HARDWARE QUICK ITEM MODAL */}
      {showLooseHardwareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" /> Add Loose Hardware Item
              </h3>
              <button onClick={() => setShowLooseHardwareModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLooseHardwareItem} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Item Description / Name</label>
                <input
                  type="text"
                  required
                  value={looseItemTitle}
                  onChange={(e) => setLooseItemTitle(e.target.value)}
                  placeholder="e.g. Screws & Wall Plugs / Loose Wire 5m / PVC Clips"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={looseItemPrice}
                    onChange={(e) => setLooseItemPrice(e.target.value)}
                    placeholder="20.00"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-bold focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Quantity</label>
                  <input
                    type="number"
                    required
                    value={looseItemQty}
                    onChange={(e) => setLooseItemQty(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-bold focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <MaterialSelect
                  label="Unit"
                  value={looseItemUnit}
                  onChange={(val) => setLooseItemUnit(val)}
                  options={[
                    { value: 'pcs', label: 'pcs (Pieces)' },
                    { value: 'meter', label: 'meter (Meters)' },
                    { value: 'pkt', label: 'pkt (Packets)' },
                    { value: 'box', label: 'box (Boxes)' },
                    { value: 'roll', label: 'roll (Rolls)' },
                    { value: 'set', label: 'set (Sets)' },
                  ]}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#cbcbcb]">
                <button
                  type="button"
                  onClick={() => setShowLooseHardwareModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-slate-700 py-2 rounded-[5px] font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-[5px] font-bold shadow-sm"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
