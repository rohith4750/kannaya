'use client';

import React from 'react';
import { Building2, Phone, Mail, MapPin, Calendar, FileSpreadsheet } from 'lucide-react';

interface SupplierLedgerPrintTemplateProps {
  supplier: any;
  settings?: any;
}

export default function SupplierLedgerPrintTemplate({
  supplier,
  settings,
}: SupplierLedgerPrintTemplateProps) {
  const shopName = settings?.shopName || 'SRI VENKATA LAKSHMI ELECTRICALS';
  const tagline = settings?.tagline || 'Complete Electrical Solutions';
  const phone = settings?.phone || '+91 98765 43210';
  const address = settings?.address || 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001';
  const gstin = settings?.gstin || '36ABCDE1234F1Z5';

  if (!supplier) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const ledgerEntries = supplier.ledger || [];
  let runningBal = 0;

  return (
    <div
      id="supplier-ledger-printable"
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
            SUPPLIER ACCOUNT STATEMENT
          </span>
          <div className="text-xs text-black font-medium mt-1">Generated: {formatDate(new Date().toISOString())}</div>
          <div className="text-xs font-bold text-black mt-0.5">Proprietor: Konala Kannaya Reddy</div>
        </div>
      </div>

      {/* Supplier Profile Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 border border-black">
          <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 pb-1 border-b border-black flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-black" /> Vendor / Supplier Details
          </h3>
          <div className="text-base font-black text-black">{supplier.name}</div>
          {supplier.contactPerson && (
            <div className="text-xs text-black font-bold mt-0.5">Contact Person: {supplier.contactPerson}</div>
          )}
          {supplier.phone && (
            <div className="text-xs text-black font-semibold mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-black" /> {supplier.phone}
            </div>
          )}
          {supplier.gstin && (
            <div className="text-xs text-black mt-0.5 font-mono font-bold">
              GSTIN: {supplier.gstin}
            </div>
          )}
          {supplier.address && (
            <div className="text-xs text-black font-medium mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-black mt-0.5 shrink-0" /> {supplier.address}
            </div>
          )}
        </div>

        {/* Account Dues Summary */}
        <div className="bg-white p-4 border border-black flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 pb-1 border-b border-black flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-black" /> Ledger Account Financials
            </h3>
            <div className="space-y-1.5 text-xs text-black font-bold">
              <div className="flex justify-between">
                <span>Total Wholesale Purchases:</span>
                <span className="font-mono font-black">₹{(supplier.totalPurchased || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payments Cleared:</span>
                <span className="font-mono font-black">₹{(supplier.totalPaid || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-black flex justify-between items-center">
            <span className="text-xs font-black text-black uppercase">Net Dues Payable:</span>
            <span className="text-base font-black font-mono text-black bg-white px-3 py-1 border-2 border-black">
              ₹{(supplier.outstanding || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <table className="w-full text-left border-collapse border-2 border-black mb-6 text-xs text-black">
        <thead>
          <tr className="bg-white text-black text-[11px] font-black uppercase tracking-wider border-b-2 border-black">
            <th className="p-2 border-r border-black border-b-2 text-center w-10">#</th>
            <th className="p-2 border-r border-black border-b-2">Date</th>
            <th className="p-2 border-r border-black border-b-2">Transaction Details</th>
            <th className="p-2 border-r border-black border-b-2 text-right">Debit (+Bill)</th>
            <th className="p-2 border-r border-black border-b-2 text-right">Credit (-Paid)</th>
            <th className="p-2 border-b-2 text-right">Running Balance</th>
          </tr>
        </thead>
        <tbody className="font-medium text-black">
          {ledgerEntries.length > 0 ? (
            ledgerEntries.map((entry: any, idx: number) => {
              const debit = entry.type === 'PURCHASE' ? entry.amount : 0;
              const credit = entry.type === 'PAYMENT' ? entry.amount : 0;
              runningBal += debit - credit;

              return (
                <tr key={entry.id || idx} className="border-b border-black bg-white">
                  <td className="p-2 text-center font-mono font-bold border-r border-black">{idx + 1}</td>
                  <td className="p-2 border-r border-black font-semibold">{formatDate(entry.createdAt)}</td>
                  <td className="p-2 border-r border-black">
                    <div className="font-extrabold">{entry.description || entry.type}</div>
                    {entry.referenceId && (
                      <div className="text-[10px] font-mono font-bold">Ref: {entry.referenceId}</div>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-black">
                    {debit > 0 ? `₹${debit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono font-bold border-r border-black">
                    {credit > 0 ? `₹${credit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono font-black">
                    ₹{runningBal.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center italic border-b border-black">
                No ledger transactions recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-black text-center text-xs text-black">
        <div>
          <div className="h-12 border-b border-black mb-2"></div>
          <div className="font-bold">Supplier Representative Signature</div>
          <div className="text-[10px] font-medium">Verified & Accepted</div>
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

