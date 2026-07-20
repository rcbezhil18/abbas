"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { ServiceJob } from "@/types";
import { Wrench, Plus, Search, Edit3, Trash2, Receipt, CheckCircle } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const { services, saveService, deleteService, settings, logAudit } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("open");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ServiceJob | null>(null);

  const openAddModal = () => {
    setEditingJob(null);
    setModalOpen(true);
  };

  const openEditModal = (job: ServiceJob) => {
    setEditingJob(job);
    setModalOpen(true);
  };

  const handleStatusChange = async (job: ServiceJob, newStatus: any) => {
    try {
      await saveService({ ...job, status: newStatus });
      await logAudit("Service Status Updated", `${job.ticketNo} → ${newStatus}`);
      toast(`Status updated to ${newStatus}`, "success");
    } catch (e) {
      toast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id: string, ticketNo: string) => {
    if (!confirm(`Remove repair ticket ${ticketNo}?`)) return;
    try {
      await deleteService(id);
      toast(`Service ticket ${ticketNo} removed`, "info");
    } catch (e) {
      toast("Error deleting service job", "error");
    }
  };

  const handleSaveJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingJob?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ticketNo = editingJob?.ticketNo || `SV-${settings.nextServiceNo}`;

    const job: ServiceJob = {
      id,
      ticketNo,
      customer: {
        name: formData.get("custName") as string,
        mobile: formData.get("custMobile") as string,
      },
      device: formData.get("device") as string,
      issue: formData.get("issue") as string,
      charge: Number(formData.get("charge")) || 0,
      partCost: Number(formData.get("partCost")) || 0,
      vendor: formData.get("vendor") as string,
      notes: formData.get("notes") as string,
      status: (formData.get("status") as any) || "Received",
      date: editingJob?.date || todayISO(),
      createdAt: editingJob?.createdAt || Date.now(),
    };

    try {
      await saveService(job);
      await logAudit("Service Job Saved", `${ticketNo} · ${job.device} · ${job.customer.name}`);
      setModalOpen(false);
      toast(`Service job ${ticketNo} saved!`, "success");
    } catch (e) {
      toast("Error saving service job", "error");
    }
  };

  const handleBillJob = (job: ServiceJob) => {
    router.push(`/billing/new?serviceId=${job.id}&name=${encodeURIComponent(job.customer.name)}&mobile=${encodeURIComponent(job.customer.mobile)}&desc=${encodeURIComponent(`${job.issue} - ${job.device}`)}&charge=${job.charge}&cost=${job.partCost}`);
  };

  const filtered = services
    .filter((s) => {
      if (filterStatus === "open") return s.status !== "Delivered";
      if (filterStatus === "delivered") return s.status === "Delivered";
      return true;
    })
    .filter((s) =>
      (s.ticketNo + s.customer.name + s.customer.mobile + s.device + s.issue)
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <AppLayout title="Services & Repair Jobs" subtitle="Repair job sheet lifecycle: Received → In Progress → Ready → Delivered">
      <div className="space-y-6">
        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setFilterStatus("open")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "open" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Open Jobs
              </button>
              <button
                onClick={() => setFilterStatus("delivered")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "delivered" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === "all" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All Jobs ({services.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, customer, device..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Repair Job</span>
            </button>
          </div>
        </div>

        {/* Services Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Ticket No</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Device</th>
                  <th className="py-3.5 px-4 font-semibold">Issue</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Service Charge</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Part Cost</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Margin</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status Workflow</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((s) => {
                    const margin = s.charge - s.partCost;
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-400 flex items-center gap-1.5">
                          <span>{s.ticketNo}</span>
                          {s.billId && <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BILLED</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{s.customer.name}</div>
                          <div className="font-mono text-[11px] text-slate-400">{s.customer.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-200">{s.device}</td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{s.issue}</div>
                          {s.vendor && <div className="text-[10px] text-slate-400">Vendor: {s.vendor}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(s.charge)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">{rs(s.partCost)}</td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {rs(margin)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s, e.target.value)}
                            className="px-2.5 py-1 rounded-xl bg-[#14101d] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-rose-500"
                          >
                            <option value="Received">Received</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Ready">Ready</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleBillJob(s)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                              title="Bill Service Job"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.ticketNo)}
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
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No repair jobs found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Job Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingJob ? `Edit Repair Job: ${editingJob.ticketNo}` : "New Repair Job Sheet"}
      >
        <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
              <input
                name="custName"
                defaultValue={editingJob?.customer.name}
                required
                placeholder="e.g. Mr. Ramesh"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
              <input
                name="custMobile"
                defaultValue={editingJob?.customer.mobile}
                required
                placeholder="98765..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Device Model *</label>
            <input
              name="device"
              defaultValue={editingJob?.device}
              required
              placeholder="e.g. Redmi Note 12 / iPhone 11"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Issue / Problem</label>
              <select
                name="issue"
                defaultValue={editingJob?.issue || "Display Replacement"}
                className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white focus:outline-none focus:border-rose-500"
              >
                <option>Display Replacement</option>
                <option>Charging Port Issue</option>
                <option>Battery Replacement</option>
                <option>Software / Flashing</option>
                <option>Speaker / Mic Repair</option>
                <option>Other Service</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Job Status</label>
              <select
                name="status"
                defaultValue={editingJob?.status || "Received"}
                className="w-full px-3 py-2 rounded-xl bg-[#14101d] border border-white/10 text-white font-bold"
              >
                <option value="Received">Received</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Charge (₹) *</label>
              <input
                type="number"
                name="charge"
                defaultValue={editingJob?.charge}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white font-bold focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Spare Part Cost (₹)</label>
              <input
                type="number"
                name="partCost"
                defaultValue={editingJob?.partCost}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Spare Part Sourced Vendor</label>
            <input
              name="vendor"
              defaultValue={editingJob?.vendor}
              placeholder="Where spare part was sourced"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes / Diagnostic Remarks</label>
            <textarea
              name="notes"
              defaultValue={editingJob?.notes}
              placeholder="Symptoms, lock passcode, scratch notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
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
              Save Repair Job Sheet
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
