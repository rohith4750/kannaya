'use client';

import React, { useState, useEffect } from 'react';
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

export default function ProductsPage() {
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
      const [pRes, cRes, bRes, rRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/racks'),
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();
      const bData = await bRes.json();
      const rData = await rRes.json();

      if (Array.isArray(pData)) setProducts(pData);
      if (Array.isArray(cData)) setCategories(cData);
      if (Array.isArray(bData)) setBrands(bData);
      if (Array.isArray(rData)) setRacks(rData);
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

  // Dynamic Category Creation
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

  // Dynamic Brand Creation
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

  // Submit New Product
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

  // Submit Update Stock / Price
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

  // Delete product
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

  // Filtered List
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" /> Inventory & Product Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage stock quantities, GST rates, wholesale pricing, barcodes, and rack locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'ADMIN' && (
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-amber-500/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by product name, barcode, brand..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              filterLowStock
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product & Barcode</th>
                <th className="py-3.5 px-4">Brand / Category</th>
                <th className="py-3.5 px-4">Rack Location</th>
                <th className="py-3.5 px-4">Stock Qty</th>
                {userRole === 'ADMIN' && <th className="py-3.5 px-4">Purchase Cost</th>}
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Wholesale Rate</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400/90">{p.barcode}</span>
                          <span className="text-slate-500">| GST: {p.gstPercent || 18}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{p.brand?.name || 'Generic'}</div>
                        <div className="text-[10px] text-slate-400">{p.category?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {p.rack ? `${p.rack.rackName} (${p.rack.shelfCode})` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-sm ${
                            isLow ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      {userRole === 'ADMIN' && (
                        <td className="py-3.5 px-4 font-mono text-slate-400">₹{p.purchasePrice}</td>
                      )}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">₹{p.sellingPrice}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {p.wholesalePrice ? `₹${p.wholesalePrice}` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
                            title="Edit Stock & Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
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
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-amber-400" /> Create New Category
              </h4>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Solar Panels, Modular Switches"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-xl">
                Add Category Dynamically
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC BRAND CREATION MODAL */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" /> Create New Brand
              </h4>
              <button onClick={() => setShowAddBrandModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Brand Name</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Schneider, Anchor, Polycab"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-xl">
                Add Brand Dynamically
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL (WITH DYNAMIC CATEGORY & BRAND BUTTONS) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Add New Electrical Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polycab 1.5 Sqmm FR Wire (Red)"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Dynamic Category & Brand selectors with + Add Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 uppercase text-[10px] font-semibold">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-amber-400 hover:underline text-[10px] font-bold"
                    >
                      + Add New
                    </button>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 uppercase text-[10px] font-semibold">Brand</label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(true)}
                      className="text-amber-400 hover:underline text-[10px] font-bold"
                    >
                      + Add New
                    </button>
                  </div>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="8544"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">GST Rate (%)</label>
                  <select
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="28">28%</option>
                    <option value="0">0% (Exempt)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="pcs">pcs</option>
                    <option value="meter">meter</option>
                    <option value="box">box</option>
                    <option value="roll">roll</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                    placeholder="Contractor rate"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Initial Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-semibold">Rack Location</label>
                  <select
                    value={formData.rackId}
                    onChange={(e) => setFormData({ ...formData, rackId: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rackName} ({r.shelfCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
