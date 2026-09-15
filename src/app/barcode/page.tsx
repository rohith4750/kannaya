'use client';

import React, { useState, useEffect } from 'react';
import { Barcode as BarcodeIcon, Printer, Search, Layers, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function BarcodePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [variantList, setVariantList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [copies, setCopies] = useState<number>(10);
  const [stickerFormat, setStickerFormat] = useState<'50x25' | '38x25'>('50x25');

  const loadData = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        const vItems: any[] = [];
        data.forEach((p) => {
          if (Array.isArray(p.variants)) {
            p.variants.forEach((v: any) => {
              vItems.push({
                ...v,
                productName: p.name,
                unit: p.unit,
                gstPercent: p.gstPercent,
                brandName: p.brand?.name,
              });
            });
          }
        });
        setVariantList(vItems);
        if (vItems.length > 0) setSelectedVariant(vItems[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVariants = variantList.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.productName.toLowerCase().includes(q) ||
      v.variantName.toLowerCase().includes(q) ||
      v.barcode.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3.5 p-1 overflow-hidden">
      {/* Variant Selector List */}
      <div className="w-full lg:w-1/3 bg-white border border-[#cbcbcb] rounded-[5px] p-3.5 flex flex-col h-full overflow-hidden shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#cbcbcb] shrink-0">
          <h1 className="text-xs font-black uppercase tracking-wider text-[#4a4a4a] flex items-center gap-2">
            <BarcodeIcon className="w-4 h-4 text-[#6d8196]" /> Variant Barcode Studio
          </h1>
          <span className="text-[10px] font-bold text-[#6d8196] bg-[#6d8196]/10 px-2 py-0.5 rounded-full">
            {variantList.length} Variants
          </span>
        </div>

        <div className="my-2.5 relative shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variant name or barcode..."
            className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
          />
        </div>

        {/* Variant Items */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 custom-scrollbar pr-1">
          {filteredVariants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(v)}
              className={`w-full text-left p-2.5 rounded-[5px] border transition-all ${
                selectedVariant?.id === v.id
                  ? 'bg-[#ffffe3] border-[#6d8196] shadow-2xs font-bold'
                  : 'bg-white border-[#cbcbcb] hover:bg-slate-50'
              }`}
            >
              <div className="text-xs text-[#4a4a4a] font-bold truncate">
                {v.productName} ({v.variantName})
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Barcode: {v.barcode}</span>
                <span className="font-bold text-emerald-800">₹{v.sellingPrice}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Label Preview & Print Config */}
      <div className="flex-1 bg-white border border-[#cbcbcb] rounded-[5px] p-5 flex flex-col h-full overflow-hidden shadow-sm">
        {selectedVariant ? (
          <div className="flex flex-col h-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#cbcbcb]">
              <div>
                <h2 className="text-sm font-bold text-[#4a4a4a]">
                  Barcode Sticker Preview: {selectedVariant.productName} ({selectedVariant.variantName})
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select sticker label format and number of print copies below.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">Copies:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2 py-1 text-center text-xs font-bold"
                  />
                </div>

                <button
                  onClick={handlePrint}
                  className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs shadow-sm transition-all border border-[#cbcbcb]/40"
                >
                  <Printer className="w-4 h-4" /> Print Barcode Labels
                </button>
              </div>
            </div>

            {/* Sticker Grid Container for Thermal Printer */}
            <div className="flex-1 overflow-y-auto bg-slate-100 border border-[#cbcbcb] rounded-[5px] p-6 custom-scrollbar print:bg-white print:p-0 print:border-none">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-2 print:gap-1">
                {Array.from({ length: copies }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border-2 border-dashed border-slate-300 print:border-solid print:border-black rounded-[4px] p-2 flex flex-col items-center justify-between text-center min-h-[110px] shadow-2xs print:shadow-none"
                  >
                    <div className="text-[9px] font-black uppercase text-slate-900 leading-tight">
                      VENKATA LAKSHMI ELEC.
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 line-clamp-1 leading-snug">
                      {selectedVariant.productName}
                    </div>
                    <div className="text-[10px] font-extrabold text-blue-900">
                      Variant: {selectedVariant.variantName}
                    </div>

                    {/* Fake barcode font representation */}
                    <div className="font-mono text-xl tracking-widest text-slate-900 py-1 font-bold">
                      ||| | |||| | ||| |
                    </div>

                    <div className="text-[10px] font-mono text-slate-800 font-semibold">
                      {selectedVariant.barcode}
                    </div>

                    <div className="w-full flex items-center justify-between border-t border-slate-300 pt-1 mt-0.5 text-[9px] font-bold">
                      <span className="text-slate-600">Incl. GST 18%</span>
                      <span className="text-emerald-900 text-xs font-black">₹{selectedVariant.sellingPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <BarcodeIcon className="w-12 h-12 mb-2 stroke-[1.5]" />
            <p>Select a product variant on the left to preview barcode stickers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
