"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { MobileItem, AccessoryItem, SparePartItem, UsedPhoneItem } from "@/types";
import { 
  Smartphone, 
  Headphones, 
  Wrench, 
  RotateCcw, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Edit3, 
  Trash2, 
  Printer, 
  Share2 
} from "lucide-react";

type TabType = "mobiles" | "accessories" | "spareParts" | "usedPhones";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("mobiles");
  const [search, setSearch] = useState("");
  const { 
    mobiles, accessories, spareParts, usedPhones,
    saveMobile, deleteMobile,
    saveAccessory, deleteAccessory,
    saveSparePart, deleteSparePart,
    saveUsedPhone, deleteUsedPhone,
    suppliers
  } = useData();
  const { toast } = useToast();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Stock Adjustment Modal state
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjItem, setAdjItem] = useState<any>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("Count correction");

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;
    try {
      if (activeTab === "mobiles") await deleteMobile(id);
      else if (activeTab === "accessories") await deleteAccessory(id);
      else if (activeTab === "spareParts") await deleteSparePart(id);
      else if (activeTab === "usedPhones") await deleteUsedPhone(id);
      toast(`Removed "${name}" from stock`, "info");
    } catch (e) {
      toast("Failed to delete item", "error");
    }
  };

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingItem?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    try {
      if (activeTab === "mobiles") {
        const item: MobileItem = {
          id,
          brand: formData.get("brand") as string,
          model: formData.get("model") as string,
          variant: formData.get("variant") as string,
          color: formData.get("color") as string,
          imei: formData.get("imei") as string,
          batteryNo: formData.get("batteryNo") as string,
          cost: Number(formData.get("cost")) || 0,
          sell: Number(formData.get("sell")) || 0,
          qty: Number(formData.get("qty")) || 0,
          supplierName: formData.get("supplierName") as string,
          condition: formData.get("condition") as string || "Brand New",
        };
        await saveMobile(item);
      } else if (activeTab === "accessories") {
        const item: AccessoryItem = {
          id,
          name: formData.get("name") as string,
          category: formData.get("category") as string || "Tempered Glass",
          brandType: formData.get("brandType") as string || "Branded",
          hsn: formData.get("hsn") as string,
          cost: Number(formData.get("cost")) || 0,
          sell: Number(formData.get("sell")) || 0,
          qty: Number(formData.get("qty")) || 0,
          supplierName: formData.get("supplierName") as string,
        };
        await saveAccessory(item);
      } else if (activeTab === "spareParts") {
        const item: SparePartItem = {
          id,
          partName: formData.get("partName") as string,
          compatibleModel: formData.get("compatibleModel") as string,
          hsn: formData.get("hsn") as string,
          cost: Number(formData.get("cost")) || 0,
          sell: Number(formData.get("sell")) || 0,
          qty: Number(formData.get("qty")) || 0,
          supplierName: formData.get("supplierName") as string,
        };
        await saveSparePart(item);
      } else if (activeTab === "usedPhones") {
        const item: UsedPhoneItem = {
          id,
          brand: formData.get("brand") as string,
          model: formData.get("model") as string,
          imei: formData.get("imei") as string,
          condition: formData.get("condition") as string || "Used / Refurbished",
          batteryHealth: formData.get("batteryHealth") as string,
          cost: Number(formData.get("cost")) || 0,
          sell: Number(formData.get("sell")) || 0,
          qty: Number(formData.get("qty")) || 0,
          supplierName: formData.get("supplierName") as string,
        };
        await saveUsedPhone(item);
      }

      setModalOpen(false);
      toast("Stock saved successfully", "success");
    } catch (err) {
      toast("Error saving stock item", "error");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItem) return;
    const newQty = Number(adjQty);
    if (isNaN(newQty) || newQty < 0) {
      toast("Enter a valid quantity", "error");
      return;
    }

    try {
      const updated = { ...adjItem, qty: newQty };
      if (activeTab === "mobiles") await saveMobile(updated);
      else if (activeTab === "accessories") await saveAccessory(updated);
      else if (activeTab === "spareParts") await saveSparePart(updated);
      else if (activeTab === "usedPhones") await saveUsedPhone(updated);

      setAdjModalOpen(false);
      toast(`Adjusted quantity to ${newQty} (${adjReason})`, "success");
    } catch (e) {
      toast("Adjustment failed", "error");
    }
  };

  // Filtering
  const filteredMobiles = mobiles.filter(
    (m) =>
      (m.brand + m.model + (m.variant || "") + (m.imei || "") + (m.supplierName || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const filteredAcc = accessories.filter(
    (a) =>
      (a.name + a.category + (a.supplierName || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const filteredSpares = spareParts.filter(
    (s) =>
      (s.partName + s.compatibleModel + (s.supplierName || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const filteredUsed = usedPhones.filter(
    (u) =>
      (u.brand + u.model + (u.imei || "") + (u.supplierName || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Inventory Management" subtitle="4-Split stock tracking for Mobiles, Accessories, Spare Parts & Used Phones">
      <div className="space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-2 rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("mobiles")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "mobiles"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobiles ({mobiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("accessories")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "accessories"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Accessories ({accessories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("spareParts")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "spareParts"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Spare Parts ({spareParts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("usedPhones")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "usedPhones"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Used Phones ({usedPhones.length})</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add to {activeTab.replace(/([A-Z])/g, " $1")}</span>
          </button>
        </div>

        {/* Toolbar Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl glass-card text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Price List</span>
            </button>
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Item Details</th>
                  <th className="py-3.5 px-4 font-semibold">Specs / Category</th>
                  <th className="py-3.5 px-4 font-semibold">Supplier</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cost Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Sell Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Margin</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Stock (Qty)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {activeTab === "mobiles" && (
                  filteredMobiles.length ? (
                    filteredMobiles.map((item) => {
                      const margin = item.sell - item.cost;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.brand} {item.model}</div>
                            {item.imei && <div className="font-mono text-[11px] text-rose-400">IMEI: {item.imei}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {item.variant || "Standard"} {item.color ? `· ${item.color}` : ""}
                            {item.condition && <div className="text-[10px] text-slate-400">{item.condition}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.supplierName || "—"}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(item.cost)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(item.sell)}</td>
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {rs(margin)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              item.qty <= 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              item.qty <= 2 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {item.qty} pcs
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setAdjItem(item); setAdjQty(String(item.qty)); setAdjModalOpen(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                                title="Adjust Stock Quantity"
                              >
                                <SlidersHorizontal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="py-12 text-center text-slate-500">No mobile phones found in stock.</td></tr>
                  )
                )}

                {activeTab === "accessories" && (
                  filteredAcc.length ? (
                    filteredAcc.map((item) => {
                      const margin = item.sell - item.cost;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            {item.hsn && <div className="font-mono text-[11px] text-slate-400">HSN: {item.hsn}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {item.category} {item.brandType ? `· ${item.brandType}` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.supplierName || "—"}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(item.cost)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(item.sell)}</td>
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {rs(margin)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              item.qty <= 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              item.qty <= 2 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {item.qty} pcs
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setAdjItem(item); setAdjQty(String(item.qty)); setAdjModalOpen(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                              >
                                <SlidersHorizontal className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="py-12 text-center text-slate-500">No accessories found in stock.</td></tr>
                  )
                )}

                {activeTab === "spareParts" && (
                  filteredSpares.length ? (
                    filteredSpares.map((item) => {
                      const margin = item.sell - item.cost;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.partName}</div>
                            {item.hsn && <div className="font-mono text-[11px] text-slate-400">HSN: {item.hsn}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            For: <span className="font-semibold text-rose-300">{item.compatibleModel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.supplierName || "—"}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(item.cost)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(item.sell)}</td>
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {rs(margin)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              item.qty <= 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              item.qty <= 2 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {item.qty} pcs
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setAdjItem(item); setAdjQty(String(item.qty)); setAdjModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10">
                                <SlidersHorizontal className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id, item.partName)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="py-12 text-center text-slate-500">No spare parts found in stock.</td></tr>
                  )
                )}

                {activeTab === "usedPhones" && (
                  filteredUsed.length ? (
                    filteredUsed.map((item) => {
                      const margin = item.sell - item.cost;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.brand} {item.model}</div>
                            {item.imei && <div className="font-mono text-[11px] text-rose-400">IMEI: {item.imei}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {item.condition} {item.batteryHealth ? `· ${item.batteryHealth}% Batt` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.supplierName || "Trade-in / Customer"}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(item.cost)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(item.sell)}</td>
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {rs(margin)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              item.qty <= 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}>
                              {item.qty} pcs
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setAdjItem(item); setAdjQty(String(item.qty)); setAdjModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10">
                                <SlidersHorizontal className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id, `${item.brand} ${item.model}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={8} className="py-12 text-center text-slate-500">No used / refurbished phones recorded.</td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Inventory Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Edit ${activeTab}` : `Add New ${activeTab}`}
      >
        <form onSubmit={handleSaveItem} id="invForm" className="space-y-4 text-xs">
          {activeTab === "mobiles" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand *</label>
                  <input name="brand" defaultValue={editingItem?.brand} required placeholder="Apple, Samsung, Oppo..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model *</label>
                  <input name="model" defaultValue={editingItem?.model} required placeholder="iPhone 15 Pro, A58..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Variant</label>
                  <input name="variant" defaultValue={editingItem?.variant} placeholder="8GB/256GB" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Color</label>
                  <input name="color" defaultValue={editingItem?.color} placeholder="Black Titanium" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IMEI / Serial</label>
                  <input name="imei" defaultValue={editingItem?.imei} placeholder="15-digit IMEI" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Battery Number</label>
                  <input name="batteryNo" defaultValue={editingItem?.batteryNo} placeholder="Optional" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
            </>
          )}

          {activeTab === "accessories" && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Accessory Name *</label>
                <input name="name" defaultValue={editingItem?.name} required placeholder="iPhone 15 Glass, Type-C Charger..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select name="category" defaultValue={editingItem?.category || "Tempered Glass"} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500">
                    <option>Tempered Glass</option>
                    <option>Charger</option>
                    <option>Headphones</option>
                    <option>Mobile Case</option>
                    <option>Skin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">HSN Code</label>
                  <input name="hsn" defaultValue={editingItem?.hsn} placeholder="8517" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
            </>
          )}

          {activeTab === "spareParts" && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Part Name *</label>
                <input name="partName" defaultValue={editingItem?.partName} required placeholder="Folder Display, Charging Board..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Compatible Model *</label>
                  <input name="compatibleModel" defaultValue={editingItem?.compatibleModel} required placeholder="Redmi Note 12..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">HSN Code</label>
                  <input name="hsn" defaultValue={editingItem?.hsn} placeholder="8517" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
            </>
          )}

          {activeTab === "usedPhones" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand *</label>
                  <input name="brand" defaultValue={editingItem?.brand} required placeholder="Apple, OnePlus..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model *</label>
                  <input name="model" defaultValue={editingItem?.model} required placeholder="iPhone 11 64GB..." className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Condition</label>
                  <select name="condition" defaultValue={editingItem?.condition || "Used / Refurbished"} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500">
                    <option>Used / Refurbished</option>
                    <option>Lite Used / Sealed Cut</option>
                    <option>Damaged / Parts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IMEI</label>
                  <input name="imei" defaultValue={editingItem?.imei} placeholder="IMEI" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
            </>
          )}

          {/* Pricing & Stock Fields */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cost Price (₹)</label>
              <input type="number" name="cost" defaultValue={editingItem?.cost} placeholder="0" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sell Price (₹)</label>
              <input type="number" name="sell" defaultValue={editingItem?.sell} placeholder="0" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Quantity *</label>
              <input type="number" name="qty" defaultValue={editingItem?.qty ?? 1} required className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Supplier</label>
            <select name="supplierName" defaultValue={editingItem?.supplierName || ""} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500">
              <option value="">— Select Supplier —</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.supplierName}>{sup.supplierName}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/30">Save Stock</button>
          </div>
        </form>
      </Modal>

      {/* Adjust Quantity Modal */}
      <Modal isOpen={adjModalOpen} onClose={() => setAdjModalOpen(false)} title="Adjust Stock Quantity">
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400 mb-2">Item: <b className="text-white">{adjItem?.brand || adjItem?.name || adjItem?.partName} {adjItem?.model || ""}</b></p>
            <p className="text-slate-400">Current System Stock: <b className="font-mono text-rose-400">{adjItem?.qty}</b></p>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Actual Counted Quantity *</label>
            <input type="number" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white text-base focus:outline-none focus:border-rose-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reason</label>
            <select value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white">
              <option>Count correction</option>
              <option>Damage</option>
              <option>Theft / Loss</option>
              <option>Supplier Return</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setAdjModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Apply Adjustment</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
