"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/ui/StatCard";
import { useData } from "@/context/DataContext";
import { rs, rs2, fmtDate, todayISO } from "@/lib/utils";
import { CalendarCheck, Printer, DollarSign, Wallet, Receipt, CreditCard } from "lucide-react";

export default function DayClosePage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const { bills, payments, services, expenses, settings } = useData();

  const activeBills = bills.filter((b) => !b.void && b.date === selectedDate);
  const dayPayments = payments.filter((p) => p.date === selectedDate);

  const modeTotals: { [key: string]: number } = { Cash: 0, UPI: 0, Card: 0 };
  let totalReceived = 0;

  // 1. Collect initial invoice payments raised on this date
  activeBills.forEach((b) => {
    const amt = Number(b.paid) || 0;
    if (amt > 0) {
      const m = b.payMode || "Cash";
      modeTotals[m] = (modeTotals[m] || 0) + amt;
      totalReceived += amt;
    }
  });

  // 2. Collect subsequent dues payments recorded on this date
  dayPayments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (amt > 0) {
      const m = p.mode || "Cash";
      modeTotals[m] = (modeTotals[m] || 0) + amt;
      totalReceived += amt;
    }
  });

  const grossSales = activeBills.reduce((s, b) => s + (b.grand || 0), 0);
  const totalGst = activeBills.reduce((s, b) => s + (b.gst || 0), 0);
  const duesLeft = activeBills.reduce((s, b) => s + (Number(b.balance) || 0), 0);

  const serviceIncome = services
    .filter((s) => s.status === "Delivered" && s.date === selectedDate)
    .reduce((s, j) => s + (j.charge || 0), 0);

  const dayExpenses = expenses
    .filter((e) => e.date === selectedDate)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const expectedDrawerCash = (modeTotals["Cash"] || 0) + serviceIncome - dayExpenses;

  const handlePrintDayClose = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <AppLayout title="Day Close Cash Reconciliation" subtitle="End-of-day register tally, drawer cash calculation & daily summary">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            onClick={handlePrintDayClose}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Day Close Sheet</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bills Raised" value={activeBills.length} subtext={fmtDate(selectedDate)} icon={Receipt} color="magenta" />
          <StatCard label="Gross Sales" value={rs(grossSales)} subtext={`Includes GST ${rs(totalGst)}`} icon={DollarSign} color="blue" />
          <StatCard label="Total Received" value={rs(totalReceived + serviceIncome)} subtext="Payments + Delivered Service" icon={Wallet} color="green" />
          <StatCard label="Dues Outstanding" value={rs(duesLeft)} subtext="From today's invoices" icon={CreditCard} color="amber" />
        </div>

        {/* Tally Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
              Money Received (By Payment Mode)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-300 font-semibold">Cash Collected</span>
                <span className="font-mono font-bold text-white text-sm">{rs(modeTotals["Cash"] || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-300 font-semibold">UPI Digital Payments</span>
                <span className="font-mono font-bold text-white text-sm">{rs(modeTotals["UPI"] || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-300 font-semibold">Card Swipe Payments</span>
                <span className="font-mono font-bold text-white text-sm">{rs(modeTotals["Card"] || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-300 font-semibold">Service Income (Delivered Jobs)</span>
                <span className="font-mono font-bold text-white text-sm">{rs(serviceIncome)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-bold text-emerald-300 text-sm">
                <span>Total Received Today</span>
                <span className="font-mono text-base">{rs(totalReceived + serviceIncome)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
                <span>Less: Expenses Paid Today</span>
                <span className="font-mono font-bold">-{rs(dayExpenses)}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold text-base shadow-lg shadow-rose-900/30">
                <span>Expected Drawer Cash Balance</span>
                <span className="font-mono text-xl">{rs(expectedDrawerCash)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-heading pb-3 border-b border-white/10">
              Invoices Raised on {fmtDate(selectedDate)} ({activeBills.length})
            </h3>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Bill No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeBills.length ? (
                    activeBills.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{b.billNo}</td>
                        <td className="py-2.5 px-3 text-slate-200">{b.customer.name || "—"}</td>
                        <td className="py-2.5 px-3 text-slate-400">{b.payMode}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{rs(b.grand)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No invoices raised on this date.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Printable Day Close Summary Sheet */}
      <div id="printArea">
        <div style={{ width: "190mm", margin: "0 auto", padding: "16px", color: "#000", fontFamily: "sans-serif", fontSize: "12px" }}>
          <div style={{ border: "2px solid #c01d5a", borderRadius: "6px", padding: "16px" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #c01d5a", paddingBottom: "10px", marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/logo-original.png" alt="Abbas Cellpark Logo" style={{ height: "60px", objectFit: "contain", marginBottom: "4px" }} />
              <div style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", margin: "4px 0", color: "#c01d5a" }}>DAILY CASH RECONCILIATION & DAY CLOSE SHEET</div>
              <div style={{ fontSize: "11px", color: "#444" }}>Date: {fmtDate(selectedDate)} · Pollachi Branch</div>
            </div>

            <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "8px", color: "#c01d5a" }}>1. SALES & BILLING SUMMARY</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
              <thead>
                <tr style={{ background: "#fbeef3", borderBottom: "1.5px solid #c01d5a" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Metric / Register Indicator</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Total Invoices Raised Today</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{activeBills.length} Bills</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Gross Sales Volume</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{rs2(grossSales)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>GST Tax Portion Collected</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>{rs2(totalGst)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Customer Dues Outstanding (Unpaid)</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#c01d5a", fontWeight: "bold" }}>{rs2(duesLeft)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "8px", color: "#c01d5a" }}>2. CASH DRAWER & MONEY RECEIVED BREAKDOWN</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Cash Collected (Counter Bills + Dues)</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{rs2(modeTotals["Cash"] || 0)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>UPI Digital Payments</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{rs2(modeTotals["UPI"] || 0)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Card Swipe Payments</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{rs2(modeTotals["Card"] || 0)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Service / Repair Income (Delivered)</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{rs2(serviceIncome)}</td>
                </tr>
                <tr style={{ borderBottom: "1.5px solid #c01d5a", background: "#fbeef3" }}>
                  <td style={{ padding: "8px", fontWeight: "bold" }}>TOTAL MONEY RECEIVED TODAY</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "14px" }}>{rs2(totalReceived + serviceIncome)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>Less: Shop Expenses Paid Today</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#d97706", fontWeight: "bold" }}>-{rs2(dayExpenses)}</td>
                </tr>
                <tr style={{ background: "#c01d5a", color: "#fff", fontWeight: "bold" }}>
                  <td style={{ padding: "10px", fontSize: "14px" }}>NET EXPECTED DRAWER CASH BALANCE</td>
                  <td style={{ padding: "10px", textAlign: "right", fontSize: "16px" }}>{rs2(expectedDrawerCash)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "8px", color: "#c01d5a" }}>3. INVOICES RAISED TODAY LOG ({activeBills.length})</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #ccc", fontSize: "11px" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Bill No</th>
                  <th style={{ padding: "6px", textAlign: "left" }}>Customer Name</th>
                  <th style={{ padding: "6px", textAlign: "center" }}>Mode</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Grand Total</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Paid</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "11px" }}>
                {activeBills.length ? (
                  activeBills.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "6px", fontWeight: "bold" }}>{b.billNo}</td>
                      <td style={{ padding: "6px" }}>{b.customer.name || "—"}</td>
                      <td style={{ padding: "6px", textAlign: "center" }}>{b.payMode}</td>
                      <td style={{ padding: "6px", textAlign: "right" }}>{rs2(b.grand)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontWeight: "bold" }}>{rs2(b.paid)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "#888" }}>No invoices raised on this date.</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", paddingTop: "20px", borderTop: "1.5px dashed #c01d5a" }}>
              <div><b>Owner Signature:</b> ___________________________</div>
              <div><b>Generated On:</b> {new Date().toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
