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
  Barcode,
  DollarSign,
  X,
  Trash2,
  Zap,
  Layers,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';

interface VariantRow {
  variantName: string;
  barcode: string;
  hsnCode?: string;
  purchasePrice: string;
  sellingPrice: string;
  wholesalePrice: string;
  minWholesaleQty: string;
  stockQuantity: string;
  minStockAlert: string;
  rackId: string;
}

export default function AddNewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);
  const [enableWholesale, setEnableWholesale] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Category & Brand creation modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Base Product Form State
  const [productData, setProductData] = useState({
    name: '',
    hsnCode: '8544',
    gstPercent: '18',
    unit: 'pcs',
    warranty: '',
    description: '',
    categoryId: '',
    brandId: '',
  });

  // Variant Rows
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      variantName: '1.5 SQMM',
      barcode: '',
      hsnCode: '',
      purchasePrice: '',
      sellingPrice: '',
      wholesalePrice: '',
      minWholesaleQty: '10',
      stockQuantity: '50',
      minStockAlert: '10',
      rackId: '',
    },
  ]);

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
        setEnableWholesale(!!sData.enableWholesale);
        setProductData((prev) => ({
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
        setProductData((prev) => ({ ...prev, categoryId: createdCat.id }));
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
        setProductData((prev) => ({ ...prev, brandId: createdBrand.id }));
        setNewBrandName('');
        setShowAddBrandModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Electrical Preset Auto-Generators
  const applyPreset = (presetType: 'wires' | 'bulbs' | 'mcb' | 'pipes' | 'switches' | 'fans') => {
    let names: string[] = [];
    let unit = 'pcs';
    let hsn = '8544';

    if (presetType === 'wires') {
      names = ['1 SQMM', '1.5 SQMM', '2.5 SQMM', '4 SQMM', '6 SQMM'];
      unit = 'roll';
      hsn = '8544';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'Finolex Wire', unit, hsnCode: hsn }));
    } else if (presetType === 'bulbs') {
      names = ['9W', '12W', '15W', '20W'];
      unit = 'pcs';
      hsn = '8539';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'Havells LED Bulb', unit, hsnCode: hsn, gstPercent: '12' }));
    } else if (presetType === 'mcb') {
      names = ['6A', '10A', '16A', '20A', '32A'];
      unit = 'pcs';
      hsn = '8536';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'Schneider MCB', unit, hsnCode: hsn }));
    } else if (presetType === 'pipes') {
      names = ['20mm', '25mm', '32mm', '40mm'];
      unit = 'pcs';
      hsn = '3917';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'PVC Pipe 10ft', unit, hsnCode: hsn }));
    } else if (presetType === 'switches') {
      names = ['1 Way', '2 Way', 'Bell Switch', 'Fan Regulator'];
      unit = 'pcs';
      hsn = '8536';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'Anchor Modular Switch', unit, hsnCode: hsn }));
    } else if (presetType === 'fans') {
      names = ['1200mm Brown', '1200mm White', '1400mm Ivory'];
      unit = 'pcs';
      hsn = '8414';
      if (!productData.name) setProductData((p) => ({ ...p, name: 'Crompton Ceiling Fan', unit, hsnCode: hsn }));
    }

    const newRows: VariantRow[] = names.map((name, i) => ({
      variantName: name,
      barcode: `${890000 + Math.floor(Math.random() * 90000)}`,
      hsnCode: '',
      purchasePrice: '',
      sellingPrice: '',
      wholesalePrice: '',
      minWholesaleQty: '10',
      stockQuantity: '50',
      minStockAlert: '10',
      rackId: racks[0]?.id || '',
    }));

    setVariants(newRows);
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        variantName: `Variant ${prev.length + 1}`,
        barcode: `${890000 + Math.floor(Math.random() * 90000)}`,
        hsnCode: '',
        purchasePrice: '',
        sellingPrice: '',
        wholesalePrice: '',
        minWholesaleQty: '10',
        stockQuantity: '0',
        minStockAlert: '5',
        rackId: '',
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.name.trim()) {
      alert('Product name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...productData,
        name: productData.name.toUpperCase().trim(),
        hsnCode: productData.hsnCode?.toUpperCase().trim(),
        unit: productData.unit?.toUpperCase().trim(),
        warranty: productData.warranty?.toUpperCase().trim(),
        description: productData.description?.toUpperCase().trim(),
        variants: variants.map((v) => ({
          ...v,
          variantName: v.variantName?.toUpperCase().trim(),
          barcode: v.barcode?.toUpperCase().trim(),
          hsnCode: v.hsnCode ? v.hsnCode.toUpperCase().trim() : undefined,
        })),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cbcbcb] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="bg-slate-100 hover:bg-slate-200 border border-[#cbcbcb] text-slate-700 p-2 rounded-[5px] transition-colors"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#6d8196]" /> Add Electrical Product & Variants
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Store base category, HSN & GST at Product level, and configure stock & prices per Variant.
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
              <Save className="w-4 h-4" /> {loading ? 'Saving Product...' : 'Save Product & Variants'}
            </button>
          </div>
        </div>

        {/* Section 1: Product Master Fields */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#6d8196]" /> 1. Product Master Details (Common to all Variants)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[#4a4a4a] font-bold block mb-1">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={productData.name}
                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                placeholder="e.g. Finolex Wire, Havells LED Bulb"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-medium focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#4a4a4a] font-bold">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="text-amber-700 hover:underline text-[10px] font-bold"
                >
                  + Add
                </button>
              </div>
              <MaterialSelect
                value={productData.categoryId}
                onChange={(val) => setProductData({ ...productData, categoryId: val })}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#4a4a4a] font-bold">Brand</label>
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(true)}
                  className="text-amber-700 hover:underline text-[10px] font-bold"
                >
                  + Add
                </button>
              </div>
              <MaterialSelect
                value={productData.brandId}
                onChange={(val) => setProductData({ ...productData, brandId: val })}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>

            <div>
              <label className="text-[#4a4a4a] font-bold block mb-1">HSN Code</label>
              <input
                type="text"
                value={productData.hsnCode}
                onChange={(e) => setProductData({ ...productData, hsnCode: e.target.value })}
                placeholder="8544"
                className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-[#4a4a4a] font-mono focus:bg-white focus:border-[#6d8196] focus:outline-none"
              />
            </div>

            <div>
              <MaterialSelect
                label="GST Rate (%)"
                value={productData.gstPercent}
                onChange={(val) => setProductData({ ...productData, gstPercent: val })}
                options={[
                  { value: '18', label: '18% GST' },
                  { value: '12', label: '12% GST' },
                  { value: '5', label: '5% GST' },
                  { value: '28', label: '28% GST' },
                  { value: '0', label: '0% (Exempt)' },
                ]}
              />
            </div>
          </div>
        </div>

        <hr className="border-[#cbcbcb]" />

        {/* Electrical Shop Presets Quick Generator */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-[5px] p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>Electrical Shop Quick Presets: Click to Auto-Generate Variants</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => applyPreset('wires')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              ⚡ Wires (1.5, 2.5, 4, 6 SQMM)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('bulbs')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              💡 LED Bulbs (9W, 12W, 15W, 20W)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mcb')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              🔌 MCB (6A, 10A, 16A, 20A, 32A)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('pipes')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              🛠 PVC Pipes (20mm, 25mm, 32mm, 40mm)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('switches')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              🎛 Switches (1-Way, 2-Way, Regulator)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('fans')}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1 rounded-[4px] shadow-2xs transition-colors"
            >
              🌀 Fans (1200mm, 1400mm Colors)
            </button>
          </div>
        </div>

        {/* Section 2: Variant Cards Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4a4a4a] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6d8196]" /> 2. Product Variants Cards ({variants.length} variants)
            </h2>
            <button
              type="button"
              onClick={addVariantRow}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3.5 py-1.5 rounded-[5px] text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Variant Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {variants.map((row, idx) => (
              <div key={idx} className="bg-white border border-[#cbcbcb] rounded-[6px] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                {/* Card Header */}
                <div className="bg-slate-100 px-3.5 py-2 border-b border-[#cbcbcb] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#6d8196] text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#4a4a4a] truncate max-w-[150px]">
                      {row.variantName || `Variant ${idx + 1}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariantRow(idx)}
                    disabled={variants.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors disabled:opacity-30"
                    title="Delete Variant Card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-3 text-xs">
                  {/* Variant Name & Barcode */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={row.variantName}
                        onChange={(e) => updateVariant(idx, 'variantName', e.target.value)}
                        placeholder="e.g. 1.5 SQMM"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs font-bold text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={row.barcode}
                        onChange={(e) => updateVariant(idx, 'barcode', e.target.value)}
                        placeholder="Barcode"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* HSN Code & Rack Location */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        HSN Code (Variant)
                      </label>
                      <input
                        type="text"
                        value={row.hsnCode || ''}
                        onChange={(e) => updateVariant(idx, 'hsnCode', e.target.value)}
                        placeholder={productData.hsnCode || '8544'}
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Rack Location
                      </label>
                      <select
                        value={row.rackId}
                        onChange={(e) => updateVariant(idx, 'rackId', e.target.value)}
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-[#6d8196] focus:outline-none font-medium"
                      >
                        <option value="">Unassigned</option>
                        {racks.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.rackName} ({r.shelfCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 p-2.5 rounded-[5px] border border-[#cbcbcb] space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                      Pricing (₹)
                    </div>
                    <div className={`grid ${enableWholesale ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-0.5">Purchase</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.purchasePrice}
                          onChange={(e) => updateVariant(idx, 'purchasePrice', e.target.value)}
                          placeholder="800"
                          className="w-full bg-white border border-[#cbcbcb] rounded-[4px] px-2 py-1 text-xs text-right font-semibold text-slate-700 focus:border-[#6d8196] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-emerald-800 uppercase block mb-0.5">Retail Selling *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.sellingPrice}
                          onChange={(e) => updateVariant(idx, 'sellingPrice', e.target.value)}
                          placeholder="950"
                          className="w-full bg-white border border-[#cbcbcb] rounded-[4px] px-2 py-1 text-xs text-right font-black text-emerald-800 focus:border-[#6d8196] focus:outline-none"
                        />
                      </div>
                      {enableWholesale && (
                        <div>
                          <label className="text-[9px] font-bold text-amber-800 uppercase block mb-0.5">Wholesale</label>
                          <input
                            type="number"
                            step="0.01"
                            value={row.wholesalePrice}
                            onChange={(e) => updateVariant(idx, 'wholesalePrice', e.target.value)}
                            placeholder="880"
                            className="w-full bg-white border border-[#cbcbcb] rounded-[4px] px-2 py-1 text-xs text-right font-extrabold text-amber-700 focus:border-[#6d8196] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantity & Alert */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        value={row.stockQuantity}
                        onChange={(e) => updateVariant(idx, 'stockQuantity', e.target.value)}
                        placeholder="100"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 focus:bg-white focus:border-[#6d8196] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Low Stock Alert
                      </label>
                      <input
                        type="number"
                        value={row.minStockAlert}
                        onChange={(e) => updateVariant(idx, 'minStockAlert', e.target.value)}
                        placeholder="10"
                        className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[4px] px-2.5 py-1.5 text-xs text-center text-slate-600 focus:bg-white focus:border-[#6d8196] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
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
            <Save className="w-4 h-4" /> {loading ? 'Saving Product...' : 'Save Product & All Variants'}
          </button>
        </div>
      </form>

      {/* DYNAMIC CATEGORY CREATION MODAL */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddCategoryModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h4 className="text-xs font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#6d8196]" /> Create New Category
              </h4>
              <button type="button" onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
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
                  placeholder="e.g. Wires & Cables"
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
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddBrandModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h4 className="text-xs font-bold text-[#4a4a4a] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#6d8196]" /> Create New Brand
              </h4>
              <button type="button" onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-slate-700">
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
                  placeholder="e.g. Finolex, Havells"
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
