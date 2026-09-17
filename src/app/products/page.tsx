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
  ChevronDown,
  ChevronRight,
  FolderPlus,
  DollarSign,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MaterialSelect from '@/components/MaterialSelect';
import ConfirmModal from '@/components/ConfirmModal';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [racks, setRacks] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [stockFilter, setStockFilter] = useState(initialFilter === 'low-stock' ? 'LOW_STOCK' : 'ALL');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [enableWholesale, setEnableWholesale] = useState(false);

  // Expanded Product IDs map
  const [expandedProducts, setExpandedProducts] = useState<{ [id: string]: boolean }>({});

  // Quick edit modal
  const [editVariant, setEditVariant] = useState<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

      if (sData && sData.enableWholesale !== undefined) {
        setEnableWholesale(!!sData.enableWholesale);
      }

      if (Array.isArray(pData)) {
        setProducts(pData);
        // Expand all by default for easy viewing
        const expMap: { [id: string]: boolean } = {};
        pData.forEach((p) => (expMap[p.id] = true));
        setExpandedProducts(expMap);
      }
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

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVariant) return;
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editVariant.productId,
          variants: [
            {
              id: editVariant.id,
              variantName: editVariant.variantName,
              barcode: editVariant.barcode,
              hsnCode: editVariant.hsnCode || null,
              stockQuantity: editVariant.stockQuantity,
              sellingPrice: editVariant.sellingPrice,
              purchasePrice: editVariant.purchasePrice,
              wholesalePrice: editVariant.wholesalePrice,
              minStockAlert: editVariant.minStockAlert,
              rackId: editVariant.rackId,
            },
          ],
        }),
      });
      if (res.ok) {
        setEditVariant(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Confirmation Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteProduct = (id: string) => {
    if (userRole !== 'ADMIN') {
      setConfirmModalState({
        isOpen: true,
        title: 'Permission Denied',
        message: 'Only Store Owner / Admin can delete catalog products from the inventory.',
        confirmText: 'OK',
        confirmVariant: 'warning',
        onConfirm: () => setConfirmModalState((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: 'Delete Product & Variants',
      message: 'Are you sure you want to delete this product and all its variants from inventory? This action cannot be undone.',
      confirmText: 'Yes, Delete Product',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
          loadData();
        } catch (e) {
          console.error('Error deleting product:', e);
        }
      },
    });
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
      (p.variants && p.variants.some((v: any) => v.barcode?.toLowerCase().includes(q) || v.variantName?.toLowerCase().includes(q)));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesBrand = !selectedBrand || p.brandId === selectedBrand || p.brand?.id === selectedBrand;
    const matchesRack = !selectedRack || (p.variants && p.variants.some((v: any) => v.rackId === selectedRack));

    let matchesStock = true;
    if (stockFilter === 'LOW_STOCK') {
      matchesStock = p.variants?.some((v: any) => v.stockQuantity <= v.minStockAlert);
    } else if (stockFilter === 'OUT_OF_STOCK') {
      matchesStock = p.variants?.some((v: any) => v.stockQuantity <= 0);
    } else if (stockFilter === 'IN_STOCK') {
      matchesStock = p.variants?.some((v: any) => v.stockQuantity > 0);
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesRack && matchesStock;
  });

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand || selectedRack || stockFilter !== 'ALL';

  // Total Stock Value Calculation across all variants
  const totalSellingStockValue = filteredProducts.reduce((sum, p) => {
    const pTotal = (p.variants || []).reduce((vSum: number, v: any) => vSum + ((v.stockQuantity || 0) * (v.sellingPrice || 0)), 0);
    return sum + pTotal;
  }, 0);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm flex flex-col h-full overflow-hidden">
        {/* Table Header Banner */}
        <div className="px-3.5 py-2.5 border-b border-[#cbcbcb] bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#6d8196]" />
              <h1 className="text-xs font-black uppercase tracking-wider text-[#4a4a4a] whitespace-nowrap">
                Products & Variants Catalog
              </h1>
              <span className="text-[10px] font-bold text-[#6d8196] bg-[#6d8196]/10 px-2 py-0.5 rounded-full border border-[#6d8196]/20">
                {filteredProducts.length} Products
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 rounded-[5px] flex items-center gap-2 text-xs font-extrabold shadow-2xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              <span>Total Inventory Value: <span className="font-mono text-emerald-800 text-sm font-black">₹{totalSellingStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></span>
            </div>
          </div>

          <Link
            href="/products/new"
            className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold px-3 py-1.5 rounded-[5px] flex items-center gap-1.5 text-xs transition-all shadow-sm border border-[#cbcbcb]/40 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product & Variants
          </Link>
        </div>

        {/* ERP Table */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <table className="erp-table">
            <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
              <tr className="bg-slate-200/90 text-slate-800 text-xs font-bold border-b border-[#cbcbcb]">
                <th className="text-left w-1/4">Product Name & HSN</th>
                <th className="text-left">Category</th>
                <th className="text-left">Brand</th>
                <th className="text-center">Variants Count</th>
                <th className="text-center">Total Stock</th>
                <th className="text-right">Price Range</th>
                <th className="text-right">Actions</th>
              </tr>

              {/* Inline Column Filter Header */}
              <tr className="bg-slate-100 border-b border-[#cbcbcb]">
                <th className="p-1.5 text-left font-normal">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter product, variant barcode..."
                      className="w-full bg-white border border-[#cbcbcb] rounded-[4px] pl-7 pr-2 py-1 text-[11px] font-normal text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
                    />
                  </div>
                </th>

                <th className="p-1.5 text-left font-normal">
                  <MaterialSelect
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={[
                      { value: '', label: 'All Categories' },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </th>

                <th className="p-1.5 text-left font-normal">
                  <MaterialSelect
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    options={[
                      { value: '', label: 'All Brands' },
                      ...brands.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </th>

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

                <th className="p-1.5 text-right font-normal"></th>

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
                  const isExpanded = !!expandedProducts[p.id];
                  const variantList = p.variants || [];
                  const totalStock = variantList.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);
                  const minPrice = variantList.length > 0 ? Math.min(...variantList.map((v: any) => v.sellingPrice)) : 0;
                  const maxPrice = variantList.length > 0 ? Math.max(...variantList.map((v: any) => v.sellingPrice)) : 0;
                  const hasLowStock = variantList.some((v: any) => v.stockQuantity <= v.minStockAlert);

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="bg-white border-b border-[#cbcbcb] hover:bg-slate-50 transition-colors">
                        <td className="text-left font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(p.id)}
                              className="p-1 hover:bg-slate-200 rounded-[3px] text-slate-600"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div>
                              <div className="font-bold text-[#4a4a4a] text-xs flex items-center gap-2">
                                <span>{p.name}</span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-[3px] bg-slate-200 text-slate-700 border border-[#cbcbcb]">
                                  HSN: {p.hsnCode || '8544'} (GST {p.gstPercent || 18}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="text-left">
                          <span className="font-semibold text-[#4a4a4a] text-xs">{p.category?.name || 'Unassigned'}</span>
                        </td>

                        <td className="text-left">
                          <span className="font-semibold text-slate-600 text-xs">{p.brand?.name || 'Generic'}</span>
                        </td>

                        <td className="text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                            {variantList.length} Variants
                          </span>
                        </td>

                        <td className="text-center">
                          <span className={`font-bold text-xs ${hasLowStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {totalStock} {p.unit}
                          </span>
                        </td>

                        <td className="text-right font-mono font-bold text-[#4a4a4a]">
                          {minPrice === maxPrice ? `₹${minPrice.toLocaleString('en-IN')}` : `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`}
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 rounded-[5px] bg-slate-100 hover:bg-rose-100 text-[#4a4a4a] hover:text-rose-700 transition-colors border border-[#cbcbcb]"
                                title="Delete Product & Variants"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Dedicated Variant Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-100/60 border-b border-[#cbcbcb]">
                          <td colSpan={7} className="p-3 pl-8">
                            <div className="bg-white border border-[#cbcbcb] rounded-[6px] p-3 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase text-[#4a4a4a]">Variants for {p.name}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 border border-[#cbcbcb]">
                                    Product HSN: {p.hsnCode || '8544'} (GST {p.gstPercent || 18}%)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold">{variantList.length} total variants</span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-[#4a4a4a] text-[10px] font-extrabold uppercase tracking-wider border-b border-[#cbcbcb]">
                                      <th className="p-2">Variant Name</th>
                                      <th className="p-2">Barcode</th>
                                      <th className="p-2">Variant HSN</th>
                                      <th className="p-2">Rack Location</th>
                                      {userRole === 'ADMIN' && <th className="p-2 text-right">Cost Price</th>}
                                      <th className="p-2 text-right">Retail Price</th>
                                      {enableWholesale && <th className="p-2 text-right">Wholesale</th>}
                                      <th className="p-2 text-center">Stock</th>
                                      <th className="p-2 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variantList.map((v: any) => {
                                      const isLow = v.stockQuantity <= v.minStockAlert;
                                      return (
                                        <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs">
                                          <td className="p-2 font-bold text-slate-800">{v.variantName}</td>
                                          <td className="p-2 font-mono text-slate-500 text-[11px]">{v.barcode}</td>
                                          <td className="p-2 font-mono text-[11px]">
                                            {v.hsnCode ? (
                                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                {v.hsnCode}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 font-normal">Parent ({p.hsnCode || '8544'})</span>
                                            )}
                                          </td>
                                          <td className="p-2">
                                            {v.rack ? (
                                              <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 font-medium">
                                                <Layers className="w-2.5 h-2.5 text-slate-500" />
                                                {v.rack.rackName} ({v.rack.shelfCode})
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 text-[10px]">Unassigned</span>
                                            )}
                                          </td>
                                          {userRole === 'ADMIN' && (
                                            <td className="p-2 text-right font-mono font-semibold text-slate-600">
                                              ₹{v.purchasePrice}
                                            </td>
                                          )}
                                          <td className="p-2 text-right font-mono font-black text-emerald-800">
                                            ₹{v.sellingPrice.toLocaleString('en-IN')}
                                          </td>
                                          {enableWholesale && (
                                            <td className="p-2 text-right font-mono font-bold text-amber-700">
                                              {v.wholesalePrice ? `₹${v.wholesalePrice}` : '-'}
                                            </td>
                                          )}
                                          <td className="p-2 text-center font-bold">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${isLow ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                                              {v.stockQuantity} {p.unit}
                                            </span>
                                          </td>
                                          <td className="p-2 text-right">
                                            <button
                                              onClick={() => setEditVariant({ ...v, productId: p.id })}
                                              className="px-2 py-1 rounded-[4px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[11px] inline-flex items-center gap-1 transition-colors"
                                              title="Edit Variant"
                                            >
                                              <Edit2 className="w-3 h-3" /> Edit
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium text-xs">
                    No matching products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2 border-t border-[#cbcbcb] bg-slate-50 flex items-center justify-between text-xs shrink-0 font-medium text-[#4a4a4a]">
          <div>
            Showing <span className="font-bold text-[#6d8196]">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-bold text-[#6d8196]">{endIndex}</span> of{' '}
            <span className="font-bold text-[#4a4a4a]">{totalItems.toLocaleString('en-IN')}</span> products
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              className="px-2 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 text-[11px] font-bold"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="px-2.5 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 text-[11px] font-bold"
            >
              Prev
            </button>

            <span className="px-3 py-1 font-bold text-xs text-[#6d8196] bg-[#6d8196]/10 rounded-[4px] border border-[#6d8196]/20">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 text-[11px] font-bold"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              className="px-2 py-1 rounded-[4px] border border-[#cbcbcb] bg-white hover:bg-slate-100 disabled:opacity-40 text-[11px] font-bold"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* QUICK VARIANT EDIT MODAL */}
      {editVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-amber-600" /> Edit Variant: {editVariant.variantName}
              </h3>
              <button onClick={() => setEditVariant(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateVariant} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 uppercase text-[10px] font-bold">Variant Name</label>
                <input
                  type="text"
                  required
                  value={editVariant.variantName}
                  onChange={(e) => setEditVariant({ ...editVariant, variantName: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Barcode</label>
                  <input
                    type="text"
                    value={editVariant.barcode}
                    onChange={(e) => setEditVariant({ ...editVariant, barcode: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Variant HSN Code (Override)</label>
                  <input
                    type="text"
                    value={editVariant.hsnCode || ''}
                    onChange={(e) => setEditVariant({ ...editVariant, hsnCode: e.target.value })}
                    placeholder="Leave empty for Product HSN"
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editVariant.stockQuantity}
                    onChange={(e) => setEditVariant({ ...editVariant, stockQuantity: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Low Stock Alert Qty</label>
                  <input
                    type="number"
                    value={editVariant.minStockAlert}
                    onChange={(e) => setEditVariant({ ...editVariant, minStockAlert: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div className={`grid ${enableWholesale ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Purchase (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editVariant.purchasePrice}
                    onChange={(e) => setEditVariant({ ...editVariant, purchasePrice: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 uppercase text-[10px] font-bold">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editVariant.sellingPrice}
                    onChange={(e) => setEditVariant({ ...editVariant, sellingPrice: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-emerald-800 font-bold"
                  />
                </div>
                {enableWholesale && (
                  <div>
                    <label className="text-slate-700 uppercase text-[10px] font-bold">Wholesale (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editVariant.wholesalePrice || ''}
                      onChange={(e) => setEditVariant({ ...editVariant, wholesalePrice: e.target.value })}
                      className="w-full mt-1 bg-slate-50 border border-[#cbcbcb] rounded-[5px] px-3 py-1.5 text-amber-700 font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#cbcbcb]">
                <button
                  type="button"
                  onClick={() => setEditVariant(null)}
                  className="px-3 py-1.5 rounded-[4px] border border-[#cbcbcb] text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[4px] bg-[#6d8196] hover:bg-[#5b6f84] text-white font-bold shadow-sm"
                >
                  Update Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        confirmVariant={confirmModalState.confirmVariant}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs font-semibold text-slate-500">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
