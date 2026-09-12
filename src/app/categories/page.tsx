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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-400" /> Categories & Brands Taxonomy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamically manage product categories, manufacturer brands, and taxonomy structures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={() => setShowBrandModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Brand
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" /> Product Categories ({categories.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{c.description || 'General Category'}</div>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {c._count?.products || 0} Products
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brands List Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" /> Manufacturer Brands ({brands.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {brands.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-white">{b.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {b._count?.products || 0} Products
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" /> Add Product Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Solar Panels, Heavy Wires"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="e.g. Solar inverters and PV panels"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" /> Add Manufacturer Brand
            </h3>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Brand Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Schneider, Legrand, Polycab"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold"
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
