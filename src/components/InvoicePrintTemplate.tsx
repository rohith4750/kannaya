'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Store, Phone, MapPin, ShieldCheck } from 'lucide-react';

interface InvoicePrintTemplateProps {
  invoice: any;
  settings?: any;
  format?: 'A4' | '80mm' | '58mm';
}

export default function InvoicePrintTemplate({
  invoice,
  settings,
  format = 'A4',
}: InvoicePrintTemplateProps) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && invoice?.invoiceNo) {
      try {
        JsBarcode(barcodeRef.current, invoice.invoiceNo, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 11,
          font: 'sans-serif',
          margin: 0,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [invoice?.invoiceNo]);

  const shopName = settings?.shopName || 'SRI VENKATA LAKSHMI ELECTRICALS';
  const tagline = settings?.tagline || 'Complete Electrical Solutions';
  const phone = settings?.phone || '+91 98765 43210';
  const address = settings?.address || 'Shop #12-4, Main Market Road, Near Town Clock Tower, City - 500001';
  const gstin = settings?.gstin || '36ABCDE1234F1Z5';
  const defaultGstPercent = settings?.defaultGstPercent || 18;
  const defaultHsnCode = settings?.defaultHsnCode || '8544';
  const termsConditions = settings?.termsConditions || 'Goods once sold will not be taken back or exchanged. Subject to local jurisdiction.';

  const subtotal = invoice.subtotal || 0;
  const discount = invoice.discount || 0;
  const totalAmount = invoice.totalAmount || 0;
  const paidAmount = invoice.paidAmount || 0;
  const dueAmount = invoice.dueAmount || 0;

  // Estimated Tax calculation based on default or product GST rate
  const taxAmount = (totalAmount * defaultGstPercent) / (100 + defaultGstPercent);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const taxableAmount = totalAmount - taxAmount;

  if (format === '80mm' || format === '58mm') {
    return (
      <div
        className={`bg-white text-[#4a4a4a] p-4 font-mono text-xs shadow-md border border-[#cbcbcb] ${
          format === '58mm' ? 'max-w-[230px]' : 'max-w-[320px]'
        } mx-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none`}
        id="thermal-receipt-printable"
      >
        {/* Store Header */}
        <div className="text-center border-b border-dashed border-[#cbcbcb] pb-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-[#cbcbcb] mx-auto mb-1 overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <h2 className="font-extrabold text-sm uppercase leading-tight">{shopName}</h2>
          <p className="text-[10px] text-slate-600 font-sans mt-0.5">{tagline}</p>
          <p className="text-[9px] text-slate-500 font-sans mt-1">{address}</p>
          <p className="text-[9px] text-slate-500 font-sans">Ph: {phone} | GSTIN: {gstin}</p>
        </div>

        {/* Bill Info */}
        <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-[#cbcbcb] pb-1.5 mb-2">
          <span>Bill No: {invoice.invoiceNo}</span>
          <span>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
        </div>

        <div className="border-b border-dashed border-[#cbcbcb] pb-1.5 mb-2 text-[10px]">
          <p className="font-bold">Customer: {invoice.customerName}</p>
          {invoice.customerPhone && invoice.customerPhone !== 'N/A' && <p>Ph: {invoice.customerPhone}</p>}
          <p>Payment Mode: <span className="font-bold">{invoice.paymentMethod}</span></p>
        </div>

        {/* Items List */}
        <table className="w-full text-left text-[10px] mb-2 border-collapse">
          <thead>
            <tr className="border-b border-[#cbcbcb] text-[9px] uppercase font-bold">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-[#cbcbcb]">
            {invoice.items?.map((item: any) => (
              <tr key={item.id}>
                <td className="py-1 pr-1 font-sans">
                  <div className="font-bold text-[10px]">{item.productName}</div>
                  {item.rackLocation && (
                    <div className="text-[8px] text-slate-500">Loc: {item.rackLocation}</div>
                  )}
                </td>
                <td className="py-1 text-center font-bold">{item.quantity} {item.unit}</td>
                <td className="py-1 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-[#4a4a4a] pt-1.5 space-y-0.5 text-right text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount:</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dashed border-[#cbcbcb]">
            <span>NET TOTAL:</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid ({invoice.paymentMethod}):</span>
            <span>₹{paidAmount.toLocaleString('en-IN')}</span>
          </div>
          {dueAmount > 0 && (
            <div className="flex justify-between font-bold text-amber-700">
              <span>Balance Credit Due:</span>
              <span>₹{dueAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Barcode SVG disabled */}
        {/* <div className="text-center mt-3 pt-2 border-t border-dashed border-[#cbcbcb]">
          <svg ref={barcodeRef} className="mx-auto max-w-full" />
        </div> */}

        <div className="text-center mt-2 text-[8px] text-slate-500 font-sans">
          *** THANK YOU FOR SHOPPING AT VENKATA LAKSHMI! ***
        </div>
      </div>
    );
  }

  // DEFAULT PREMIUM A4 GST TAX INVOICE TEMPLATE
  return (
    <div
      className="bg-white border border-[#cbcbcb] rounded-[5px] p-8 shadow-xl space-y-6 max-w-4xl mx-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none font-sans text-xs text-[#4a4a4a]"
      id="a4-invoice-printable"
    >
      {/* Top Header & Store Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#6d8196] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-[#6d8196] shadow-md flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#4a4a4a] tracking-tight">{shopName}</h1>
            <p className="text-xs text-[#6d8196] font-bold">{tagline}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{address}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              Phone: {phone} | GSTIN: <span className="font-bold font-mono text-[#4a4a4a]">{gstin}</span>
            </p>
          </div>
        </div>

        <div className="text-right sm:text-right shrink-0">
          <div className="inline-block bg-[#6d8196] text-white px-3 py-1 rounded-[5px] text-xs font-black uppercase tracking-wider mb-2">
            GST TAX INVOICE
          </div>
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-slate-900">
              Invoice #: <span className="font-mono text-[#6d8196]">{invoice.invoiceNo}</span>
            </div>
            <div className="text-slate-500 font-medium">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-slate-500 font-medium">
              Time: {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Payment Meta Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-[5px] border border-[#cbcbcb]">
        <div>
          <span className="text-[10px] font-extrabold text-[#6d8196] uppercase tracking-wider block mb-1">
            Billed To (Customer Details)
          </span>
          <div className="font-extrabold text-sm text-[#4a4a4a]">{invoice.customerName}</div>
          {invoice.customerPhone && invoice.customerPhone !== 'N/A' && (
            <div className="text-slate-600 font-mono mt-0.5">Phone: {invoice.customerPhone}</div>
          )}
          {invoice.customerAddress && (
            <div className="text-slate-500 mt-0.5 text-[11px]">{invoice.customerAddress}</div>
          )}
        </div>

        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#cbcbcb] pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-extrabold text-[#6d8196] uppercase tracking-wider block mb-1">
            Payment & Status Information
          </span>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Payment Mode: </span>
              <span className="font-bold text-[#4a4a4a] bg-white px-2 py-0.5 rounded-[5px] border border-[#cbcbcb] font-mono">
                {invoice.paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Invoice Status: </span>
              <span className="font-bold text-emerald-700 uppercase">{invoice.status || 'COMPLETED'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Billed By: </span>
              <span className="font-semibold text-slate-700">Counter Cashier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Products Table */}
      <div className="border border-[#cbcbcb] rounded-[5px] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#4a4a4a] text-white font-semibold text-[11px]">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-center">Loc</th>
              <th className="py-2.5 px-3 text-center">HSN</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right">GST %</th>
              <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-bold text-[#4a4a4a]">{item.productName}</td>
                <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                  {item.rackLocation || 'A1'}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                  {item.hsnCode || '8544'}
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  ₹{item.price.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                  {item.gstPercent || 18}%
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-mono">
                  ₹{item.total.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Calculation Summary Box */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Left Side: Terms */}
        <div className="w-full sm:w-1/2 space-y-3">
          {/* Barcode Display disabled */}
          {/* <div className="bg-slate-50 border border-[#cbcbcb] p-3 rounded-[5px] text-center">
            <svg ref={barcodeRef} className="mx-auto max-w-full" />
          </div> */}

          <div className="text-[10px] text-slate-500 space-y-1 bg-white p-3 rounded-[5px] border border-[#cbcbcb]">
            <span className="font-bold text-[#4a4a4a] uppercase block">Terms & Conditions:</span>
            <p className="whitespace-pre-line">{termsConditions}</p>
            {settings?.bankDetails && (
              <p className="pt-1 border-t border-slate-200 text-slate-700 font-medium">
                <strong>Bank Account:</strong> {settings.bankDetails}
              </p>
            )}
            {settings?.upiId && (
              <p className="text-slate-700 font-medium">
                <strong>UPI Payment ID:</strong> {settings.upiId}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Calculation Totals */}
        <div className="w-full sm:w-1/2 bg-[#ffffe3] border border-[#cbcbcb] p-4 rounded-[5px] space-y-2 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Taxable Amount:</span>
            <span className="font-mono font-semibold">₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>CGST ({(defaultGstPercent / 2).toFixed(1)}%):</span>
            <span className="font-mono">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>SGST ({(defaultGstPercent / 2).toFixed(1)}%):</span>
            <span className="font-mono">₹{sgst.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>Special Discount:</span>
              <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="border-t-2 border-[#4a4a4a] pt-2 flex justify-between text-base font-extrabold text-[#4a4a4a]">
            <span>Net Amount Payable:</span>
            <span className="text-[#6d8196]">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-2 border-t border-[#cbcbcb] space-y-1 text-xs">
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Amount Received:</span>
              <span>₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Balance Credit Due:</span>
                <span>₹{dueAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
        <div>
          <div className="font-bold text-[#4a4a4a]">Customer Signature</div>
          <div className="text-[10px] mt-0.5">Verified & Received in Good Condition</div>
        </div>

        <div className="text-right">
          <div className="font-bold text-[#4a4a4a]">For {shopName}</div>
          <div className="h-10"></div>
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
