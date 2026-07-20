"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { InventoryCategory, Purchase } from "@/types";
import { ShoppingBag, Plus, Search, Trash2 } from "lucide-react";

export default function PurchasesPage() {
  const { 
    purchases, addPurchase, deletePurchase, suppliers,
    mobiles, saveMobile,
    accessories, saveAccessory,
    spareParts, saveSparePart,
    usedPhones, saveUsedPhone,
    logAudit
  } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [supplierId, setSupplierId] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("Mobiles");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(todayISO());

  // Purchase line item
  const [itemName, setItemName] = useState("");
  const [specs, setSpecs] = useState(""); // Brand/Model/Variant for mobile
  const [imei, setImei] = useState("");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast("Please select a supplier", "error");
      return;
    }
    if (!itemName.trim()) {
      toast("Please enter product name/model", "error");
      return;
    }
    const numQty = Number(qty) || 0;
    const numCost = Number(cost) || 0;
    if (numQty <= 0) {
      toast("Quantity must be greater than 0", "error");
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = selectedSupplier?.supplierName || "Direct Supplier";
    const totalAmount = numQty * numCost;

    const purchaseId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // 1. Create Purchase record
    const purchase: Purchase = {
      id: purchaseId,
      supplierId,
      supplierName,
      category,
      invoiceNo,
      date,
      items: [
        {
          invCategory: category,
          name: itemName,
          qty: numQty,
          cost: numCost,
          total: totalAmount,
        },
      ],
      totalAmount,
      createdAt: Date.now(),
    };

    try {
      await addPurchase(purchase);

      // 2. Automatically Increase Inventory Stock in target module
      if (category === "Mobiles") {
        const existing = mobiles.find((m) => m.model.toLowerCase() === itemName.toLowerCase());
        if (existing) {
          await saveMobile({ ...existing, qty: existing.qty + numQty, cost: numCost > 0 ? numCost : existing.cost, supplierName });
        } else {
          await saveMobile({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            brand: specs.split(" ")[0] || "Brand",
            model: itemName,
            variant: specs.split(" ").slice(1).join(" "),
            cost: numCost,
            sell: Math.round(numCost * 1.15),
            qty: numQty,
            supplierId,
            supplierName,
            imei,
          });
        }
      } else if (category === "Accessories") {
        const existing = accessories.find((a) => a.name.toLowerCase() === itemName.toLowerCase());
        if (existing) {
          await saveAccessory({ ...existing, qty: existing.qty + numQty, cost: numCost > 0 ? numCost : existing.cost, supplierName });
        } else {
          await saveAccessory({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: itemName,
            category: "General",
            cost: numCost,
            sell: Math.round(numCost * 1.3),
            qty: numQty,
            supplierId,
            supplierName,
          });
        }
      } else if (category === "Spare Parts") {
        const existing = spareParts.find((s) => s.partName.toLowerCase() === itemName.toLowerCase());
        if (existing) {
          await saveSparePart({ ...existing, qty: existing.qty + numQty, cost: numCost > 0 ? numCost : existing.cost, supplierName });
        } else {
          await saveSparePart({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            partName: itemName,
            compatibleModel: specs || "Universal",
            cost: numCost,
            sell: Math.round(numCost * 1.4),
            qty: numQty,
            supplierId,
            supplierName,
          });
        }
      } else if (category === "Used Phones") {
        await saveUsedPhone({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          brand: specs.split(" ")[0] || "Refurbished",
          model: itemName,
          imei,
          condition: "Used / Refurbished",
          cost: numCost,
          sell: Math.round(numCost * 1.2),
          qty: numQty,
          supplierId,
          supplierName,
        });
      }

      await logAudit("Inward Purchase Logged", `${itemName} x${numQty} from ${supplierName} (${rs(totalAmount)})`);

      setModalOpen(false);
      setItemName("");
      setCost("");
      setQty("1");
      setImei("");
      toast(`Purchase saved! Stock added to ${category}`, "success");
    } catch (e) {
      toast("Error recording purchase", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this purchase record?")) return;
    try {
      await deletePurchase(id);
      toast("Purchase record removed", "info");
    } catch (e) {
      toast("Failed to delete purchase", "error");
    }
  };

  const filtered = purchases.filter(
    (p) =>
      (p.supplierName + p.category + (p.invoiceNo || "") + p.items.map((i) => i.name).join(" "))
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Inward Purchases" subtitle="Log stock received from suppliers & auto-increment inventory">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search purchases by supplier, item, invoice..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Stock (New Purchase)</span>
          </button>
        </div>

        {/* Purchases Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Supplier</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Invoice No</th>
                  <th className="py-3.5 px-4 font-semibold">Purchased Items</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-slate-400">{fmtDate(p.date)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{p.supplierName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{p.invoiceNo || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {p.items.map((it, idx) => (
                          <div key={idx}>
                            <span className="font-semibold text-white">{it.name}</span>
                            <span className="text-slate-400 ml-1">x{it.qty}</span> @ {rs(it.cost)}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(p.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No purchase entries recorded yet. Click "Receive Stock" to record inward stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inward Purchase Stock Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Receive Stock / Inward Purchase">
        <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplierName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Inventory Split *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500 font-bold"
              >
                <option value="Mobiles">Mobiles</option>
                <option value="Accessories">Accessories</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Used Phones">Used Phones</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Purchase Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vendor Invoice / Ref No.</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-9921"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-3">
            <h4 className="font-bold text-white">Item Product Details</h4>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Item / Product Name *</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder="e.g. Redmi Note 13 / Tempered Glass 11D / Display Folder"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Specs / Brand / Model</label>
                <input
                  type="text"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder="Xiaomi 8GB/256GB"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">IMEI / Serial (Optional)</label>
                <input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="15-digit IMEI"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quantity Received *</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unit Cost Price (₹) *</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {Number(qty) > 0 && Number(cost) > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex justify-between items-center text-sm">
                <span className="text-slate-300 font-semibold">Total Inward Purchase Value:</span>
                <span className="font-mono font-bold text-rose-400 text-base">{rs(Number(qty) * Number(cost))}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl glass-card text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/30"
            >
              Receive & Add to Stock
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
