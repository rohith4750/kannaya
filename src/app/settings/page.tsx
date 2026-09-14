'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Receipt,
  Percent,
  Printer,
  FileText,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import AdminSecurityGuard from '@/components/AdminSecurityGuard';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');

  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    printerType: '80mm',
    defaultGstPercent: 18,
    defaultHsnCode: '8544',
    termsConditions: '',
    bankDetails: '',
    upiId: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSenderEmail: '',
    alertRecipientEmail: '',
    enableCreditLimitAlerts: true,
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('kannaya_user_role') as 'ADMIN' | 'STAFF';
    if (savedRole) setUserRole(savedRole);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok && data) {
        setFormData({
          shopName: data.shopName || '',
          tagline: data.tagline || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          gstin: data.gstin || '',
          printerType: data.printerType || '80mm',
          defaultGstPercent: data.defaultGstPercent !== undefined ? data.defaultGstPercent : 18,
          defaultHsnCode: data.defaultHsnCode || '8544',
          termsConditions: data.termsConditions || '',
          bankDetails: data.bankDetails || '',
          upiId: data.upiId || '',
          smtpHost: data.smtpHost || 'smtp.gmail.com',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpPass: data.smtpPass || '',
          smtpSenderEmail: data.smtpSenderEmail || '',
          alertRecipientEmail: data.alertRecipientEmail || '',
          enableCreditLimitAlerts: data.enableCreditLimitAlerts !== undefined ? data.enableCreditLimitAlerts : true,
        });
      } else {
        setErrorMessage(data.error || 'Failed to load settings');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error fetching store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      // First save current settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-smtp', recipientEmail: formData.alertRecipientEmail || formData.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpTestResult({ success: true, message: data.message });
      } else {
        setSmtpTestResult({ success: false, message: data.error || 'SMTP Test Failed' });
      }
    } catch (e: any) {
      setSmtpTestResult({ success: false, message: e.message || 'SMTP Connection Error' });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-[#4a4a4a]">
          <div className="w-8 h-8 border-3 border-[#6d8196] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wide">Loading System Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminSecurityGuard
      moduleName="System & Store Settings"
      moduleDescription="Configures shop profile, GST rates, thermal printer width, bank UPI details, and SMTP email credentials."
    >
      <div className="w-full select-none pb-16 md:pb-4">
      {/* Single Consolidated Settings Card Box */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm flex flex-col overflow-hidden">
        {/* Unified Card Top Header Bar */}
        <div className="p-3.5 border-b border-[#cbcbcb] bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a]">System & Store Settings</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Configure store profile, default tax rates, thermal printer format, and invoice terms.
              </p>
            </div>
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-[5px] bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 border border-[#cbcbcb]/40"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#ffffe3]" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Notifications Banner */}
        {saveSuccess && (
          <div className="m-3.5 p-3 bg-emerald-50 border border-emerald-300 rounded-[5px] text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>System settings updated successfully! New defaults apply across POS billing, invoices, and products.</span>
          </div>
        )}

        {errorMessage && (
          <div className="m-3.5 p-3 bg-rose-50 border border-rose-300 rounded-[5px] text-rose-800 text-xs flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {userRole !== 'ADMIN' && (
          <div className="m-3.5 p-3 bg-amber-50 border border-amber-300 rounded-[5px] text-amber-900 text-xs flex items-center gap-2 shadow-sm">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>You are currently in <strong>Staff Mode</strong>. Settings can only be modified by an Admin.</span>
          </div>
        )}

        {/* Card Body - Single Form Grid */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols) - Form Fields */}
            <div className="lg:col-span-2 space-y-5">
              {/* Section 1: Business Profile */}
              <div className="space-y-3 pb-5 border-b border-[#cbcbcb]">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#6d8196]" />
                  <h2 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Business Profile</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#6d8196]" /> Store / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={userRole !== 'ADMIN'}
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      placeholder="e.g. VENKATA LAKSHMI ELECTRONICS"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <TagIcon className="w-3.5 h-3.5 text-[#6d8196]" /> Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="e.g. Complete Electrical & Hardware Solutions"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#6d8196]" /> Contact Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={userRole !== 'ADMIN'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#6d8196]" /> Business Email
                    </label>
                    <input
                      type="email"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. contact@store.com"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6d8196]" /> Full Store Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      disabled={userRole !== 'ADMIN'}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Shop number, Street, City, Pincode"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#6d8196]" /> GSTIN / Tax Identification Number *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={userRole !== 'ADMIN'}
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 36ABCDE1234F1Z5"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs font-mono font-bold text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] uppercase disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tax & Billing Defaults */}
              <div className="space-y-3 pb-5 border-b border-[#cbcbcb]">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#6d8196]" />
                  <h2 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Tax & Billing Defaults</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#6d8196]" /> Default GST Rate (%)
                    </label>
                    <select
                      disabled={userRole !== 'ADMIN'}
                      value={formData.defaultGstPercent}
                      onChange={(e) => setFormData({ ...formData, defaultGstPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    >
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST (Standard)</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#6d8196]" /> Default HSN Code
                    </label>
                    <input
                      type="text"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.defaultHsnCode}
                      onChange={(e) => setFormData({ ...formData, defaultHsnCode: e.target.value })}
                      placeholder="e.g. 8544"
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs font-mono font-bold text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-[#6d8196]" /> Receipt Format
                    </label>
                    <select
                      disabled={userRole !== 'ADMIN'}
                      value={formData.printerType}
                      onChange={(e) => setFormData({ ...formData, printerType: e.target.value })}
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    >
                      <option value="80mm">80mm (Standard POS Thermal)</option>
                      <option value="58mm">58mm (Mini Receipt Thermal)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Terms & Payment Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#6d8196]" />
                  <h2 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Invoice Terms & Bank Details</h2>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#6d8196]" /> Terms & Conditions (Footer)
                    </label>
                    <textarea
                      rows={2}
                      disabled={userRole !== 'ADMIN'}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                      placeholder="e.g. Goods once sold will not be returned or exchanged. Subject to local jurisdiction."
                      className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#6d8196]" /> Bank Account Details
                      </label>
                      <input
                        type="text"
                        disabled={userRole !== 'ADMIN'}
                        value={formData.bankDetails}
                        onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                        placeholder="State Bank of India A/C: 1234567890 | IFSC: SBIN0001234"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#4a4a4a] flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#6d8196]" /> Business UPI ID
                      </label>
                      <input
                        type="text"
                        disabled={userRole !== 'ADMIN'}
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="e.g. 9876543210@paytm"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs font-mono font-bold text-[#4a4a4a] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6d8196] disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: SMTP Email Alerts & Customer Credit Limit Configuration */}
              <div className="space-y-3 pt-5 border-t border-[#cbcbcb]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">
                      SMTP Email & Credit Limit Alerts
                    </h2>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#4a4a4a]">
                    <input
                      type="checkbox"
                      disabled={userRole !== 'ADMIN'}
                      checked={formData.enableCreditLimitAlerts}
                      onChange={(e) => setFormData({ ...formData, enableCreditLimitAlerts: e.target.checked })}
                      className="w-4 h-4 accent-emerald-700"
                    />
                    <span>Enable SMTP Credit Alerts</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  When a customer balance crosses their credit limit, an automated HTML email alert will be sent via SMTP to all configured admins and recipients.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">SMTP Host Server</label>
                    <input
                      type="text"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">SMTP Port</label>
                    <input
                      type="number"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                      placeholder="587 or 465"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">SMTP Username / Email</label>
                    <input
                      type="text"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.smtpUser}
                      onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                      placeholder="e.g. alerts@venkatalakshmi.com"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">SMTP Password / App Password</label>
                    <input
                      type="password"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.smtpPass}
                      onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">Sender Email Address</label>
                    <input
                      type="email"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.smtpSenderEmail}
                      onChange={(e) => setFormData({ ...formData, smtpSenderEmail: e.target.value })}
                      placeholder="e.g. noreply@venkatalakshmi.com"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#4a4a4a]">Admin Alert Recipient Email</label>
                    <input
                      type="email"
                      disabled={userRole !== 'ADMIN'}
                      value={formData.alertRecipientEmail}
                      onChange={(e) => setFormData({ ...formData, alertRecipientEmail: e.target.value })}
                      placeholder="e.g. owner@venkatalakshmi.com"
                      className="w-full bg-white border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-xs text-[#4a4a4a] font-mono focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>
                </div>

                {userRole === 'ADMIN' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testingSmtp}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-[5px] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
                    >
                      {testingSmtp ? 'Testing SMTP Connection...' : '✉️ Send Test SMTP Alert Email'}
                    </button>

                    {smtpTestResult && (
                      <span className={`text-xs font-bold ${smtpTestResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {smtpTestResult.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Live Receipt Preview */}
            <div className="space-y-3">
              <div className="bg-slate-50 border border-[#cbcbcb] rounded-[5px] p-3.5 shadow-sm sticky top-16">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#cbcbcb] mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#6d8196]" />
                    <h3 className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Live Receipt Header</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#6d8196] text-white font-mono font-bold uppercase">
                    {formData.printerType}
                  </span>
                </div>

                {/* Thermal Receipt Box Simulation */}
                <div className="bg-white text-black p-3.5 rounded border border-slate-300 font-mono text-[11px] space-y-2.5 leading-tight shadow-sm select-text">
                  <div className="text-center space-y-0.5 border-b border-black pb-2">
                    <h4 className="font-bold text-xs tracking-tight uppercase">
                      {formData.shopName || 'YOUR STORE NAME'}
                    </h4>
                    <p className="text-[9px] text-gray-600">{formData.tagline || 'Store Slogan'}</p>
                    <p className="text-[9px] text-gray-800 whitespace-pre-line">{formData.address || 'Store Address'}</p>
                    <p className="text-[9px] font-semibold">Ph: {formData.phone || '+91 XXXXXXXXXX'}</p>
                    <p className="text-[9px] font-bold border-t border-dashed border-gray-400 pt-1 mt-1">
                      GSTIN: {formData.gstin || '36XXXXXXXXXXXXX'}
                    </p>
                  </div>

                  {/* Sample Bill Info */}
                  <div className="text-[9px] border-b border-black pb-1.5 space-y-0.5">
                    <div className="flex justify-between">
                      <span>BILL: INV-2026-0001</span>
                      <span>14/09/2026</span>
                    </div>
                    <div>CUST: Walk-in Customer</div>
                  </div>

                  {/* Sample Items Table */}
                  <div className="text-[9px] space-y-1 border-b border-black pb-1.5">
                    <div className="flex justify-between font-bold border-b border-dashed border-gray-400 pb-0.5">
                      <span>ITEM</span>
                      <span>QTY x RATE</span>
                      <span>AMT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wiring Cable 1.5sq</span>
                      <span>2 x ₹450</span>
                      <span>₹900.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-[8px]">
                      <span>HSN: {formData.defaultHsnCode || '8544'}</span>
                      <span>GST: {formData.defaultGstPercent}%</span>
                    </div>
                  </div>

                  {/* Sample Totals */}
                  <div className="text-[10px] font-bold flex justify-between pt-0.5">
                    <span>TOTAL AMOUNT:</span>
                    <span>₹900.00</span>
                  </div>

                  {/* Sample Footer */}
                  <div className="text-[8px] text-center text-gray-600 pt-1.5 border-t border-dashed border-gray-400 space-y-0.5">
                    {formData.upiId && <p>Pay via UPI: {formData.upiId}</p>}
                    <p className="italic">{formData.termsConditions || 'Thank you for shopping with us!'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    </AdminSecurityGuard>
  );
}

function TagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.41 2.41 0 0 0 3.408 0l5.88-5.88a2.41 2.41 0 0 0 0-3.408z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
