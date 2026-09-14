'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Plus,
  Save,
  FolderPlus,
  Tag,
  MapPin,
  Barcode,
  DollarSign,
  ShieldAlert,
  X,
  CheckCircle,
  FileText,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';

export default function AddNewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Category & Brand creation modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Extended Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    hsnCode: '8544',
    gstPercent: '18',
    unit: 'pcs',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minWholesaleQty: '10',
    stockQuantity: '',
    minStockAlert: '10',
    warranty: '',
    description: '',
    categoryId: '',
    brandId: '',
    rackId: '',
  });

  const loadDropdowns = async () => {
    try {
      const [cRes, bRes, rRes, sRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/racks'),
        fetch('/api/settings'),
      ]);

      const cData = await cRes.json();
      const bData = await bRes.json();
      const rData = await rRes.json();
      const sData = await sRes.json();

      if (Array.isArray(cData)) setCategories(cData);
      if (Array.isArray(bData)) setBrands(bData);
      if (Array.isArray(rData)) setRacks(rData);

      if (sData) {
        setFormData((prev) => ({
          ...prev,
          hsnCode: sData.defaultHsnCode || prev.hsnCode,
          gstPercent: sData.defaultGstPercent !== undefined ? String(sData.defaultGstPercent) : prev.gstPercent,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });
      if (res.ok) {
        const createdCat = await res.json();
        setCategories((prev) => [...prev, createdCat]);
        setFormData((prev) => ({ ...prev, categoryId: createdCat.id }));
        setNewCatName('');
        setNewCatDesc('');
        setShowAddCategoryModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName }),
      });
      if (res.ok) {
        const createdBrand = await res.json();
        setBrands((prev) => [...prev, createdBrand]);
        setFormData((prev) => ({ ...prev, brandId: createdBrand.id }));
        setNewBrandName('');
        setShowAddBrandModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/products');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Failed to add product: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-8">
      <form onSubmit={handleSubmit} className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm p-5 space-y-5">
        {/* Top Header Row inside the single card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbcbcb] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-slate-700 p-2 rounded-[5px] transition-colors"
              title="Back to Products Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#6d8196]" /> Add New Inventory Product
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Fill in product details, pricing, rack location, and stock quantities below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#cbcbcb] font-semibold px-3 py-1.5 rounded-[5px] text-xs transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-4 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm border border-[#cbcbcb]/40 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Product...' : 'Save Product'}
            </button>
          </div>
        </div>

        {/* Section 1: Basic Identifiers */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#6d8196]" /> 1. Basic Details & Identifiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[#4a4a4a] font-bold block mb-1">
                Product Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Polycab 1.5 Sqmm FR Wire (Red) 90m Roll"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-medium focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[#4a4a4a] font-bold block mb-1">Barcode / EAN / SKU</label>
              <div className="relative">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value, sku: e.target.value })}
                  placeholder="Scan or type barcode..."
                  className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-[#cbcbcb]" />

        {/* Section 2: Categorization, Placement & Tax Rules in single line row */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
            <FolderPlus className="w-3.5 h-3.5 text-[#6d8196]" /> 2. Categorization, Location & Taxes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#4a4a4a] font-bold">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="text-amber-700 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Category
                </button>
              </div>
              <MaterialSelect
                value={formData.categoryId}
                onChange={(val) => setFormData({ ...formData, categoryId: val })}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#4a4a4a] font-bold">Brand / Manufacturer</label>
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(true)}
                  className="text-amber-700 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Brand
                </button>
              </div>
              <MaterialSelect
                value={formData.brandId}
                onChange={(val) => setFormData({ ...formData, brandId: val })}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">Rack Location</label>
              <MaterialSelect
                value={formData.rackId}
                onChange={(val) => setFormData({ ...formData, rackId: val })}
                options={racks.map((r) => ({ value: r.id, label: `${r.rackName} (${r.shelfCode})` }))}
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="8544"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <MaterialSelect
                label="GST Tax Rate (%)"
                value={formData.gstPercent}
                onChange={(val) => setFormData({ ...formData, gstPercent: val })}
                options={[
                  { value: '18', label: '18% GST' },
                  { value: '12', label: '12% GST' },
                  { value: '5', label: '5% GST' },
                  { value: '28', label: '28% GST' },
                  { value: '0', label: '0% GST (Exempt)' },
                ]}
              />
            </div>

            <div>
              <MaterialSelect
                label="Unit"
                value={formData.unit}
                onChange={(val) => setFormData({ ...formData, unit: val })}
                options={[
                  { value: 'pcs', label: 'pcs' },
                  { value: 'meter', label: 'meter' },
                  { value: 'box', label: 'box' },
                  { value: 'roll', label: 'roll' },
                  { value: 'set', label: 'set' },
                  { value: 'pkt', label: 'pkt' },
                  { value: 'kg', label: 'kg' },
                ]}
              />
            </div>
          </div>
        </div>

        <hr className="border-[#cbcbcb]" />

        {/* Section 3: Pricing & Stock Quantities in single line row */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> 3. Pricing, Margins & Stock Quantities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">
                Purchase Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-bold focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">
                Retail Price (₹) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-emerald-700 font-extrabold focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">Wholesale Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                placeholder="Contractor rate"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-amber-700 font-extrabold focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">Min Wholesale Qty</label>
              <input
                type="number"
                value={formData.minWholesaleQty}
                onChange={(e) => setFormData({ ...formData, minWholesaleQty: e.target.value })}
                placeholder="10"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">
                Initial Stock Qty <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                placeholder="0"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-bold focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">Low Stock Alert Qty</label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                placeholder="10"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-[#cbcbcb]" />

        {/* Section 4: Warranty & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[#4a4a4a] font-bold block mb-1">Warranty Period / Guarantee</label>
            <input
              type="text"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              placeholder="e.g. 2 Years Manufacturer Warranty"
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[#4a4a4a] font-bold block mb-1">Detailed Specifications / Notes</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Technical specifications, batch details, or item notes..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#cbcbcb]">
          <Link
            href="/products"
            className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-slate-700 font-semibold px-4 py-1.5 rounded-[5px] text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-6 py-1.5 rounded-[5px] flex items-center gap-2 text-xs transition-all shadow-md border border-[#cbcbcb]/40 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Registering Product...' : 'Save & Register Product'}
          </button>
        </div>
      </form>

      {/* DYNAMIC CATEGORY CREATION MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h4 className="text-xs font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#6d8196]" /> Create New Category
              </h4>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Solar Panels, Modular Switches"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px]">
                Add Category Dynamically
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC BRAND CREATION MODAL */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h4 className="text-xs font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#6d8196]" /> Create New Brand
              </h4>
              <button onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold">Brand Name</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Schneider, Anchor, Polycab"
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px]">
                Add Brand Dynamically
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
