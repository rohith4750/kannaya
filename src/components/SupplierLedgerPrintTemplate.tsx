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
      className="bg-white text-slate-900 p-8 font-sans max-w-[850px] mx-auto border border-slate-200 shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
    >
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-slate-50">
            <img src="/logo.png" alt="Logo" className="max-h-full max-w-full object-contain rounded-lg" />
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
            SUPPLIER ACCOUNT STATEMENT
          </span>
          <div className="text-xs text-slate-500 mt-1">Generated: {formatDate(new Date().toISOString())}</div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">Proprietor: Konala Kannaya Reddy</div>
        </div>
      </div>

      {/* Supplier Profile Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" /> Vendor / Supplier Details
          </h3>
          <div className="text-base font-black text-slate-900">{supplier.name}</div>
          {supplier.contactPerson && (
            <div className="text-xs text-slate-600 font-medium mt-0.5">Contact Person: {supplier.contactPerson}</div>
          )}
          {supplier.phone && (
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone}
            </div>
          )}
          {supplier.gstin && (
            <div className="text-xs text-slate-600 mt-0.5 font-mono">
              GSTIN: {supplier.gstin}
            </div>
          )}
          {supplier.address && (
            <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" /> {supplier.address}
            </div>
          )}
        </div>

        {/* Account Dues Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" /> Ledger Account Financials
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Wholesale Purchases:</span>
                <span className="font-mono font-bold text-slate-900">₹{(supplier.totalPurchased || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Payments Cleared:</span>
                <span className="font-mono font-bold text-emerald-700">₹{(supplier.totalPaid || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-300 flex justify-between items-center">
            <span className="text-xs font-black text-slate-900 uppercase">Net Dues Payable:</span>
            <span className="text-base font-black font-mono text-amber-700 bg-amber-50 px-3 py-1 rounded border border-amber-200">
              ₹{(supplier.outstanding || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden mb-6 text-xs">
        <thead>
          <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
            <th className="p-2.5 border-b border-slate-800 text-center w-10">#</th>
            <th className="p-2.5 border-b border-slate-800">Date</th>
            <th className="p-2.5 border-b border-slate-800">Transaction Details</th>
            <th className="p-2.5 border-b border-slate-800 text-right">Debit (+Bill)</th>
            <th className="p-2.5 border-b border-slate-800 text-right">Credit (-Paid)</th>
            <th className="p-2.5 border-b border-slate-800 text-right">Running Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {ledgerEntries.length > 0 ? (
            ledgerEntries.map((entry: any, idx: number) => {
              const debit = entry.type === 'PURCHASE' ? entry.amount : 0;
              const credit = entry.type === 'PAYMENT' ? entry.amount : 0;
              runningBal += debit - credit;

              return (
                <tr key={entry.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="p-2.5 text-center font-mono font-medium text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-medium text-slate-700">{formatDate(entry.createdAt)}</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">{entry.description || entry.type}</div>
                    {entry.referenceId && (
                      <div className="text-[10px] text-slate-500 font-mono">Ref: {entry.referenceId}</div>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                    {debit > 0 ? `₹${debit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                    {credit > 0 ? `₹${credit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-slate-900">
                    ₹{runningBal.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                No ledger transactions recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-center text-xs">
        <div>
          <div className="h-12 border-b border-slate-400 mb-2"></div>
          <div className="font-bold text-slate-800">Supplier Representative Signature</div>
          <div className="text-[10px] text-slate-500">Verified & Accepted</div>
        </div>
        <div>
          <div className="h-12 border-b border-slate-400 mb-2"></div>
          <div className="font-bold text-slate-800">For SRI VENKATA LAKSHMI ELECTRICALS</div>
          <div className="text-[10px] text-slate-500">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
