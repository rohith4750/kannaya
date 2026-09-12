'use client';

import React, { useState, useEffect } from 'react';
import { Barcode as BarcodeIcon, Search, Printer, Layers, Tag } from 'lucide-react';

export default function BarcodePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  const handlePrintBarcodes = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarcodeIcon className="w-5 h-5 text-amber-400" /> Barcode Studio & Sticker Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable barcode labels complete with product name, price, and rack location tags.
          </p>
        </div>
        <button
          onClick={handlePrintBarcodes}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg shadow-amber-500/10"
        >
          <Printer className="w-4 h-4" /> Print Sticker Sheet
        </button>
      </div>

      {/* Search filter */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product to view barcode label..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Barcode Labels Grid (Printable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white text-slate-950 p-4 rounded-xl shadow-md border border-slate-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase">SRI LAKSHMI ERP</span>
                <span className="text-[10px] font-bold bg-amber-200 text-slate-900 px-1.5 py-0.5 rounded">
                  {p.rack ? `${p.rack.rackName} (${p.rack.shelfCode})` : 'Rack A1'}
                </span>
              </div>

              <h4 className="text-xs font-bold leading-tight line-clamp-2">{p.name}</h4>
              <div className="text-[10px] text-slate-600 mt-0.5">{p.brand?.name}</div>
            </div>

            {/* Visual Barcode Simulation */}
            <div className="my-3 py-2 bg-slate-50 rounded border border-slate-200 text-center">
              <div className="h-10 flex items-center justify-center gap-1 overflow-hidden px-2">
                {p.barcode.split('').map((char: string, i: number) => {
                  const num = parseInt(char, 10) || 1;
                  const widths = [1, 2, 3, 1.5, 2.5];
                  const w = widths[num % widths.length];
                  return (
                    <div
                      key={i}
                      className="bg-slate-950 h-full"
                      style={{ width: `${w * 2}px` }}
                    />
                  );
                })}
              </div>
              <div className="font-mono text-[11px] font-bold text-slate-800 tracking-widest mt-1">
                {p.barcode}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-300">
              <span className="text-[10px] text-slate-600 uppercase font-semibold">MRP / Price</span>
              <span className="text-sm font-black text-slate-950">₹{p.sellingPrice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
