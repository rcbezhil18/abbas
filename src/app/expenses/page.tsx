"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { Expense } from "@/types";
import { Wallet, Plus, Search, Edit3, Trash2 } from "lucide-react";

const CATEGORIES = ["Rent", "Electricity", "Salary / Wages", "Stationery", "Transport", "Maintenance", "Miscellaneous"];

export default function ExpensesPage() {
  const { expenses, saveExpense, deleteExpense, logAudit } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  const openAddModal = () => {
    setEditingExp(null);
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExp(exp);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this expense entry?")) return;
    try {
      await deleteExpense(id);
      toast("Expense deleted", "info");
    } catch (e) {
      toast("Delete failed", "error");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingExp?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const amount = Number(formData.get("amount")) || 0;

    if (amount <= 0) {
      toast("Amount must be greater than 0", "error");
      return;
    }

    const exp: Expense = {
      id,
      date: (formData.get("date") as string) || todayISO(),
      category: (formData.get("category") as string) || CATEGORIES[0],
      amount,
      vendor: formData.get("vendor") as string,
      notes: formData.get("notes") as string,
      createdAt: editingExp?.createdAt || Date.now(),
    };

    try {
      await saveExpense(exp);
      await logAudit("Expense Recorded", `${exp.category} · ${rs(amount)}`);
      setModalOpen(false);
      toast("Expense saved successfully", "success");
    } catch (e) {
      toast("Error saving expense", "error");
    }
  };

  const filtered = expenses.filter(
    (e) =>
      (e.category + (e.notes || "") + (e.vendor || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const totalExpense = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <AppLayout title="Shop Operating Expenses" subtitle="Log shop rent, electricity bills, salaries, transport & miscellaneous expenses">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category, notes, vendor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Vendor / Paid To</th>
                  <th className="py-3.5 px-4 font-semibold">Notes</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-slate-400">{fmtDate(e.date)}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{e.category}</td>
                      <td className="py-3.5 px-4 text-slate-300">{e.vendor || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-400">{e.notes || "—"}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">{rs(e.amount)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No expenses logged yet.
                    </td>
                  </tr>
                )}
                {filtered.length > 0 && (
                  <tr className="bg-white/[0.02] font-bold">
                    <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-[10px] text-slate-400">Total Expenses</td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-400 text-sm">{rs(totalExpense)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExp ? "Edit Expense" : "Add Expense Entry"}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date</label>
              <input type="date" name="date" defaultValue={editingExp?.date || todayISO()} className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select name="category" defaultValue={editingExp?.category || CATEGORIES[0]} className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white font-bold">
                {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
              <input type="number" name="amount" defaultValue={editingExp?.amount} required placeholder="0.00" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white font-bold" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Paid To / Vendor</label>
              <input name="vendor" defaultValue={editingExp?.vendor} placeholder="e.g. Landlord, TNEB" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes</label>
            <input name="notes" defaultValue={editingExp?.notes} placeholder="Optional notes" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Save Expense</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
