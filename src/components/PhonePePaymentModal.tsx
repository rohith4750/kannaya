'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Copy, ExternalLink, RefreshCw, X, AlertCircle, Smartphone } from 'lucide-react';

interface PhonePePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  invoiceNo?: string;
  onPaymentSuccess: (paymentDetails: { txnId: string; method: 'PHONEPE_UPI'; amount: number }) => void;
}

export default function PhonePePaymentModal({
  isOpen,
  onClose,
  amount,
  customerName,
  customerPhone,
  invoiceNo,
  onPaymentSuccess,
}: PhonePePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [upiString, setUpiString] = useState<string>('');
  const [merchantVpa, setMerchantVpa] = useState<string>('9876543210@ybl');
  const [txnId, setTxnId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && amount > 0) {
      initiatePhonePePayment();
    }
  }, [isOpen, amount, invoiceNo]);

  const initiatePhonePePayment = async () => {
    setLoading(true);
    setStatusMessage(null);
    setPaymentSuccess(false);

    const generatedTxnId = `INV_${invoiceNo || Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setTxnId(generatedTxnId);

    try {
      const res = await fetch('/api/phonepe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          transactionId: generatedTxnId,
          customerMobile: customerPhone,
          note: `Payment for ${invoiceNo ? `Invoice ${invoiceNo}` : 'Store Purchase'}`,
        }),
      });

      const data = await res.json();
      if (data.upiQrString) {
        setUpiString(data.upiQrString);
        setMerchantVpa(data.vpa || '9876543210@ybl');
        
        // Generate high-resolution QR code image using qrserver API
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(data.upiQrString)}&margin=10`;
        setQrUrl(qrImage);
      }
    } catch (err: any) {
      console.error('PhonePe Init Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!txnId) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/phonepe?txnId=${txnId}`);
      const data = await res.json();
      if (data.success || data.state === 'COMPLETED' || data.state === 'SUCCESS') {
        setPaymentSuccess(true);
        setStatusMessage('✅ Payment verified successfully!');
        setTimeout(() => {
          onPaymentSuccess({ txnId, method: 'PHONEPE_UPI', amount });
        }, 1200);
      } else {
        setStatusMessage(`⏳ Status: ${data.state || 'PENDING'}. Please scan QR code to pay.`);
      }
    } catch (e: any) {
      setStatusMessage(`⚠️ Status check error: ${e.message}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmManualPaid = () => {
    setPaymentSuccess(true);
    onPaymentSuccess({ txnId, method: 'PHONEPE_UPI', amount });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-purple-200 rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Header with PhonePe Branding */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white -m-5 p-4 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Smartphone className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white">PhonePe Business Payment</h3>
              <p className="text-[10px] text-purple-200">Scan & Pay via any UPI App (PhonePe, GPay, Paytm)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-[5px] p-3 text-xs flex items-center justify-between mt-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Payable Amount</div>
            <div className="text-xl font-black text-purple-900">₹{amount.toLocaleString('en-IN')}</div>
            {invoiceNo && <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Ref: Invoice #{invoiceNo}</div>}
          </div>
          {customerName && (
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">Customer</div>
              <div className="font-bold text-slate-800">{customerName}</div>
              {customerPhone && <div className="text-[10px] text-slate-500 font-mono">{customerPhone}</div>}
            </div>
          )}
        </div>

        {/* Dynamic QR Code Display */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          {loading ? (
            <div className="w-48 h-48 border-2 border-dashed border-purple-300 rounded-[8px] flex flex-col items-center justify-center bg-purple-50/30">
              <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mb-2" />
              <span className="text-xs text-purple-700 font-bold">Generating PhonePe QR...</span>
            </div>
          ) : qrUrl ? (
            <div className="relative group p-2 bg-white rounded-[8px] border-2 border-purple-500 shadow-md">
              <img src={qrUrl} alt="PhonePe Business QR Code" className="w-48 h-48 object-contain rounded-[4px]" />
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[8px]">
                <a
                  href={upiString}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-700 text-white font-bold px-3 py-1.5 rounded-[5px] text-xs flex items-center gap-1 shadow-sm hover:bg-purple-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open UPI App
                </a>
              </div>
            </div>
          ) : (
            <div className="text-xs text-red-600">Failed to load QR code</div>
          )}

          {/* VPA Copy Bar */}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1 rounded-[5px] text-xs text-slate-700 font-mono">
            <span className="font-bold text-purple-800">UPI VPA:</span> {merchantVpa}
            <button onClick={handleCopyVpa} className="text-slate-500 hover:text-purple-700 ml-1" title="Copy VPA">
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-2 rounded-[5px] text-xs text-center font-bold border ${
              paymentSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus || paymentSuccess}
              className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 font-bold py-2 px-3 rounded-[5px] text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              {checkingStatus ? 'Checking Status...' : 'Check Payment Status'}
            </button>
            <a
              href={upiString}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-3 rounded-[5px] text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" /> Open App
            </a>
          </div>

          <button
            onClick={handleConfirmManualPaid}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-[5px] text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm Received Payment (₹{amount})
          </button>
        </div>
      </div>
    </div>
  );
}
