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
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-5">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[5px] border border-slate-300 p-4 overflow-hidden shadow-sm">
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
              className="w-full bg-slate-50 border border-slate-300 rounded-[5px] pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-[5px] flex items-center gap-2 text-xs font-bold text-blue-700">
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
                className={`text-left p-3 rounded-[5px] border transition-all flex flex-col justify-between relative group ${
                  product.stockQuantity <= 0
                    ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                    : inCart
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5 text-blue-600" />
                    {product.rack ? `${product.rack.rackName} (${product.rack.shelfCode})` : 'Rack A1'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">{product.brand?.name}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700">
                  {product.name}
                </h4>

                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-extrabold text-emerald-700">
                    ₹{product.sellingPrice}
                    <span className="text-[9px] font-normal text-slate-500">/{product.unit}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] ${
                      isLowStock ? 'bg-rose-100 text-rose-700 border border-rose-200 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Stock: {product.stockQuantity}
                  </span>
                </div>

                {inCart && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-[5px] bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shadow">
                    {inCart.quantity}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart & Billing Checkout */}
      <div className="w-full lg:w-[400px] bg-white border border-slate-300 rounded-[5px] flex flex-col h-full overflow-hidden shadow-sm">
        {/* Customer Selector */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50">
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
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 divide-y divide-slate-200">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-[5px] bg-blue-50 text-blue-700 border border-blue-200">
                      {item.rack ? `${item.rack.rackName} ${item.rack.shelfCode}` : 'Rack A1'}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    ₹{item.effectivePrice || item.sellingPrice} x {item.quantity} {item.unit} ={' '}
                    <span className="text-emerald-700 font-bold">
                      ₹{(item.effectivePrice || item.sellingPrice) * item.quantity}
                    </span>
                    {item.effectivePrice && item.effectivePrice < item.sellingPrice && (
                      <span className="text-amber-700 font-bold text-[9px] ml-1">(Wholesale!)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-300">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-slate-600 hover:text-slate-900">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-mono font-bold text-slate-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-slate-600 hover:text-slate-900">
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
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-700 uppercase font-bold">Discount (₹)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full mt-1 bg-white border border-slate-300 rounded-[5px] px-2.5 py-1 text-slate-900"
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
                  { value: 'CREDIT', label: 'Udhar (Credit)' },
                  { value: 'CARD', label: 'Card' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-700 uppercase font-bold">Paid Amount (₹)</label>
              <input
                type="number"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={`₹${totalAmount}`}
                className="w-full mt-1 bg-white border border-slate-300 rounded-[5px] px-2.5 py-1 text-emerald-700 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-700 uppercase font-bold">Due (Udhar Balance)</label>
              <div className="mt-1 bg-white border border-slate-300 rounded-[5px] px-2.5 py-1 text-amber-700 font-bold">
                ₹{dueAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-bold">Grand Total</span>
            <span className="text-lg font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={handleGenerateBill}
            disabled={loading || cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-[5px] flex items-center justify-center gap-2 shadow-sm text-xs transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {loading ? 'Processing...' : 'Generate Bill & Print Thermal Receipt'}
          </button>
        </div>
      </div>

      {/* THERMAL PRINT RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-[5px] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Invoice Generated
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={printerWidth}
                  onChange={(e) => setPrinterWidth(e.target.value as any)}
                  className="bg-[#0f172a] border border-slate-700 text-xs text-slate-200 px-2 py-1 rounded-[5px]"
                >
                  <option value="80mm">80mm Thermal</option>
                  <option value="58mm">58mm Thermal</option>
                </select>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thermal Print Receipt Roll Paper */}
            <div className="bg-white text-slate-950 p-4 rounded-[5px] font-mono text-xs shadow-inner max-h-[380px] overflow-y-auto" id="thermal-receipt-printable">
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

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintThermal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-[5px] flex items-center justify-center gap-2 text-xs transition-colors"
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
