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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
      ]);
      const prods = await prodRes.json();
      const custs = await custRes.json();
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(custs)) setCustomers(custs);
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
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.name.toLowerCase().includes(q)) ||
      (p.category && p.category.name.toLowerCase().includes(q))
    );
  });

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
    <div className="h-full flex flex-col lg:flex-row gap-5 overflow-hidden">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[5px] border border-[#cbcbcb] p-4 overflow-hidden shadow-sm">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Scan Barcode or Search product..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-10 pr-4 py-2 text-xs text-[#4a4a4a] placeholder-slate-400 focus:outline-none focus:border-[#6d8196] focus:bg-white"
            />
          </div>
          <div className="bg-[#6d8196]/10 border border-[#6d8196]/30 px-3 py-2 rounded-[5px] flex items-center gap-2 text-xs font-bold text-[#6d8196]">
            <Barcode className="w-4 h-4" /> Barcode Active
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {filteredProducts.map((product) => {
            const isLowStock = product.stockQuantity <= product.minStockAlert;
            const inCart = cart.find((item) => item.id === product.id);

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity <= 0}
                className={`text-left p-2.5 rounded-[5px] border transition-all flex flex-col justify-between relative group ${
                  product.stockQuantity <= 0
                    ? 'opacity-40 bg-slate-100 border-[#cbcbcb] cursor-not-allowed'
                    : inCart
                    ? 'bg-[#ffffe3] border-[#6d8196] shadow-sm ring-1 ring-[#6d8196]'
                    : 'bg-white border-[#cbcbcb] hover:border-[#6d8196] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-1 pr-6">
                  <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 flex items-center gap-1 shrink-0">
                    <Layers className="w-2.5 h-2.5 text-[#6d8196]" />
                    {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 truncate max-w-[65px] text-right">
                    {product.brand?.name}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-[#4a4a4a] line-clamp-2 leading-snug group-hover:text-[#6d8196] min-h-[32px]">
                  {product.name}
                </h4>

                <div className="mt-2 pt-2 border-t border-[#cbcbcb]/70 flex items-center justify-between">
                  <div className="text-xs font-bold text-[#4a4a4a]">
                    ₹{product.sellingPrice}
                    <span className="text-[9px] font-normal text-slate-500">/{product.unit}</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] ${
                      isLowStock ? 'bg-rose-100 text-rose-700 border border-rose-200 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Stock: {product.stockQuantity}
                  </span>
                </div>

                {inCart && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[3px] bg-[#6d8196] text-white font-semibold text-[10px] shadow-sm flex items-center justify-center">
                    {inCart.quantity}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart & Billing Checkout */}
      <div className="w-full lg:w-[400px] bg-white border border-[#cbcbcb] rounded-[5px] flex flex-col h-full overflow-hidden shadow-sm">
        {/* Customer Selector */}
        <div className="p-3.5 border-b border-[#cbcbcb] bg-slate-50">
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
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 divide-y divide-[#cbcbcb]">
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
        <div className="p-3.5 border-t border-[#cbcbcb] bg-slate-50 space-y-2.5">
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
              <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-700" /> Invoice Generated
              </h3>
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
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-[#4a4a4a] p-1">
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
    </div>
  );
}
