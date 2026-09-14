'use client';

import React, { useState, useEffect } from 'react';
import { FolderPlus, Tag, Plus, Package, Layers, Edit2, Trash2 } from 'lucide-react';

export default function CategoriesBrandsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [brandName, setBrandName] = useState('');

  const loadData = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);
      const cData = await cRes.json();
      const bData = await bRes.json();
      if (Array.isArray(cData)) setCategories(cData);
      if (Array.isArray(bData)) setBrands(bData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: catDesc }),
      });
      if (res.ok) {
        setShowCatModal(false);
        setCatName('');
        setCatDesc('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName }),
      });
      if (res.ok) {
        setShowBrandModal(false);
        setBrandName('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-105px)] flex flex-col overflow-hidden">
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden p-5 flex flex-col h-full space-y-4">
        {/* Single Container Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#cbcbcb] pb-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-[#4a4a4a] flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#6d8196]" /> Categories & Brands Taxonomy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dynamically manage product categories, manufacturer brands, and taxonomy structures.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCatModal(true)}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3.5 py-1.5 rounded-[5px] flex items-center gap-2 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
            <button
              onClick={() => setShowBrandModal(true)}
              className="bg-[#4a4a4a] hover:bg-[#383838] text-white font-bold px-3.5 py-1.5 rounded-[5px] flex items-center gap-2 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
            >
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          </div>
        </div>

        {/* Categories & Brands Independent Scroll Lists */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Categories List Container */}
          <div className="flex flex-col h-full min-h-0 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#6d8196]" /> Product Categories ({categories.length})
              </h3>
            </div>

            {/* Internal Independent Scroll for Categories */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 space-y-2 custom-scrollbar">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between text-xs hover:border-[#6d8196] transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#4a4a4a]">{c.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{c.description || 'General Category'}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 shrink-0 ml-2">
                    {c._count?.products || 0} Products
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brands List Container */}
          <div className="flex flex-col h-full min-h-0 space-y-3 overflow-hidden border-l-0 lg:border-l border-[#cbcbcb]/60 pl-0 lg:pl-6">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#6d8196]" /> Manufacturer Brands ({brands.length})
              </h3>
            </div>

            {/* Internal Independent Scroll for Brands */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 grid grid-cols-2 gap-2 content-start custom-scrollbar">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-50 p-3 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between text-xs hover:border-[#6d8196] transition-colors h-[50px]"
                >
                  <span className="font-bold text-[#4a4a4a] truncate pr-2">{b.name}</span>
                  <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 shrink-0">
                    {b._count?.products || 0} Products
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <FolderPlus className="w-4 h-4 text-[#6d8196]" /> Add Product Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Solar Panels, Heavy Wires"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="e.g. Solar inverters and PV panels"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2 border-b border-[#cbcbcb] pb-2">
              <Tag className="w-4 h-4 text-[#6d8196]" /> Add Manufacturer Brand
            </h3>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Brand Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Schneider, Legrand, Polycab"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-2 text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="w-1/2 bg-slate-100 border border-[#cbcbcb] text-[#4a4a4a] py-2 rounded-[5px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
