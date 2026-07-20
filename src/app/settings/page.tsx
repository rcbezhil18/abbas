"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { download, todayISO } from "@/lib/utils";
import { Settings, Save, Download, Upload, Trash2, ShieldCheck, History } from "lucide-react";

export default function SettingsPage() {
  const { settings, saveSettings, auditLogs, logAudit } = useData();
  const { toast } = useToast();

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updated = {
      shopName: formData.get("shopName") as string,
      gstin: formData.get("gstin") as string,
      addrCash: formData.get("addrCash") as string,
      addrTax: formData.get("addrTax") as string,
      cell: formData.get("cell") as string,
      state: formData.get("state") as string,
      stateCode: formData.get("stateCode") as string,
      gstRate: Number(formData.get("gstRate")) || 18,
      warrantyMonths: Number(formData.get("warrantyMonths")) || 12,
      upiId: formData.get("upiId") as string,
      nextCashNo: Number(formData.get("nextCashNo")) || 1,
      nextTaxNo: Number(formData.get("nextTaxNo")) || 1,
      nextNonTaxNo: Number(formData.get("nextNonTaxNo")) || 1,
      nextServiceNo: Number(formData.get("nextServiceNo")) || 1,
      nextQuoteNo: Number(formData.get("nextQuoteNo")) || 1,
      nextChallanNo: Number(formData.get("nextChallanNo")) || 1,
      bankName: formData.get("bankName") as string,
      bankAcc: formData.get("bankAcc") as string,
      ifsc: formData.get("ifsc") as string,
    };

    try {
      await saveSettings(updated);
      await logAudit("Settings Saved", "Updated shop preferences and bill numbering");
      toast("Shop settings saved successfully", "success");
    } catch (e) {
      toast("Failed to save settings", "error");
    }
  };

  const exportBackup = () => {
    try {
      const raw = localStorage.getItem("abbas_cell_park_firestore_cache_v2");
      const data = raw ? JSON.parse(raw) : { settings };
      download(`abbas-cell-park-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), "application/json");
      toast("Backup JSON exported successfully", "success");
    } catch (e) {
      toast("Export failed", "error");
    }
  };

  return (
    <AppLayout title="System Settings & Shop Preferences" subtitle="Shop details, bill numbering counters, bank info & backup management">
      <div className="max-w-4xl space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Shop Details */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
              Shop Details & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Shop Name *</label>
                <input name="shopName" defaultValue={settings.shopName} required className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500 font-bold text-sm" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">GSTIN Number</label>
                <input name="gstin" defaultValue={settings.gstin} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Cell Numbers</label>
                <input name="cell" defaultValue={settings.cell} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Address (Cash Bill Receipt Header)</label>
                <input name="addrCash" defaultValue={settings.addrCash} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Address (Tax Invoice Header)</label>
                <input name="addrTax" defaultValue={settings.addrTax} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">State</label>
                <input name="state" defaultValue={settings.state} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">State Code</label>
                <input name="stateCode" defaultValue={settings.stateCode} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default GST Rate (%)</label>
                <input type="number" name="gstRate" defaultValue={settings.gstRate} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Warranty (Months)</label>
                <input type="number" name="warrantyMonths" defaultValue={settings.warrantyMonths} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Shop UPI ID (For Receipts & Digital Payments)</label>
                <input name="upiId" defaultValue={settings.upiId} placeholder="shop@upi" className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
            </div>
          </div>

          {/* Invoice Numbering Counters */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
              Next Invoice Numbering Counters
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Cash Bill No</label>
                <input type="number" name="nextCashNo" defaultValue={settings.nextCashNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Tax Invoice No</label>
                <input type="number" name="nextTaxNo" defaultValue={settings.nextTaxNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Non-Tax No</label>
                <input type="number" name="nextNonTaxNo" defaultValue={settings.nextNonTaxNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Service Ticket No</label>
                <input type="number" name="nextServiceNo" defaultValue={settings.nextServiceNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Estimate No</label>
                <input type="number" name="nextQuoteNo" defaultValue={settings.nextQuoteNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-sans">Next Challan No</label>
                <input type="number" name="nextChallanNo" defaultValue={settings.nextChallanNo} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-rose-400 font-bold" />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
              Bank Details (For Tax Invoice Footer)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                <input name="bankName" defaultValue={settings.bankName} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Number</label>
                <input name="bankAcc" defaultValue={settings.bankAcc} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">IFSC Code</label>
                <input name="ifsc" defaultValue={settings.ifsc} className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>

        {/* Backup & Audit Section */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
            Database Backup & Audit Trail
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={exportBackup}
              className="px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-rose-400" />
              <span>Export Full Backup JSON</span>
            </button>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <History className="w-4 h-4 text-rose-400" />
              <span>Recent Activity Logs ({auditLogs.length})</span>
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {auditLogs.length ? (
                auditLogs.slice(0, 30).map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] text-xs">
                    <div>
                      <span className="font-bold text-rose-300">{log.action}:</span>{" "}
                      <span className="text-slate-300">{log.detail}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(log.ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-500 text-xs">No audit logs recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
