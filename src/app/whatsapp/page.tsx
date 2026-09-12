'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Phone, CheckCircle, Users, Truck, AlertTriangle } from 'lucide-react';

export default function WhatsAppPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data.filter((c) => c.outstanding > 0));
        }
      });
  }, []);

  const handleSendReminder = async (customer: any) => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reminder',
          customerPhone: customer.phone,
          customerName: customer.name,
          dueAmount: customer.outstanding,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" /> WhatsApp Automation Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Instantly share bills, send formatted payment due reminders, and dispatch supplier purchase orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Payment Reminders Column */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Customers with Outstanding Udhar Dues ({customers.length})
          </h3>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {customers.length > 0 ? (
              customers.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-amber-400" /> {c.phone}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400">Due Balance</div>
                      <div className="font-black text-amber-400">₹{c.outstanding.toLocaleString('en-IN')}</div>
                    </div>
                    <button
                      onClick={() => handleSendReminder(c)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Reminder
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                All customer credit accounts are fully cleared! No pending reminders.
              </p>
            )}
          </div>
        </div>

        {/* Formatted Message Preview Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Automated Message Template Preview</h3>
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2 font-mono text-emerald-200">
            <p className="font-bold">⚡ SRI LAKSHMI ELECTRICALS & HARDWARE ⚡</p>
            <p>Dear Ramesh Kumar,</p>
            <p>Your outstanding credit balance (Udhar) is ₹18,500.</p>
            <p>Kindly settle the amount via Cash or UPI.</p>
            <p>Thank you!</p>
          </div>
          <p className="text-[11px] text-slate-400">
            WhatsApp links open directly in WhatsApp Web or WhatsApp Desktop with pre-filled message text.
          </p>
        </div>
      </div>
    </div>
  );
}
