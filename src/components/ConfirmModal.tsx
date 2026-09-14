'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'primary':
      default:
        return 'bg-[#6d8196] hover:bg-[#5b6f84] text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[5px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#cbcbcb] transform transition-all">
        {/* Header with Icon */}
        <div className="flex items-start justify-between border-b border-[#cbcbcb] pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-full ${
                confirmVariant === 'danger'
                  ? 'bg-rose-100 text-rose-700'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#4a4a4a]">{title}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Confirmation Required</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-[5px] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <div className="bg-slate-50 p-3.5 rounded-[5px] border border-[#cbcbcb] text-xs text-[#4a4a4a] leading-relaxed font-medium">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-[#4a4a4a] px-4 py-2 rounded-[5px] text-xs font-bold transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-[5px] text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${getVariantStyles()} disabled:opacity-50`}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                {confirmVariant === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
