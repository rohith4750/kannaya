'use client';

import React from 'react';
import { Package, Truck, CheckCircle2, AlertTriangle, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface SupplierPOPrintTemplateProps {
  po: any;
  supplier: any;
  settings?: any;
}

export default function SupplierPOPrintTemplate({
  po,
  supplier,
  settings,
}: SupplierPOPrintTemplateProps) {
  const shopName = settings?.shopName || 'VENKATA LAKSHMI ELECTRONICS';
  const tagline = settings?.tagline || 'Complete Electrical & Hardware Solutions';
  const phone = settings?.phone || '+91 98765 43210';
  const address = settings?.address || 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001';
  const gstin = settings?.gstin || '36ABCDE1234F1Z5';

  if (!po || !supplier) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = po.status === 'FULLY_RECEIVED' || po.status === 'COMPLETED';
  const isPartial = po.status === 'PARTIAL_RECEIVED' || po.status === 'PARTIAL';

  return (
    <div
      id="supplier-po-printable"
      className="bg-white text-slate-900 p-8 font-sans max-w-[850px] mx-auto border border-slate-200 shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-slate-50">
            <img src="/logo.jpg" alt="Logo" className="max-h-full max-w-full object-contain rounded-lg" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{shopName}</h1>
            <p className="text-xs text-slate-600 font-medium">{tagline}</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">{address}</p>
            <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
              Ph: {phone} | GSTIN: {gstin}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase tracking-wider mb-2">
            WHOLESALE PURCHASE ORDER
          </span>
          <div className="text-sm font-mono font-bold text-slate-800">PO #{po.poNumber}</div>
          <div className="text-xs text-slate-500 mt-1">Date: {formatDate(po.createdAt)}</div>
        </div>
      </div>

      {/* Supplier & Delivery Info Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Supplier Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" /> Supplier Details
          </h3>
          <div className="text-sm font-bold text-slate-900">{supplier.name}</div>
          {supplier.contactPerson && (
            <div className="text-xs text-slate-600 font-medium mt-0.5">Contact: {supplier.contactPerson}</div>
          )}
          {supplier.phone && (
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone}
            </div>
          )}
          {supplier.email && (
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> {supplier.email}
            </div>
          )}
          {supplier.address && (
            <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" /> {supplier.address}
            </div>
          )}
        </div>

        {/* Delivery / Status Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" /> Ship-To & Receiving Status
          </h3>
          <div className="text-xs font-bold text-slate-800">Godown / Store Location</div>
          <div className="text-xs text-slate-600 mt-0.5">{address}</div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Godown Receiving Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isPartial
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              {isCompleted ? '✓ FULLY RECEIVED' : isPartial ? '⚡ PARTIAL ARRIVED' : '⏳ PENDING ARRIVAL'}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Payment Status:</span>
            <span className="text-xs font-bold text-slate-800">
              {po.dueAmount <= 0 ? 'Fully Paid' : `Due: ₹${po.dueAmount.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden mb-6">
        <thead>
          <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
            <th className="p-2.5 border-b border-slate-800 text-center w-10">#</th>
            <th className="p-2.5 border-b border-slate-800">Product Name & Specifications</th>
            <th className="p-2.5 border-b border-slate-800 text-center">Ordered Qty</th>
            <th className="p-2.5 border-b border-slate-800 text-center">Godown Received</th>
            <th className="p-2.5 border-b border-slate-800 text-right">Unit Cost</th>
            <th className="p-2.5 border-b border-slate-800 text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {po.items && po.items.length > 0 ? (
            po.items.map((item: any, idx: number) => {
              const recQty = item.receivedQuantity ?? (isCompleted ? item.quantity : 0);
              const pendingQty = Math.max(0, item.quantity - recQty);
              return (
                <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="p-2.5 text-center font-mono font-medium text-slate-500">{idx + 1}</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">{item.product?.name || item.productName || 'Product'}</div>
                    {item.product?.rackLocation && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Rack: {item.product.rackLocation}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">
                    {item.quantity} {item.product?.unit || 'pcs'}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        recQty >= item.quantity
                          ? 'bg-emerald-50 text-emerald-700'
                          : recQty > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {recQty} {item.product?.unit || 'pcs'}
                    </span>
                    {pendingQty > 0 && (
                      <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                        ({pendingQty} missing)
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium text-slate-700">
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    ₹{Number(item.total).toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                No items listed in this order
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-1/2 pr-4 text-xs text-slate-500">
          <div className="font-bold text-slate-700 uppercase tracking-wider mb-1">Terms & Conditions:</div>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li>Goods must be delivered in undamaged condition to our central store/godown.</li>
            <li>Any shortage or damaged products will be logged in Goods Receiving Note (GRN).</li>
            <li>Invoices must reference PO Number #{po.poNumber}.</li>
          </ul>
        </div>

        <div className="w-5/12 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Total PO Items Cost:</span>
            <span className="font-mono font-bold text-slate-900">₹{Number(po.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Amount Paid:</span>
            <span className="font-mono font-bold text-emerald-700">₹{Number(po.paidAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-black text-slate-900">
            <span>Outstanding Dues:</span>
            <span className="font-mono text-amber-700">₹{Number(po.dueAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-center text-xs">
        <div>
          <div className="h-12 border-b border-slate-400 mb-2"></div>
          <div className="font-bold text-slate-800">Godown Incharge / Receiver</div>
          <div className="text-[10px] text-slate-500">Seal & Verified Signature</div>
        </div>
        <div>
          <div className="h-12 border-b border-slate-400 mb-2"></div>
          <div className="font-bold text-slate-800">For VENKATA LAKSHMI ELECTRONICS</div>
          <div className="text-[10px] text-slate-500">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
