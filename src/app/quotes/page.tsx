"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, rs2, fmtDate, todayISO } from "@/lib/utils";
import { Quote } from "@/types";
import { FileText, Plus, Search, Trash2, Printer, Receipt, Wrench } from "lucide-react";

export default function QuotesPage() {
  const router = useRouter();
  const { quotes, saveQuote, deleteQuote, settings, saveService, logAudit } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [custName, setCustName] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ desc: string; qty: number; rate: number }[]>([
    { desc: "", qty: 1, rate: 0 },
  ]);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      toast("Enter Customer Name", "error");
      return;
    }
    const validItems = items.filter((it) => it.desc.trim() && Number(it.rate) > 0);
    if (!validItems.length) {
      toast("Add at least one line item with a rate", "error");
      return;
    }

    const quoteNo = `EST-${settings.nextQuoteNo}`;
    const quote: Quote = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      quoteNo,
      date: todayISO(),
      customer: { name: custName, mobile: custMobile },
      saleType: "service",
      items: validItems,
      notes,
      validDays: Number(validDays) || 7,
      status: "Open",
      createdAt: Date.now(),
    };

    try {
      await saveQuote(quote);
      await logAudit("Estimate Created", `${quoteNo} · ${custName}`);
      setModalOpen(false);
      setCustName("");
      setCustMobile("");
      setItems([{ desc: "", qty: 1, rate: 0 }]);
      toast(`Estimate ${quoteNo} saved`, "success");
    } catch (e) {
      toast("Error saving estimate", "error");
    }
  };

  const handleConvertToBill = (q: Quote) => {
    saveQuote({ ...q, status: "Converted" });
    const firstItem = q.items[0];
    router.push(
      `/billing/new?name=${encodeURIComponent(q.customer.name)}&mobile=${encodeURIComponent(q.customer.mobile)}&desc=${encodeURIComponent(firstItem?.desc || "")}&charge=${firstItem?.rate || 0}`
    );
  };

  const handleDelete = async (id: string, quoteNo: string) => {
    if (!confirm(`Delete estimate ${quoteNo}?`)) return;
    try {
      await deleteQuote(id);
      toast(`Estimate ${quoteNo} removed`, "info");
    } catch (e) {
      toast("Delete failed", "error");
    }
  };

  const filtered = quotes.filter(
    (q) =>
      (q.quoteNo + q.customer.name + (q.customer.mobile || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Estimates & Quotations" subtitle="Raise price estimates before job confirmation & convert to bill in one click">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by estimate no, customer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Estimate</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Estimate No</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Validity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Estimated</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((q) => {
                    const total = q.items.reduce((s, it) => s + (it.qty * it.rate), 0);
                    return (
                      <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{q.quoteNo}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{q.customer.name}</div>
                          <div className="font-mono text-[11px] text-slate-400">{q.customer.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{fmtDate(q.date)}</td>
                        <td className="py-3.5 px-4 text-slate-300">{q.validDays} Days</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(total)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === "Converted" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {q.status !== "Converted" && (
                              <button
                                onClick={() => handleConvertToBill(q)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                title="Convert to Bill"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => window.print()}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(q.id, q.quoteNo)}
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
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No estimates recorded yet. Click "New Estimate" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Price Estimate / Quotation">
        <form onSubmit={handleSaveQuote} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
              <input value={custName} onChange={(e) => setCustName(e.target.value)} required placeholder="Customer Name" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Number</label>
              <input value={custMobile} onChange={(e) => setCustMobile(e.target.value)} placeholder="Mobile No" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-slate-300 font-semibold">Estimate Line Items</label>
            {items.map((it, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={it.desc}
                  onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, desc: e.target.value } : x)))}
                  placeholder="Item / Service description"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white"
                />
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))}
                  className="w-16 px-2 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white text-center"
                />
                <input
                  type="number"
                  value={it.rate || ""}
                  onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, rate: Number(e.target.value) } : x)))}
                  placeholder="Rate (₹)"
                  className="w-28 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes / Terms</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Estimate valid subject to part availability" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Save Estimate</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
