'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
  Layers,
  Tag,
  Barcode,
  X,
  CheckCircle,
  FolderPlus,
  ShieldAlert,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import MaterialSelect from '@/components/MaterialSelect';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(initialFilter === 'low-stock');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);

  // Quick Category & Brand Form States
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

  const loadData = async () => {
    try {
      const [pRes, cRes, bRes, rRes, sRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/racks'),
        fetch('/api/settings'),
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();
      const bData = await bRes.json();
      const rData = await rRes.json();
      const sData = await sRes.json();

      if (Array.isArray(pData)) setProducts(pData);
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
    loadData();
    const checkRole = () => {
      const role = (localStorage.getItem('kannaya_user_role') as any) || 'ADMIN';
      setUserRole(role);
    };
    checkRole();
    window.addEventListener('role_changed', checkRole);
    return () => window.removeEventListener('role_changed', checkRole);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Failed to add product: ${e.message}`);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editProduct.id,
          stockQuantity: editProduct.stockQuantity,
          sellingPrice: editProduct.sellingPrice,
          purchasePrice: editProduct.purchasePrice,
          wholesalePrice: editProduct.wholesalePrice,
          minStockAlert: editProduct.minStockAlert,
          rackId: editProduct.rackId,
        }),
      });
      if (res.ok) {
        setEditProduct(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') {
      alert('Permission Denied: Only Store Owner / Admin can delete catalog products.');
      return;
    }
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.name.toLowerCase().includes(q));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesLowStock = !filterLowStock || p.stockQuantity <= p.minStockAlert;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Consolidated Material Inventory Catalog Card */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm flex flex-col h-full overflow-hidden">
        {/* Unified Table Top Header */}
        <div className="p-3.5 border-b border-[#cbcbcb] bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#6d8196]" />
            <div>
              <h1 className="text-base font-bold text-[#4a4a4a]">Material Inventory Catalog</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Manage stock quantities, GST rates, wholesale pricing, barcodes, and rack locations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  categoryId: categories[0]?.id || '',
                  brandId: brands[0]?.id || '',
                  rackId: racks[0]?.id || '',
                });
                setShowAddModal(true);
              }}
              className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold px-3 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        </div>

        {/* Unified Compact Filter Toolbar */}
        <div className="px-3.5 py-2 border-b border-[#cbcbcb] bg-white flex flex-col md:flex-row gap-2.5 items-center justify-between shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by product name, barcode, brand..."
              className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <MaterialSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: '', label: `All Categories (${categories.length})` },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-48"
            />

            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1 rounded-[5px] text-xs font-semibold flex items-center gap-1 border transition-all ${
                filterLowStock
                  ? 'bg-rose-100 text-rose-700 border-rose-300 font-bold'
                  : 'bg-slate-50 text-[#4a4a4a] border-[#cbcbcb] hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
            </button>
          </div>
        </div>

        {/* Integrated ERP Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category / Brand</th>
                <th>Rack Location</th>
                <th>Stock Qty</th>
                {userRole === 'ADMIN' && <th>Purchase Cost</th>}
                <th>Selling Price</th>
                <th>Wholesale Rate</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <div className="font-bold text-[#4a4a4a] text-xs flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-[3px] bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                              GST {p.gstPercent || 18}%
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            {p.sku && <span className="text-slate-400">SKU: {p.sku}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-[#4a4a4a] text-xs">{p.category?.name || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-500">{p.brand?.name || 'Generic'}</div>
                      </td>
                      <td>
                        <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {p.rack ? `${p.rack.rackName} (${p.rack.shelfCode})` : 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`font-semibold text-xs ${
                            isLow ? 'text-rose-600 font-bold animate-pulse' : 'text-emerald-700'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      {userRole === 'ADMIN' && (
                        <td className="font-mono text-slate-600 font-medium">₹{p.purchasePrice}</td>
                      )}
                      <td className="font-mono font-semibold text-[#4a4a4a]">₹{p.sellingPrice}</td>
                      <td className="font-mono font-semibold text-amber-700">
                        {p.wholesalePrice ? `₹${p.wholesalePrice}` : 'N/A'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-1 rounded-[5px] bg-slate-100 hover:bg-amber-100 text-[#4a4a4a] hover:text-amber-700 transition-colors border border-[#cbcbcb]"
                            title="Edit Stock & Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1 rounded-[5px] bg-slate-100 hover:bg-rose-100 text-[#4a4a4a] hover:text-rose-700 transition-colors border border-[#cbcbcb]"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC CATEGORY CREATION MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-600" /> Create New Category
              </h4>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Solar Panels, Modular Switches"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
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
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" /> Create New Brand
              </h4>
              <button onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Brand Name</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Schneider, Anchor, Polycab"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>
              <button type="submit" className="w-full bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px]">
                Add Brand Dynamically
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-lg w-full p-5 space-y-3 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> Add New Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polycab 1.5 Sqmm FR Wire (Red)"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 uppercase text-[10px] font-bold">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-amber-700 hover:underline text-[10px] font-bold"
                    >
                      + Add New
                    </button>
                  </div>
                  <MaterialSelect
                    value={formData.categoryId}
                    onChange={(val) => setFormData({ ...formData, categoryId: val })}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 uppercase text-[10px] font-bold">Brand</label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(true)}
                      className="text-amber-700 hover:underline text-[10px] font-bold"
                    >
                      + Add New
                    </button>
                  </div>
                  <MaterialSelect
                    value={formData.brandId}
                    onChange={(val) => setFormData({ ...formData, brandId: val })}
                    options={brands.map((b) => ({ value: b.id, label: b.name }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="8544"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 font-mono focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <MaterialSelect
                    label="GST Rate (%)"
                    value={formData.gstPercent}
                    onChange={(val) => setFormData({ ...formData, gstPercent: val })}
                    options={[
                      { value: '18', label: '18%' },
                      { value: '12', label: '12%' },
                      { value: '5', label: '5%' },
                      { value: '28', label: '28%' },
                      { value: '0', label: '0% (Exempt)' },
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
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-emerald-700 font-bold focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                    placeholder="Contractor rate"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-amber-700 font-bold focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Initial Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Rack Location</label>
                  <MaterialSelect
                    value={formData.rackId}
                    onChange={(val) => setFormData({ ...formData, rackId: val })}
                    options={racks.map((r) => ({ value: r.id, label: `${r.rackName} (${r.shelfCode})` }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px] text-xs shadow-sm"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" /> Edit Product: {editProduct.name}
              </h3>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Stock Quantity ({editProduct.unit})</label>
                <input
                  type="number"
                  value={editProduct.stockQuantity}
                  onChange={(e) => setEditProduct({ ...editProduct, stockQuantity: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.sellingPrice}
                    onChange={(e) => setEditProduct({ ...editProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.wholesalePrice || ''}
                    onChange={(e) => setEditProduct({ ...editProduct, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-amber-700 font-bold"
                  />
                </div>
              </div>

              {userRole === 'ADMIN' && (
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.purchasePrice}
                    onChange={(e) => setEditProduct({ ...editProduct, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-[5px] px-3 py-1.5 text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Rack Location</label>
                <MaterialSelect
                  value={editProduct.rackId || ''}
                  onChange={(val) => setEditProduct({ ...editProduct, rackId: val })}
                  options={racks.map((r) => ({ value: r.id, label: `${r.rackName} (${r.shelfCode})` }))}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold py-2 rounded-[5px] text-xs shadow-sm"
              >
                Update Product Stock & Price
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
          <Package className="w-4 h-4 animate-spin text-[#6d8196]" /> Loading inventory products catalog...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
