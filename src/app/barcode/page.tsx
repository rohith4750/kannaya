'use client';

import React from 'react';
import { Barcode as BarcodeIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BarcodePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-[#4a4a4a]">
      {/* Disabled Feature Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-[5px] p-6 shadow-sm flex items-start gap-4">
        <div className="p-2.5 rounded-[5px] bg-amber-100 text-amber-700">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-amber-900 flex items-center gap-2">
            <BarcodeIcon className="w-5 h-5 text-amber-700" /> Barcode Studio & Scanner System Disabled
          </h1>
          <p className="text-xs text-amber-800 leading-relaxed">
            The Barcode Studio sticker generator and scanner features have been temporarily commented out / disabled as requested.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-block bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-2 rounded-[5px] text-xs transition-colors shadow-sm"
            >
              ← Back to Inventory & Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
