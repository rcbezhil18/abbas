"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs } from "@/lib/utils";
import { OutsourceItem } from "@/types";
import { Truck, Plus, Search, Edit3, Trash2 } from "lucide-react";

export default function OutsourcePage() {
  const { outsource, saveOutsource, deleteOutsource } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutsourceItem | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: OutsourceItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete outsourced item "${name}"?`)) return;
    try {
      await deleteOutsource(id);
      toast(`Removed "${name}"`, "info");
    } catch (e) {
      toast("Delete failed", "error");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingItem?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const cost = Number(formData.get("cost")) || 0;
    const sell = Number(formData.get("sell")) || 0;

    const item: OutsourceItem = {
      id,
      item: formData.get("item") as string,
      vendor: formData.get("vendor") as string,
      cost,
      sell,
      profit: sell - cost,
      createdAt: editingItem?.createdAt || Date.now(),
    };

    try {
      await saveOutsource(item);
      setModalOpen(false);
      toast("Outsourced item saved", "success");
    } catch (e) {
      toast("Save failed", "error");
    }
  };

  const filtered = outsource.filter(
    (o) =>
      (o.item + (o.vendor || "")).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Outsource Items & Sourced Repairs" subtitle="Track outsourced items, vendor cost, retail sell price, and profit margins">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search outsourced item or vendor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Outsourced Item</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Item / Job</th>
                  <th className="py-3.5 px-4 font-semibold">Sourced Vendor</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Vendor Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Retail Sell Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Profit Margin</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((o) => {
                    const margin = o.sell - o.cost;
                    const pct = o.cost > 0 ? ((margin / o.cost) * 100).toFixed(1) : "—";
                    return (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">{o.item}</td>
                        <td className="py-3.5 px-4 text-slate-300">{o.vendor || "—"}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(o.cost)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(o.sell)}</td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {rs(margin)} {pct !== "—" && <span className="text-[10px] text-slate-400">({pct}%)</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(o)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(o.id, o.item)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No outsourced items logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Outsourced Item" : "Log Outsourced Item"}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Item / Job Name *</label>
            <input name="item" defaultValue={editingItem?.item} required placeholder="Display replacement / Sourced iPhone" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Sourced Vendor</label>
            <input name="vendor" defaultValue={editingItem?.vendor} placeholder="External supplier or repair shop" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vendor Cost Price (₹)</label>
              <input type="number" name="cost" defaultValue={editingItem?.cost} placeholder="0.00" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Retail Sell Price (₹)</label>
              <input type="number" name="sell" defaultValue={editingItem?.sell} placeholder="0.00" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white font-bold focus:outline-none focus:border-rose-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Save Item</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
