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

  // Fetch products and customers
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

  // Update selected customer details
  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find((cust) => cust.id === selectedCustomerId);
      setSelectedCustomer(c || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, customers]);

  // Filter products by search query or barcode
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

  // Handle barcode exact scan match
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
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);
  const paidAmount = paidAmountInput !== '' ? parseFloat(paidAmountInput) : totalAmount;
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Generate Bill & Submit POS Transaction
  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      alert('Cart is empty! Please add products before generating a bill.');
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
          items: cart,
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
        // Clear cart and reload updated product stock
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

  // Trigger Thermal Print
  const handlePrintThermal = () => {
    window.print();
  };

  // Share on WhatsApp
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
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-6">
      {/* LEFT SECTION: Product Catalog & Search (60% width) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60 rounded-2xl border border-slate-800 p-5 overflow-hidden">
        {/* Search Bar & Barcode scanner listener */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Scan Barcode or Search by product name, SKU, brand (e.g. Polycab, 890100100101)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Barcode className="w-4 h-4" /> Scanner Active
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((product) => {
            const isLowStock = product.stockQuantity <= product.minStockAlert;
            const inCart = cart.find((item) => item.id === product.id);

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity <= 0}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between relative group ${
                  product.stockQuantity <= 0
                    ? 'opacity-40 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                    : inCart
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                {/* Rack Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" />
                    {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {product.brand ? product.brand.name : ''}
                  </span>
                </div>

                {/* Product Name */}
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                  {product.name}
                </h4>

                {/* Price & Stock */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-sm font-black text-emerald-400">
                    ₹{product.sellingPrice}
                    <span className="text-[10px] font-normal text-slate-400">/{product.unit}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isLowStock ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
                    }`}
                  >
                    Stock: {product.stockQuantity}
                  </span>
                </div>

                {inCart && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                    {inCart.quantity}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Billing Checkout (40% width) */}
      <div className="w-full lg:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden">
        {/* Customer Selector Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Customer Account
            </span>
            {selectedCustomer && (
              <span className="text-xs text-amber-400 font-semibold">
                Due Udhar: ₹{selectedCustomer.outstanding.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Walk-in Customer (Cash Sale)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - Outstanding: ₹{c.outstanding}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300">
                      {item.rack ? `${item.rack.rackName} ${item.rack.shelfCode}` : 'Rack A1'}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ₹{item.sellingPrice} x {item.quantity} {item.unit} ={' '}
                    <span className="text-emerald-400 font-semibold">₹{item.sellingPrice * item.quantity}</span>
                  </div>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30 stroke-[1.5]" />
              <p className="text-xs">Cart is empty</p>
              <p className="text-[11px] text-slate-600 mt-1">Click any product or scan barcode to add items</p>
            </div>
          )}
        </div>

        {/* Calculation & Payment Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          {/* Discount & Payment Mode */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Discount (₹)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="CREDIT">Udhar (Credit)</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          {/* Paid Amount Input */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Paid Amount (₹)</label>
              <input
                type="number"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={`₹${totalAmount}`}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Due (Udhar Balance)</label>
              <div className="mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold">
                ₹{dueAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">Grand Total</span>
            <span className="text-xl font-black text-amber-400">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          {/* Generate Bill Button */}
          <button
            onClick={handleGenerateBill}
            disabled={loading || cart.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {loading ? 'Processing Transaction...' : 'Generate Bill & Print Thermal Receipt'}
          </button>
        </div>
      </div>

      {/* THERMAL PRINT RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Invoice Generated
              </h3>
              <div className="flex items-center gap-2">
                {/* Printer width switcher */}
                <select
                  value={printerWidth}
                  onChange={(e) => setPrinterWidth(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-2 py-1 rounded"
                >
                  <option value="80mm">80mm Thermal</option>
                  <option value="58mm">58mm Thermal</option>
                </select>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PREVIEW OF THERMAL RECEIPT (Formatted like ESC/POS roll paper) */}
            <div className="bg-white text-slate-950 p-4 rounded-xl font-mono text-xs shadow-inner max-h-[380px] overflow-y-auto" id="thermal-receipt-printable">
              <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                <h2 className="font-bold text-sm uppercase">{receiptData.settings?.shopName || 'SRI LAKSHMI ELECTRICALS'}</h2>
                <p className="text-[10px] text-slate-700">{receiptData.settings?.address}</p>
                <p className="text-[10px] text-slate-700">Ph: {receiptData.settings?.phone}</p>
                <p className="text-[10px] font-bold mt-1">GSTIN: {receiptData.settings?.gstin}</p>
              </div>

              <div className="flex justify-between text-[11px] mb-2">
                <span>Inv: {receiptData.invoice.invoiceNo}</span>
                <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-1 mb-2">
                <p className="font-bold text-[11px]">Customer: {receiptData.invoice.customerName}</p>
                {receiptData.invoice.customerPhone !== 'N/A' && (
                  <p className="text-[10px]">Ph: {receiptData.invoice.customerPhone}</p>
                )}
              </div>

              {/* Items List */}
              <table className="w-full text-left text-[11px] mb-2">
                <thead>
                  <tr className="border-b border-slate-400">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-300">
                  {receiptData.invoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-1 pr-1">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-[9px] text-slate-600">[{item.rackLocation}]</div>
                      </td>
                      <td className="py-1 text-center font-bold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-1 text-right font-bold">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-950 pt-2 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{receiptData.invoice.subtotal}</span>
                </div>
                {receiptData.invoice.discount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Discount:</span>
                    <span>-₹{receiptData.invoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                  <span>TOTAL:</span>
                  <span>₹{receiptData.invoice.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({receiptData.invoice.paymentMethod}):</span>
                  <span>₹{receiptData.invoice.paidAmount}</span>
                </div>
                {receiptData.invoice.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>Due Balance:</span>
                    <span>₹{receiptData.invoice.dueAmount}</span>
                  </div>
                )}
              </div>

              <div className="text-center border-t border-dashed border-slate-400 mt-3 pt-2 text-[10px] text-slate-700">
                *** THANK YOU FOR YOUR BUSINESS! ***
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintThermal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
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
