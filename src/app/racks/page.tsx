'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Search, Package, Plus, MapPin, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RacksPage() {
  const [racks, setRacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRackModal, setShowAddRackModal] = useState(false);

  const [rackNameInput, setRackNameInput] = useState('Rack A');
  const [shelfCodeInput, setShelfCodeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  const loadRacks = async () => {
    try {
      const res = await fetch('/api/racks');
      const data = await res.json();
      if (Array.isArray(data)) setRacks(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRacks();
  }, []);

  const handleAddRack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/racks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rackName: rackNameInput,
          shelfCode: shelfCodeInput,
          description: descriptionInput,
        }),
      });
      if (res.ok) {
        setShowAddRackModal(false);
        setShelfCodeInput('');
        setDescriptionInput('');
        loadRacks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group racks by Rack Name (Rack A, Rack B, Rack C, Rack D)
  const groupedRacks = racks.reduce((acc: any, rack: any) => {
    const key = rack.rackName || 'Other Racks';
    if (!acc[key]) acc[key] = [];
    acc[key].push(rack);
    return acc;
  }, {});

  const filteredRacks = Object.keys(groupedRacks).reduce((acc: any, key: string) => {
    const matching = groupedRacks[key].filter((r: any) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        r.shelfCode.toLowerCase().includes(q) ||
        r.rackName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.products.some((p: any) => p.name.toLowerCase().includes(q))
      );
    });
    if (matching.length > 0) acc[key] = matching;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" /> Rack-wise Product Location Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual shop layout map showing exact shelf slots (A1, A2, B1...) for instant product retrieval & stock audits.
          </p>
        </div>
        <button
          onClick={() => setShowAddRackModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-amber-500/10 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Shelf Slot
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shelf code (e.g. A1, B2) or product stored in rack..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          Total Shelves: <span className="font-bold text-white">{racks.length}</span>
        </div>
      </div>

      {/* Shop Layout Racks Grid */}
      <div className="space-y-8">
        {Object.keys(filteredRacks).map((rackName) => (
          <div key={rackName} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-lg font-black text-white">{rackName} Section</h2>
              <span className="text-xs text-slate-400">({filteredRacks[rackName].length} Shelves)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRacks[rackName].map((shelf: any) => {
                const totalStockInShelf = shelf.products.reduce(
                  (sum: number, p: any) => sum + p.stockQuantity,
                  0
                );

                return (
                  <div
                    key={shelf.id}
                    className="glass-panel p-5 rounded-2xl glass-panel-hover border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      {/* Shelf Badge Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Slot {shelf.shelfCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {shelf.products.length} Items
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-3 italic">{shelf.description || 'General shelf storage'}</p>

                      {/* Products Stored in Shelf */}
                      <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/80">
                        {shelf.products.length > 0 ? (
                          shelf.products.map((p: any) => (
                            <div
                              key={p.id}
                              className="bg-slate-950 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-200 block truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-400">{p.brand?.name}</span>
                              </div>
                              <span className="font-bold text-emerald-400 whitespace-nowrap">
                                {p.stockQuantity} {p.unit}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-slate-500 italic text-center py-2">
                            Empty shelf slot (No products assigned)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Stock</span>
                      <span className="font-bold text-white">{totalStockInShelf} units</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ADD SHELF MODAL */}
      {showAddRackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Add New Rack Shelf Slot
            </h3>

            <form onSubmit={handleAddRack} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Rack Section Name</label>
                <input
                  type="text"
                  required
                  value={rackNameInput}
                  onChange={(e) => setRackNameInput(e.target.value)}
                  placeholder="e.g. Rack A, Rack B, Pipe Stand"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Shelf Slot Code</label>
                <input
                  type="text"
                  required
                  value={shelfCodeInput}
                  onChange={(e) => setShelfCodeInput(e.target.value)}
                  placeholder="e.g. A5, B5, C3"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-semibold">Description</label>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="e.g. Modular 32A Switches & Gang Boxes"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRackModal(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold"
                >
                  Save Shelf Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
