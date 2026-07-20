"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { Bill } from "@/types";
import { Users, Search, Wallet, Eye, Download } from "lucide-react";

export default function CustomersPage() {
  const { bills, recordPayment, logAudit } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [duesModalCust, setDuesModalCust] = useState<any>(null);
  const [collectAmt, setCollectAmt] = useState("");
  const [collectMode, setCollectMode] = useState("Cash");

  // Derive aggregated customer directory from active bills
  const customerMap: { [key: string]: any } = {};
  bills.filter((b) => !b.void).forEach((b) => {
    const key = (b.customer.mobile || "").trim() || `n:${(b.customer.name || "").trim().toLowerCase()}`;
    if (!key || key === "n:") return;

    if (!customerMap[key]) {
      customerMap[key] = {
        name: b.customer.name || "Customer",
        mobile: b.customer.mobile || "",
        address: b.customer.address || "",
        billsCount: 0,
        spent: 0,
        balance: 0,
        lastVisit: b.date,
        billIds: [],
      };
    }

    const c = customerMap[key];
    c.billsCount += 1;
    c.spent += b.grand || 0;
    c.balance += Number(b.balance) || 0;
    c.billIds.push(b.id);
    if (b.date > c.lastVisit) c.lastVisit = b.date;
    if (b.customer.name && !c.name) c.name = b.customer.name;
  });

  const customerList = Object.values(customerMap).sort((a, b) => b.spent - a.spent);

  const filtered = customerList.filter((c) =>
    (c.name + c.mobile).toLowerCase().includes(search.toLowerCase())
  );

  const handleCollectDuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duesModalCust) return;
    let amt = Number(collectAmt) || 0;
    if (amt <= 0) {
      toast("Enter amount greater than 0", "error");
      return;
    }

    // Find unpaid bills for customer, sorted oldest first
    const custDueBills = duesModalCust.billIds
      .map((id: string) => bills.find((b) => b.id === id))
      .filter((b: Bill | undefined) => b && !b.void && (Number(b.balance) || 0) > 0)
      .sort((a: Bill, b: Bill) => a.date.localeCompare(b.date));

    let applied = 0;
    for (const b of custDueBills) {
      if (amt <= 0) break;
      const take = Math.min(amt, Number(b.balance) || 0);
      if (take <= 0) continue;

      await recordPayment({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        billId: b.id,
        billNo: b.billNo,
        customerName: duesModalCust.name,
        customerMobile: duesModalCust.mobile,
        amount: take,
        mode: collectMode,
        date: todayISO(),
        createdAt: Date.now(),
      });

      b.paid = (Number(b.paid) || 0) + take;
      b.balance = Math.max(0, (Number(b.balance) || 0) - take);

      amt -= take;
      applied += take;
    }

    await logAudit("Customer Dues Settled", `${duesModalCust.name} · ${rs(applied)} · ${collectMode}`);
    setDuesModalCust(null);
    toast(`Successfully settled ${rs(applied)} in dues`, "success");
  };

  const custHistoryBills = selectedCust
    ? selectedCust.billIds.map((id: string) => bills.find((b) => b.id === id)).filter(Boolean)
    : [];

  return (
    <AppLayout title="Customers Directory" subtitle="Customer profiles, purchase ledgers, and dues collection">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name or mobile..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                  <th className="py-3.5 px-4 font-semibold">Mobile</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Invoices</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Spent</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Outstanding Dues</th>
                  <th className="py-3.5 px-4 font-semibold">Last Visit</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{c.name}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-300">{c.mobile || "—"}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">{c.billsCount}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{rs(c.spent)}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${c.balance > 0 ? "text-rose-400" : "text-slate-400"}`}>
                        {c.balance > 0 ? rs(c.balance) : "Clear"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{fmtDate(c.lastVisit)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.balance > 0 && (
                            <button
                              onClick={() => { setDuesModalCust(c); setCollectAmt(String(c.balance)); }}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10"
                              title="Settle Dues"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCust(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title="View Customer History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No customer profiles found. Customer directory updates automatically when bills are raised.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dues Collection Modal */}
      <Modal isOpen={!!duesModalCust} onClose={() => setDuesModalCust(null)} title={`Collect Dues: ${duesModalCust?.name}`}>
        <form onSubmit={handleCollectDuesSubmit} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400">Total Outstanding Balance: <b className="font-mono text-rose-400 text-base">{rs(duesModalCust?.balance || 0)}</b></p>
            <p className="text-[11px] text-slate-500 mt-1">Payment automatically applies to the oldest unpaid invoices first.</p>
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
            <button type="button" onClick={() => setDuesModalCust(null)} className="px-4 py-2 rounded-xl glass-card text-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Record Settlement</button>
          </div>
        </form>
      </Modal>

      {/* Customer History Modal */}
      <Modal isOpen={!!selectedCust} onClose={() => setSelectedCust(null)} title={`Customer Ledger: ${selectedCust?.name || ""}`}>
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 glass-card p-4 rounded-xl border border-white/10">
            <div>
              <p className="text-slate-400">Mobile:</p>
              <p className="font-mono text-rose-300 font-bold">{selectedCust?.mobile || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Spent:</p>
              <p className="font-mono text-white font-bold">{rs(selectedCust?.spent || 0)}</p>
            </div>
          </div>

          <h4 className="font-bold text-white">Purchase History ({custHistoryBills.length})</h4>
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Bill No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {custHistoryBills.map((b: Bill) => (
                  <tr key={b.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{b.billNo}</td>
                    <td className="py-2.5 px-3 text-slate-400">{fmtDate(b.date)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white">{rs(b.grand)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${b.balance > 0 ? "text-rose-400" : "text-slate-400"}`}>
                      {b.balance > 0 ? rs(b.balance) : "Clear"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => setSelectedCust(null)} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold">Close</button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
