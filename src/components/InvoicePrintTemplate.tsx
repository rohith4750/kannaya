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
      className="bg-white border-2 border-black p-8 shadow-xl space-y-6 max-w-4xl mx-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none font-sans text-xs text-black"
      id="a4-invoice-printable"
    >
      {/* Top Header & Store Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 bg-white p-1 border border-black flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Venkata Lakshmi Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black tracking-tight uppercase">{shopName}</h1>
            <p className="text-xs text-black font-bold">{tagline}</p>
            <p className="text-[11px] text-black font-medium mt-0.5">{address}</p>
            <p className="text-[11px] text-black font-semibold">
              Phone: {phone} | GSTIN: <span className="font-bold font-mono text-black">{gstin}</span>
            </p>
          </div>
        </div>

        <div className="text-right sm:text-right shrink-0">
          <div className="inline-block bg-white text-black border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider mb-2">
            GST TAX INVOICE
          </div>
          <div className="text-xs space-y-0.5 text-black">
            <div className="font-bold">
              Invoice #: <span className="font-mono">{invoice.invoiceNo}</span>
            </div>
            <div className="font-medium">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="font-medium">
              Time: {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Payment Meta Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 border border-black text-black">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider block mb-1 border-b border-black pb-0.5">
            Billed To (Customer Details)
          </span>
          <div className="font-black text-sm text-black">{invoice.customerName}</div>
          {invoice.customerPhone && invoice.customerPhone !== 'N/A' && (
            <div className="font-mono font-bold mt-0.5">Phone: {invoice.customerPhone}</div>
          )}
          {invoice.customerAddress && (
            <div className="mt-0.5 text-[11px] font-medium">{invoice.customerAddress}</div>
          )}
        </div>

        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-black pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-black uppercase tracking-wider block mb-1 border-b border-black pb-0.5">
            Payment & Status Information
          </span>
          <div className="space-y-1 text-xs font-semibold">
            <div>
              <span>Payment Mode: </span>
              <span className="font-bold border border-black px-2 py-0.5 bg-white font-mono">
                {invoice.paymentMethod}
              </span>
            </div>
            <div>
              <span>Invoice Status: </span>
              <span className="font-black uppercase">{invoice.status || 'COMPLETED'}</span>
            </div>
            <div>
              <span>Billed By: </span>
              <span className="font-bold">Counter Cashier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Products Table */}
      <div className="border-2 border-black">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white text-black font-black text-[11px] border-b-2 border-black uppercase">
              <th className="py-2 px-2.5 w-10 text-center border-r border-black">#</th>
              <th className="py-2 px-2.5 text-center border-r border-black">Date</th>
              <th className="py-2 px-2.5 border-r border-black">Item Description</th>
              <th className="py-2 px-2.5 text-center border-r border-black">Loc</th>
              <th className="py-2 px-2.5 text-center border-r border-black">HSN</th>
              <th className="py-2 px-2.5 text-center border-r border-black">Qty</th>
              <th className="py-2 px-2.5 text-right border-r border-black">Rate (₹)</th>
              <th className="py-2 px-2.5 text-right border-r border-black">GST %</th>
              <th className="py-2 px-2.5 text-right">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-black">
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={item.id} className="bg-white">
                <td className="py-2 px-2.5 text-center font-bold border-r border-black">{idx + 1}</td>
                <td className="py-2 px-2.5 text-center font-mono text-[10px] whitespace-nowrap border-r border-black">
                  {new Date(item.createdAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-2 px-2.5 font-extrabold border-r border-black">{item.productName}</td>
                <td className="py-2 px-2.5 text-center font-mono text-[11px] border-r border-black">
                  {item.rackLocation || 'A1'}
                </td>
                <td className="py-2 px-2.5 text-center font-mono text-[11px] border-r border-black">
                  {item.hsnCode || '8544'}
                </td>
                <td className="py-2 px-2.5 text-center font-bold border-r border-black">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-semibold border-r border-black">
                  ₹{item.price.toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-2.5 text-right font-mono text-[11px] border-r border-black">
                  {item.gstPercent || 18}%
                </td>
                <td className="py-2 px-2.5 text-right font-black font-mono">
                  ₹{item.total.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Calculation Summary Box */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-black">
        {/* Left Side: Terms */}
        <div className="w-full sm:w-1/2 space-y-3">
          <div className="text-[10px] space-y-1 bg-white p-3 border border-black">
            <span className="font-black uppercase block pb-1 border-b border-black">Terms & Conditions:</span>
            <p className="whitespace-pre-line font-medium">{termsConditions}</p>
            {settings?.showBankDetails !== false && settings?.bankDetails && (
              <p className="pt-1 border-t border-black font-semibold">
                <strong>Bank Account:</strong> {settings.bankDetails}
              </p>
            )}
            {settings?.upiId && (
              <p className="font-semibold">
                <strong>UPI Payment ID:</strong> {settings.upiId}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Calculation Totals */}
        <div className="w-full sm:w-1/2 bg-white border-2 border-black p-4 space-y-2 text-xs text-black font-bold">
          <div className="flex justify-between">
            <span>Taxable Amount:</span>
            <span className="font-mono font-bold">₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>CGST ({(defaultGstPercent / 2).toFixed(1)}%):</span>
            <span className="font-mono">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>SGST ({(defaultGstPercent / 2).toFixed(1)}%):</span>
            <span className="font-mono">₹{sgst.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Special Discount:</span>
              <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="border-t-2 border-black pt-2 flex justify-between text-base font-black">
            <span>Net Amount Payable:</span>
            <span className="font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-2 border-t border-black space-y-1 text-xs">
            <div className="flex justify-between font-extrabold">
              <span>Amount Received:</span>
              <span>₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between font-black">
                <span>Balance Credit Due:</span>
                <span>₹{dueAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="pt-8 border-t-2 border-black flex justify-between items-end text-xs text-black">
        <div>
          <div className="font-bold">Customer Signature</div>
          <div className="text-[10px] mt-0.5 font-medium">Verified & Received in Good Condition</div>
        </div>

        <div className="text-right">
          <div className="font-bold">For {shopName}</div>
          <div className="h-10 border-b border-black mb-1 w-48 ml-auto"></div>
          <div className="text-[10px] font-bold uppercase tracking-wider">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}

