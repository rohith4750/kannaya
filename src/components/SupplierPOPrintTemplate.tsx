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
  const shopName = settings?.shopName || 'SRI VENKATA LAKSHMI ELECTRICALS';
  const tagline = settings?.tagline || 'Complete Electrical Solutions';
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
      className="bg-white text-black p-8 font-sans max-w-[850px] mx-auto border-2 border-black shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border border-black p-1 flex items-center justify-center bg-white">
            <img src="/logo.png" alt="Logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-black uppercase">{shopName}</h1>
            <p className="text-xs text-black font-semibold">{tagline}</p>
            <p className="text-[11px] text-black font-medium mt-1 max-w-md">{address}</p>
            <p className="text-[11px] text-black font-bold mt-0.5">
              Ph: {phone} | GSTIN: {gstin}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 border-2 border-black bg-white text-black font-black text-xs uppercase tracking-wider mb-2">
            WHOLESALE PURCHASE ORDER
          </span>
          <div className="text-sm font-mono font-bold text-black">PO #{po.poNumber}</div>
          <div className="text-xs text-black font-medium mt-1">Date: {formatDate(po.createdAt)}</div>
        </div>
      </div>

      {/* Supplier & Delivery Info Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Supplier Info */}
        <div className="bg-white p-4 border border-black">
          <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 pb-1 border-b border-black flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-black" /> Supplier Details
          </h3>
          <div className="text-sm font-black text-black">{supplier.name}</div>
          {supplier.contactPerson && (
            <div className="text-xs text-black font-bold mt-0.5">Contact: {supplier.contactPerson}</div>
          )}
          {supplier.phone && (
            <div className="text-xs text-black font-semibold mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-black" /> {supplier.phone}
            </div>
          )}
          {supplier.email && (
            <div className="text-xs text-black font-medium mt-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-black" /> {supplier.email}
            </div>
          )}
          {supplier.address && (
            <div className="text-xs text-black font-medium mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-black mt-0.5 shrink-0" /> {supplier.address}
            </div>
          )}
        </div>

        {/* Delivery / Status Info */}
        <div className="bg-white p-4 border border-black">
          <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 pb-1 border-b border-black flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-black" /> Ship-To & Receiving Status
          </h3>
          <div className="text-xs font-extrabold text-black">Godown / Store Location</div>
          <div className="text-xs text-black font-medium mt-0.5">{address}</div>

          <div className="mt-3 pt-2 border-t border-black flex items-center justify-between">
            <span className="text-xs font-bold text-black">Godown Receiving Status:</span>
            <span className="px-2.5 py-0.5 border border-black bg-white text-black font-black text-[11px]">
              {isCompleted ? '[ FULLY RECEIVED ]' : isPartial ? '[ PARTIAL ARRIVED ]' : '[ PENDING ARRIVAL ]'}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-black">Payment Status:</span>
            <span className="text-xs font-extrabold text-black">
              {po.dueAmount <= 0 ? 'Fully Paid' : `Due: ₹${po.dueAmount.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-left border-collapse border-2 border-black mb-6">
        <thead>
          <tr className="bg-white text-black text-[11px] font-black uppercase tracking-wider border-b-2 border-black">
            <th className="p-2 border-r border-black border-b-2 text-center w-10">#</th>
            <th className="p-2 border-r border-black border-b-2">Product Name & Specifications</th>
            <th className="p-2 border-r border-black border-b-2 text-center">Ordered Qty</th>
            <th className="p-2 border-r border-black border-b-2 text-center">Godown Received</th>
            <th className="p-2 border-r border-black border-b-2 text-right">Unit Cost</th>
            <th className="p-2 border-b-2 text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody className="text-xs text-black font-medium">
          {po.items && po.items.length > 0 ? (
            po.items.map((item: any, idx: number) => {
              const recQty = item.receivedQuantity ?? (isCompleted ? item.quantity : 0);
              const pendingQty = Math.max(0, item.quantity - recQty);
              return (
                <tr key={item.id || idx} className="border-b border-black bg-white">
                  <td className="p-2 text-center font-mono font-bold border-r border-black">{idx + 1}</td>
                  <td className="p-2 border-r border-black">
                    <div className="font-extrabold text-black">{item.product?.name || item.productName || 'Product'}</div>
                    {item.product?.rackLocation && (
                      <div className="text-[10px] text-black font-mono font-semibold mt-0.5">
                        Rack: {item.product.rackLocation}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-center font-bold border-r border-black">
                    {item.quantity} {item.product?.unit || 'pcs'}
                  </td>
                  <td className="p-2 text-center border-r border-black">
                    <span className="inline-block px-2 py-0.5 border border-black text-black font-bold text-[11px] bg-white">
                      {recQty} {item.product?.unit || 'pcs'}
                    </span>
                    {pendingQty > 0 && (
                      <div className="text-[10px] text-black font-bold mt-0.5">
                        ({pendingQty} missing)
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-black">
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 text-right font-mono font-black">
                    ₹{Number(item.total).toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-black italic border-b border-black">
                No items listed in this order
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-1/2 pr-4 text-xs text-black">
          <div className="font-black text-black uppercase tracking-wider mb-1">Terms & Conditions:</div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] font-medium">
            <li>Goods must be delivered in undamaged condition to our central store/godown.</li>
            <li>Any shortage or damaged products will be logged in Goods Receiving Note (GRN).</li>
            <li>Invoices must reference PO Number #{po.poNumber}.</li>
          </ul>
        </div>

        <div className="w-5/12 bg-white p-4 border-2 border-black space-y-2 text-xs text-black">
          <div className="flex justify-between font-bold">
            <span>Total PO Items Cost:</span>
            <span className="font-mono font-black">₹{Number(po.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Amount Paid:</span>
            <span className="font-mono font-black">₹{Number(po.paidAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-2 border-t-2 border-black flex justify-between text-sm font-black">
            <span>Outstanding Dues:</span>
            <span className="font-mono">₹{Number(po.dueAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-black text-center text-xs text-black">
        <div>
          <div className="h-12 border-b border-black mb-2"></div>
          <div className="font-bold">Godown Incharge / Receiver</div>
          <div className="text-[10px] font-medium">Seal & Verified Signature</div>
        </div>
        <div>
          <div className="h-12 border-b border-black mb-2"></div>
          <div className="font-bold">For SRI VENKATA LAKSHMI ELECTRICALS</div>
          <div className="text-[10px] font-medium">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}

