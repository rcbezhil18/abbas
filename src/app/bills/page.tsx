"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, rs2, fmtDate, todayISO } from "@/lib/utils";
import { Bill } from "@/types";
import { 
  ListOrdered, 
  Search, 
  Printer, 
  Receipt, 
  Share2, 
  Ban, 
  Trash2, 
  Wallet, 
  Plus, 
  CheckCircle,
  FileText
} from "lucide-react";

function BillsContent() {
  const searchParams = useSearchParams();
  const printIdParam = searchParams.get("print");

  const { bills, voidBill, deleteBill, recordPayment, settings, logAudit } = useData();
  const { toast } = useToast();

  const [filter, setFilter] = useState<"all" | "cash" | "nontax" | "tax">("all");
  const [search, setSearch] = useState("");

  // Print modal state
  const [printBillObj, setPrintBillObj] = useState<Bill | null>(null);
  const [printMode, setPrintMode] = useState<"a4" | "thermal">("a4");

  // Collect Dues modal state
  const [dueBillObj, setDueBillObj] = useState<Bill | null>(null);
  const [collectAmt, setCollectAmt] = useState("");
  const [collectMode, setCollectMode] = useState("Cash");

  // Void modal state
  const [voidBillObj, setVoidBillObj] = useState<Bill | null>(null);
  const [voidReason, setVoidReason] = useState("");

  useEffect(() => {
    if (printIdParam && bills.length) {
      const target = bills.find((b) => b.id === printIdParam);
      if (target) {
        setPrintBillObj(target);
      }
    }
  }, [printIdParam, bills]);

  const filtered = bills
    .filter((b) => filter === "all" || b.type === filter)
    .filter(
      (b) =>
        (b.billNo + b.customer.name + (b.customer.mobile || ""))
          .toLowerCase()
          .includes(search.toLowerCase())
    );

  const handlePrint = (bill: Bill, mode: "a4" | "thermal") => {
    setPrintBillObj(bill);
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleWhatsApp = (b: Bill) => {
    const s = settings;
    const lines = b.items.map((it) => `• ${it.model} x${it.qty} — ${rs(it.amount)}`).join("\n");
    const bal = Number(b.balance) || 0;
    const msg = `*${s.shopName}*\nInvoice ${b.billNo} · ${fmtDate(b.date)}\n\n${lines}\n\n*Total: ${rs(b.grand)}*\nPaid: ${rs(b.paid)}${bal > 0 ? ` · Balance Due: ${rs(bal)}` : ""}\n\nThank you for shopping with us! Contact: ${s.cell}`;
    const mob = String(b.customer.mobile || "").replace(/\D/g, "");
    const phone = mob.length === 10 ? "91" + mob : mob;
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg), "_blank");
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueBillObj) return;
    const amt = Number(collectAmt) || 0;
    if (amt <= 0) {
      toast("Enter an amount greater than 0", "error");
      return;
    }

    const nextPaid = (dueBillObj.paid || 0) + amt;
    const nextBalance = Math.max(0, (dueBillObj.balance || 0) - amt);

    dueBillObj.paid = nextPaid;
    dueBillObj.balance = nextBalance;

    try {
      await recordPayment({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        billId: dueBillObj.id,
        billNo: dueBillObj.billNo,
        customerName: dueBillObj.customer.name,
        customerMobile: dueBillObj.customer.mobile,
        amount: amt,
        mode: collectMode,
        date: todayISO(),
        createdAt: Date.now(),
      });

      await logAudit("Dues Collected", `${dueBillObj.billNo} · ${rs(amt)} · ${collectMode}`);
      setDueBillObj(null);
      toast(`Recorded payment of ${rs(amt)}`, "success");
    } catch (e) {
      toast("Payment recording failed", "error");
    }
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidBillObj) return;
    try {
      await voidBill(voidBillObj.id, voidReason);
      await logAudit("Bill Voided", `${voidBillObj.billNo} · Reason: ${voidReason || "None"}`);
      setVoidBillObj(null);
      toast(`Bill ${voidBillObj.billNo} voided`, "info");
    } catch (e) {
      toast("Failed to void bill", "error");
    }
  };

  const handleDelete = async (id: string, billNo: string) => {
    if (!confirm(`Are you sure you want to permanently delete bill ${billNo}?`)) return;
    try {
      await deleteBill(id);
      toast(`Bill ${billNo} deleted`, "info");
    } catch (e) {
      toast("Error deleting bill", "error");
    }
  };

  return (
    <AppLayout title="Bills & Invoices Register" subtitle="Manage raised invoices, print receipts, collect dues & audit transactions">
      <div className="space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "all" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({bills.length})
            </button>
            <button
              onClick={() => setFilter("cash")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "cash" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Cash Bills
            </button>
            <button
              onClick={() => setFilter("tax")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "tax" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              GST Tax
            </button>
            <button
              onClick={() => setFilter("nontax")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "nontax" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Non-Tax
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill No, customer, mobile..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Bills Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Bill No.</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                  <th className="py-3.5 px-4 font-semibold">Mobile</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Grand Total</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Balance Due</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((b) => {
                    const bal = Number(b.balance) || 0;
                    return (
                      <tr key={b.id} className={`hover:bg-white/[0.02] transition-colors ${b.void ? "opacity-50" : ""}`}>
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-400 flex items-center gap-1.5">
                          <span>{b.billNo}</span>
                          {b.void && <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30">VOID</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.type === "tax"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : b.type === "nontax"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {b.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white font-semibold">{b.customer.name || "—"}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{b.customer.mobile || "—"}</td>
                        <td className="py-3.5 px-4 text-slate-400">{fmtDate(b.date)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(b.grand)}</td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${bal > 0 ? "text-rose-400" : "text-slate-400"}`}>
                          {bal > 0 ? rs(bal) : "Paid"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {bal > 0 && !b.void && (
                              <button
                                onClick={() => { setDueBillObj(b); setCollectAmt(String(bal)); }}
                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10"
                                title="Collect Dues"
                              >
                                <Wallet className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePrint(b, "a4")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                              title="Print A4 Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(b, "thermal")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                              title="Print Thermal Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            {b.customer.mobile && (
                              <button
                                onClick={() => handleWhatsApp(b)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            )}
                            {!b.void && (
                              <button
                                onClick={() => setVoidBillObj(b)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                title="Void Bill"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(b.id, b.billNo)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Bill"
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
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collect Dues Modal */}
      <Modal isOpen={!!dueBillObj} onClose={() => setDueBillObj(null)} title={`Collect Dues — ${dueBillObj?.billNo}`}>
        <form onSubmit={handleCollectSubmit} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400">Customer: <b className="text-white">{dueBillObj?.customer.name}</b></p>
            <p className="text-slate-400">Current Balance Due: <b className="font-mono text-rose-400 text-sm">{rs(dueBillObj?.balance || 0)}</b></p>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              value={collectAmt}
              onChange={(e) => setCollectAmt(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-white text-lg font-bold focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
            <select
              value={collectMode}
              onChange={(e) => setCollectMode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14101d] border border-white/10 text-white"
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setDueBillObj(null)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Void Bill Modal */}
      <Modal isOpen={!!voidBillObj} onClose={() => setVoidBillObj(null)} title={`Void Invoice ${voidBillObj?.billNo}?`}>
        <form onSubmit={handleVoidSubmit} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Voiding keeps the audit trail but excludes this bill from sales totals and returns any deducted items back to stock.
          </p>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Reason for Voiding *</label>
            <input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              required
              placeholder="e.g. Returned item / Wrong billing entry"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-rose-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setVoidBillObj(null)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Confirm Void</button>
          </div>
        </form>
      </Modal>

      {/* Hidden Printable Invoice Element for Window.Print */}
      {printBillObj && (
        <div id="printArea">
          {printMode === "thermal" ? (
            <div style={{ width: "72mm", margin: "0 auto", padding: "8px", fontFamily: "monospace", fontSize: "11px", color: "#000" }}>
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>{settings.shopName}</div>
              <div style={{ textAlign: "center", fontSize: "10px" }}>{settings.addrCash}</div>
              <div style={{ textAlign: "center", fontSize: "10px" }}>Cell: {settings.cell}</div>
              <div style={{ textAlign: "center", fontSize: "10px" }}>GSTIN: {settings.gstin}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
              <div style={{ textAlign: "center", fontWeight: "bold" }}>{printBillObj.type.toUpperCase()} BILL</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>No: {printBillObj.billNo}</span><span>{fmtDate(printBillObj.date)}</span></div>
              <div>Customer: {printBillObj.customer.name}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
              {printBillObj.items.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", margin: "3px 0" }}>
                  <div>{it.model} {it.imei1 && `(${it.imei1})`}</div>
                  <div>{it.qty} x {rs2(it.rate)} = {rs2(it.amount)}</div>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}><span>TOTAL</span><span>{rs2(printBillObj.grand)}</span></div>
              <div style={{ textAlign: "center", marginTop: "10px" }}>Thank you! Visit again.</div>
            </div>
          ) : (
            <div style={{ width: "190mm", margin: "0 auto", padding: "16px", color: "#000", fontFamily: "sans-serif", fontSize: "12px" }}>
              <div style={{ border: "2px solid #c01d5a", borderRadius: "4px" }}>
                <div style={{ borderBottom: "1.5px solid #c01d5a", padding: "12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src="/logo-original.png" alt="Abbas Cellpark Logo" style={{ height: "65px", objectFit: "contain", marginBottom: "4px" }} />
                  <div style={{ fontSize: "11px", color: "#333" }}>{settings.addrCash} · Cell: {settings.cell}</div>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>GSTIN: {settings.gstin}</div>
                </div>
                <div style={{ padding: "10px", borderBottom: "1.5px solid #c01d5a", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div><b>Customer:</b> {printBillObj.customer.name}</div>
                    <div><b>Mobile:</b> {printBillObj.customer.mobile}</div>
                    {printBillObj.customer.address && <div><b>Address:</b> {printBillObj.customer.address}</div>}
                  </div>
                  <div>
                    <div><b>Invoice No:</b> <span style={{ color: "#c01d5a", fontWeight: "bold" }}>{printBillObj.billNo}</span></div>
                    <div><b>Date:</b> {fmtDate(printBillObj.date)}</div>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fbeef3", borderBottom: "1.5px solid #c01d5a" }}>
                      <th style={{ padding: "6px", textAlign: "left" }}>Description</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>Rate</th>
                      <th style={{ padding: "6px", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printBillObj.items.map((it, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "6px" }}>{it.model} {it.imei1 && `(IMEI: ${it.imei1})`}</td>
                        <td style={{ padding: "6px", textAlign: "center" }}>{it.qty}</td>
                        <td style={{ padding: "6px", textAlign: "right" }}>{rs2(it.rate)}</td>
                        <td style={{ padding: "6px", textAlign: "right" }}>{rs2(it.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", borderTop: "1.5px solid #c01d5a" }}>
                      <td colSpan={3} style={{ padding: "8px", textAlign: "right" }}>GRAND TOTAL</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{rs2(printBillObj.grand)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ padding: "10px", fontStyle: "italic", fontSize: "11px", borderTop: "1px solid #ccc" }}>
                  Amount in words: {printBillObj.words}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading invoices...</div>}>
      <BillsContent />
    </Suspense>
  );
}
