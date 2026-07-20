"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { fmtDate, todayISO } from "@/lib/utils";
import { Challan } from "@/types";
import { Send, Plus, Search, Trash2, Printer } from "lucide-react";

export default function ChallanPage() {
  const { challans, saveChallan, deleteChallan, settings, logAudit } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [purpose, setPurpose] = useState("Sale on Approval");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ desc: string; qty: number }[]>([
    { desc: "", qty: 1 },
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      toast("Enter Receiver Name", "error");
      return;
    }
    const validItems = items.filter((it) => it.desc.trim() && Number(it.qty) > 0);
    if (!validItems.length) {
      toast("Add at least one line item", "error");
      return;
    }

    const challanNo = `DC-${settings.nextChallanNo}`;
    const challan: Challan = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      challanNo,
      date: todayISO(),
      customer: { name: custName, address: custAddress, mobile: custMobile },
      purpose,
      items: validItems,
      notes,
      createdAt: Date.now(),
    };

    try {
      await saveChallan(challan);
      await logAudit("Delivery Challan Created", `${challanNo} · ${custName}`);
      setModalOpen(false);
      setCustName("");
      setItems([{ desc: "", qty: 1 }]);
      toast(`Delivery Challan ${challanNo} saved`, "success");
    } catch (e) {
      toast("Save failed", "error");
    }
  };

  const handleDelete = async (id: string, challanNo: string) => {
    if (!confirm(`Delete challan ${challanNo}?`)) return;
    try {
      await deleteChallan(id);
      toast(`Challan ${challanNo} removed`, "info");
    } catch (e) {
      toast("Delete failed", "error");
    }
  };

  const filtered = challans.filter(
    (c) =>
      (c.challanNo + c.customer.name + c.purpose)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Delivery Challan" subtitle="Goods movement register for Sale on Approval, Returns & Replacements">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challan no, receiver..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Challan</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Challan No</th>
                  <th className="py-3.5 px-4 font-semibold">Receiver Name</th>
                  <th className="py-3.5 px-4 font-semibold">Purpose</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Total Items</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{c.challanNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{c.customer.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{c.customer.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{c.purpose}</td>
                      <td className="py-3.5 px-4 text-slate-400">{fmtDate(c.date)}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">{c.items.length}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => window.print()} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.challanNo)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No delivery challans issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Delivery Challan">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Receiver Name *</label>
              <input value={custName} onChange={(e) => setCustName(e.target.value)} required placeholder="Receiver Name" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile</label>
              <input value={custMobile} onChange={(e) => setCustMobile(e.target.value)} placeholder="Mobile No" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white font-bold">
              <option>Sale on Approval</option>
              <option>Return to Vendor</option>
              <option>Replacement Item</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-slate-300 font-semibold">Challan Line Items</label>
            {items.map((it, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={it.desc}
                  onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, desc: e.target.value } : x)))}
                  placeholder="Item description"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white"
                />
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))}
                  className="w-20 px-2 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white text-center"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Save Delivery Challan</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
