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
import Link from 'next/link';
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
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [stockFilter, setStockFilter] = useState(initialFilter === 'low-stock' ? 'LOW_STOCK' : 'ALL');
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

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedRack, stockFilter]);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesBrand = !selectedBrand || p.brandId === selectedBrand || p.brand?.id === selectedBrand;
    const matchesRack = !selectedRack || p.rackId === selectedRack || p.rack?.id === selectedRack;

    let matchesStock = true;
    if (stockFilter === 'LOW_STOCK') {
      matchesStock = p.stockQuantity <= p.minStockAlert;
    } else if (stockFilter === 'OUT_OF_STOCK') {
      matchesStock = p.stockQuantity <= 0;
    } else if (stockFilter === 'IN_STOCK') {
      matchesStock = p.stockQuantity > 0;
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesRack && matchesStock;
  });

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand || selectedRack || stockFilter !== 'ALL';

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Consolidated Material Inventory Catalog Card */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm flex flex-col h-full overflow-hidden">
        {/* Compact Table Header Banner */}
        <div className="px-3.5 py-2.5 border-b border-[#cbcbcb] bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#6d8196]" />
            <h1 className="text-xs font-black uppercase tracking-wider text-[#4a4a4a] whitespace-nowrap">
              Material Catalog
            </h1>
            <span className="text-[10px] font-bold text-[#6d8196] bg-[#6d8196]/10 px-2 py-0.5 rounded-full border border-[#6d8196]/20">
              {filteredProducts.length} items
            </span>
          </div>

          <Link
            href="/products/new"
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3 py-1 rounded-[5px] flex items-center gap-1 text-xs transition-all shadow-sm border border-[#cbcbcb]/40 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Link>
        </div>

        {/* Integrated ERP Table with Sticky Header & Inline Column Filters */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <table className="erp-table">
            <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
              {/* Column Title Row */}
              <tr className="bg-slate-200/90 text-slate-800 text-xs font-bold border-b border-[#cbcbcb]">
                <th className="text-left w-1/3">Product Details</th>
                <th className="text-left">Category / Brand</th>
                <th className="text-center">Rack Location</th>
                <th className="text-center">Stock Qty</th>
                {userRole === 'ADMIN' && <th className="text-right">Purchase Cost</th>}
                <th className="text-right">Selling Price</th>
                <th className="text-right">Wholesale Rate</th>
                <th className="text-right">Actions</th>
              </tr>

              {/* Dedicated Inline Column Filter Sub-Header Row */}
              <tr className="bg-slate-100 border-b border-[#cbcbcb]">
                {/* Product Details Inline Filter */}
                <th className="p-1.5 text-left font-normal">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter name, SKU, barcode..."
                      className="w-full bg-white border border-[#cbcbcb] rounded-[4px] pl-7 pr-2 py-1 text-[11px] font-normal text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>
                </th>

                {/* Category & Brand Inline Filters */}
                <th className="p-1.5 text-left font-normal">
                  <div className="grid grid-cols-2 gap-1">
                    <MaterialSelect
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                    <MaterialSelect
                      value={selectedBrand}
                      onChange={setSelectedBrand}
                      options={[
                        { value: '', label: 'All Brands' },
                        ...brands.map((b) => ({ value: b.id, label: b.name })),
                      ]}
                    />
                  </div>
                </th>

                {/* Rack Location Inline Filter */}
                <th className="p-1.5 text-center font-normal">
                  <MaterialSelect
                    value={selectedRack}
                    onChange={setSelectedRack}
                    options={[
                      { value: '', label: 'All Racks' },
                      ...racks.map((r) => ({ value: r.id, label: `${r.rackName} (${r.shelfCode})` })),
                    ]}
                  />
                </th>

                {/* Stock Qty Inline Filter */}
                <th className="p-1.5 text-center font-normal">
                  <MaterialSelect
                    value={stockFilter}
                    onChange={setStockFilter}
                    options={[
                      { value: 'ALL', label: 'All Stock' },
                      { value: 'LOW_STOCK', label: '⚠️ Low Stock' },
                      { value: 'IN_STOCK', label: '✅ In Stock' },
                      { value: 'OUT_OF_STOCK', label: '❌ Out of Stock' },
                    ]}
                  />
                </th>

                {userRole === 'ADMIN' && <th className="p-1.5 text-right font-normal"></th>}
                <th className="p-1.5 text-right font-normal"></th>
                <th className="p-1.5 text-right font-normal"></th>

                {/* Reset / Actions Inline */}
                <th className="p-1.5 text-right font-normal">
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                        setSelectedBrand('');
                        setSelectedRack('');
                        setStockFilter('ALL');
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-[4px] hover:bg-rose-100 transition-colors whitespace-nowrap"
                      title="Clear All Filters"
                    >
                      Clear Filters
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td className="text-left">
                        <div>
                          <div className="font-bold text-[#4a4a4a] text-xs flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-[3px] bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                              GST {p.gstPercent || 18}%
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            {p.sku && <span className="text-slate-400">SKU: {p.sku}</span>}
                            {p.barcode && <span className="text-slate-400">EAN: {p.barcode}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-left">
                        <div className="font-semibold text-[#4a4a4a] text-xs">{p.category?.name || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-500">{p.brand?.name || 'Generic'}</div>
                      </td>
                      <td className="text-center">
                        <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-[#6d8196]/10 text-[#6d8196] border border-[#6d8196]/20 inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {p.rack ? `${p.rack.rackName} (${p.rack.shelfCode})` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`font-bold text-xs ${
                            isLow ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      {userRole === 'ADMIN' && (
                        <td className="text-right font-mono text-slate-600 font-medium">₹{p.purchasePrice.toLocaleString('en-IN')}</td>
                      )}
                      <td className="text-right font-mono font-bold text-[#4a4a4a]">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="text-right font-mono font-bold text-amber-700">
                        {p.wholesalePrice ? `₹${p.wholesalePrice.toLocaleString('en-IN')}` : 'N/A'}
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
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium text-xs">
                    No matching products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2 border-t border-[#cbcbcb] bg-slate-50 flex items-center justify-between text-xs shrink-0 font-medium text-[#4a4a4a]">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-bold text-[#6d8196]">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-bold text-[#6d8196]">{endIndex}</span> of{' '}
              <span className="font-bold text-[#4a4a4a]">{totalItems.toLocaleString('en-IN')}</span> products
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-500 font-medium">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#cbcbcb] rounded-[4px] px-2 py-0.5 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196] font-bold"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              className="px-2 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-[11px] font-bold"
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="px-2.5 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-[11px] font-bold"
            >
              Prev
            </button>

            <span className="px-3 py-1 font-bold text-xs text-[#6d8196] bg-[#6d8196]/10 rounded-[4px] border border-[#6d8196]/20">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-[11px] font-bold"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              className="px-2 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-[11px] font-bold"
              title="Last Page"
            >
              »
            </button>
          </div>
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
