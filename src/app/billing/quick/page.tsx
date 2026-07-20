"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, calcBill, numWords, todayISO, generateDateBillNo } from "@/lib/utils";
import { Bill } from "@/types";
import { Zap, Printer, Save } from "lucide-react";

export default function QuickBillPage() {
  const router = useRouter();
  const { settings, bills, addBill, logAudit } = useData();
  const { toast } = useToast();

  const [billType, setBillType] = useState<"cash" | "nontax" | "tax">("cash");
  const [custName, setCustName] = useState("Walk-in Customer");
  const [custMobile, setCustMobile] = useState("");
  const [model, setModel] = useState("");
  const [imei, setImei] = useState("");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");
  const [payMode, setPayMode] = useState("Cash");

  const calculated = calcBill(
    [{ qty: Number(qty) || 1, rate: Number(rate) || 0, model: model || "Item" }],
    settings.gstRate,
    false,
    true,
    billType === "nontax"
  );

  const handleSave = async (shouldPrint: boolean) => {
    if (!custName.trim()) {
      toast("Enter Customer Name", "error");
      return;
    }
    if (!model.trim()) {
      toast("Enter Product / Model Name", "error");
      return;
    }
    if (Number(rate) <= 0) {
      toast("Enter a valid Rate amount", "error");
      return;
    }

    // Generate Date-Coded Bill No (e.g. 20260720-001)
    const billNo = generateDateBillNo(billType, todayISO(), bills);

    const billRecord: Bill = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      billNo,
      type: billType,
      saleType: "mobile",
      date: todayISO(),
      customer: {
        name: custName,
        mobile: custMobile,
      },
      items: [
        {
          model,
          imei1: imei,
          qty: Number(qty) || 1,
          rate: Number(rate) || 0,
          cost: 0,
          taxable: calculated.taxable,
          cgstA: calculated.cgst,
          sgstA: calculated.sgst,
          igstA: calculated.igst,
          amount: calculated.grand,
          lineTotal: calculated.grand,
        },
      ],
      rate: calculated.rate,
      interstate: false,
      inclusive: true,
      taxable: calculated.taxable,
      cgst: calculated.cgst,
      sgst: calculated.sgst,
      igst: calculated.igst,
      gst: calculated.gst,
      grand: calculated.grand,
      netPayable: calculated.grand,
      costTotal: 0,
      costKnown: false,
      profit: 0,
      paid: calculated.grand,
      payMode,
      balance: 0,
      warrantyMonths: 12,
      void: false,
      words: numWords(calculated.grand),
      createdAt: Date.now(),
    };

    try {
      await addBill(billRecord);
      await logAudit("Quick Bill Created", `${billNo} · ${rs(calculated.grand)}`);
      toast(`Quick Bill ${billNo} saved!`, "success");

      if (shouldPrint) {
        router.push(`/bills?print=${billRecord.id}`);
      } else {
        router.push("/bills");
      }
    } catch (e) {
      toast("Failed to save quick bill", "error");
    }
  };

  return (
    <AppLayout title="Quick Bill" subtitle="Fast express checkout for walk-in retail items">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">Express Walk-in Billing</h3>
              <p className="text-xs text-slate-400">Single item fast checkout counter</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(true); }} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Bill Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBillType("cash")}
                  className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                    billType === "cash"
                      ? "bg-rose-600 text-white border-rose-500"
                      : "glass-card text-slate-400 border-white/10"
                  }`}
                >
                  Cash Bill
                </button>
                <button
                  type="button"
                  onClick={() => setBillType("tax")}
                  className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                    billType === "tax"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "glass-card text-slate-400 border-white/10"
                  }`}
                >
                  Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setBillType("nontax")}
                  className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                    billType === "nontax"
                      ? "bg-amber-600 text-white border-amber-500"
                      : "glass-card text-slate-400 border-white/10"
                  }`}
                >
                  Non-Tax Invoice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model / Product Description *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="e.g. Redmi 13C 6GB/128GB / Tempered Glass"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500 text-sm"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">IMEI / Serial</label>
                <input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min="1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14101d] border border-white/10 text-white"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total Amount (₹) *</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-rose-400 text-xl font-extrabold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-4 rounded-xl glass-card bg-rose-500/5 border border-rose-500/20 flex justify-between items-center text-sm pt-4">
              <span className="text-slate-300 font-semibold">Invoice Grand Total:</span>
              <span className="font-mono font-extrabold text-rose-400 text-2xl">{rs(calculated.grand)}</span>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Save & Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-6 py-3.5 rounded-xl glass-card hover:bg-white/10 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
