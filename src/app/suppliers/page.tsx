"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate } from "@/lib/utils";
import { Supplier } from "@/types";
import { Users, Plus, Search, Phone, Mail, FileText, Edit3, Trash2, Eye, Building2 } from "lucide-react";

export default function SuppliersPage() {
  const { suppliers, saveSupplier, deleteSupplier, purchases } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Profile view
  const [profileSupplier, setProfileSupplier] = useState<Supplier | null>(null);

  const openAddModal = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier(id);
      toast(`Supplier "${name}" deleted`, "info");
    } catch (e) {
      toast("Error deleting supplier", "error");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingSupplier?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const sup: Supplier = {
      id,
      supplierName: formData.get("supplierName") as string,
      contactPerson: formData.get("contactPerson") as string,
      mobile: formData.get("mobile") as string,
      gstin: formData.get("gstin") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      outstandingBalance: Number(formData.get("outstandingBalance")) || 0,
      createdAt: editingSupplier?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveSupplier(sup);
      setModalOpen(false);
      toast("Supplier saved successfully", "success");
    } catch (e) {
      toast("Failed to save supplier", "error");
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      (s.supplierName + (s.contactPerson || "") + s.mobile + (s.gstin || ""))
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const supplierPurchases = profileSupplier
    ? purchases.filter((p) => p.supplierId === profileSupplier.id || p.supplierName === profileSupplier.supplierName)
    : [];

  return (
    <AppLayout title="Suppliers Directory" subtitle="Vendor profiles, contact information, GSTIN & purchase history">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier name, mobile, GSTIN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Suppliers List Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Supplier Name</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Person</th>
                  <th className="py-3.5 px-4 font-semibold">Mobile & Email</th>
                  <th className="py-3.5 px-4 font-semibold">GSTIN</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Outstanding Balance</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{s.supplierName}</div>
                        {s.address && <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.address}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{s.contactPerson || "—"}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-200">{s.mobile}</div>
                        {s.email && <div className="text-[11px] text-slate-400">{s.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{s.gstin || "—"}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${s.outstandingBalance > 0 ? "text-rose-400" : "text-slate-400"}`}>
                        {rs(s.outstandingBalance)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setProfileSupplier(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title="View Supplier Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.supplierName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No suppliers recorded yet. Click "Add Supplier" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Supplier Name *</label>
            <input
              name="supplierName"
              defaultValue={editingSupplier?.supplierName}
              required
              placeholder="e.g. Sree Communication, Apple Distributor..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Person</label>
              <input
                name="contactPerson"
                defaultValue={editingSupplier?.contactPerson}
                placeholder="e.g. Mr. Rajesh"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
              <input
                name="mobile"
                defaultValue={editingSupplier?.mobile}
                required
                placeholder="98422..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">GSTIN</label>
              <input
                name="gstin"
                defaultValue={editingSupplier?.gstin}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={editingSupplier?.email}
                placeholder="vendor@mail.com"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Address</label>
            <input
              name="address"
              defaultValue={editingSupplier?.address}
              placeholder="Door No, Street, City, Pincode"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Outstanding Balance (₹)</label>
            <input
              type="number"
              name="outstandingBalance"
              defaultValue={editingSupplier?.outstandingBalance ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
            />
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
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Profile Modal */}
      <Modal
        isOpen={!!profileSupplier}
        onClose={() => setProfileSupplier(null)}
        title={`Supplier Profile: ${profileSupplier?.supplierName || ""}`}
      >
        <div className="space-y-4 text-xs">
          <div className="glass-card rounded-xl p-4 border border-white/10 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Contact Person:</span>
              <span className="font-semibold text-white">{profileSupplier?.contactPerson || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile:</span>
              <span className="font-mono text-rose-400">{profileSupplier?.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GSTIN:</span>
              <span className="font-mono text-slate-200">{profileSupplier?.gstin || "—"}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-slate-400">Outstanding Dues:</span>
              <span className="font-mono font-bold text-rose-400">{rs(profileSupplier?.outstandingBalance || 0)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">Purchase History ({supplierPurchases.length})</h4>
            <div className="glass-card rounded-xl border border-white/10 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[10px] uppercase">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Invoice No</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {supplierPurchases.length ? (
                    supplierPurchases.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 text-slate-400">{fmtDate(p.date)}</td>
                        <td className="py-2 px-3 text-slate-200">{p.category}</td>
                        <td className="py-2 px-3 font-mono text-rose-300">{p.invoiceNo || "—"}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">{rs(p.totalAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No inward purchases recorded from this supplier yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setProfileSupplier(null)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold"
            >
              Close Profile
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
