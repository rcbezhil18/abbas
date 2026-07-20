"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/ui/StatCard";
import { useData } from "@/context/DataContext";
import { rs, rs2, fmtDate, todayISO, toCSV, download } from "@/lib/utils";
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, ShieldAlert, Users } from "lucide-react";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { bills, services, expenses, purchases, mobiles, accessories, spareParts, usedPhones } = useData();

  const setPreset = (preset: string) => {
    const t = todayISO();
    const d = new Date();
    if (preset === "today") {
      setFromDate(t);
      setToDate(t);
    } else if (preset === "week") {
      const w = new Date(d);
      w.setDate(d.getDate() - 6);
      setFromDate(w.toISOString().slice(0, 10));
      setToDate(t);
    } else if (preset === "month") {
      setFromDate(t.slice(0, 8) + "01");
      setToDate(t);
    } else {
      setFromDate("");
      setToDate("");
    }
  };

  const inRange = (dStr: string) => {
    if (fromDate && dStr < fromDate) return false;
    if (toDate && dStr > toDate) return false;
    return true;
  };

  const filteredBills = bills.filter((b) => !b.void && inRange(b.date));
  const cashBills = filteredBills.filter((b) => b.type === "cash");
  const nonTaxBills = filteredBills.filter((b) => b.type === "nontax");
  const taxBills = filteredBills.filter((b) => b.type === "tax");

  const sumGrand = (arr: any[]) => arr.reduce((s, b) => s + (b.grand || 0), 0);
  const sumGst = (arr: any[]) => arr.reduce((s, b) => s + (b.gst || 0), 0);

  const deliveredServices = services.filter((s) => s.status === "Delivered" && inRange(s.date));
  const serviceIncome = deliveredServices.reduce((s, j) => s + (j.charge || 0), 0);
  const serviceProfit = deliveredServices.reduce((s, j) => s + (j.charge - j.partCost), 0);

  const filteredExpenses = expenses.filter((e) => inRange(e.date));
  const totalExp = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const filteredPurchases = purchases.filter((p) => inRange(p.date));
  const totalPurchases = filteredPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);

  const realizedProfit = filteredBills.filter((b) => b.costKnown).reduce((s, b) => s + (b.profit || 0), 0);
  const netProfit = realizedProfit + serviceProfit - totalExp;

  // Sales by Category
  const byType: { [key: string]: { count: number; value: number } } = {
    mobile: { count: 0, value: 0 },
    accessory: { count: 0, value: 0 },
    service: { count: 0, value: 0 },
  };

  filteredBills.forEach((b) => {
    const k = b.saleType || "mobile";
    if (byType[k]) {
      byType[k].count += 1;
      byType[k].value += b.grand || 0;
    }
  });

  // Top Selling Items
  const itemSalesMap: { [key: string]: { model: string; qty: number; value: number } } = {};
  filteredBills.forEach((b) => {
    b.items.forEach((it) => {
      const name = (it.model || "Item").trim();
      if (!itemSalesMap[name]) {
        itemSalesMap[name] = { model: name, qty: 0, value: 0 };
      }
      itemSalesMap[name].qty += it.qty || 1;
      itemSalesMap[name].value += it.amount || 0;
    });
  });

  const topSelling = Object.values(itemSalesMap).sort((a, b) => b.value - a.value).slice(0, 8);

  // Rate-wise GST Summary
  const gstRateMap: { [key: number]: { rate: number; taxable: number; cgst: number; sgst: number; igst: number; total: number } } = {};
  filteredBills.filter((b) => b.gst > 0).forEach((b) => {
    const r = b.rate || 18;
    if (!gstRateMap[r]) {
      gstRateMap[r] = { rate: r, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    }
    gstRateMap[r].taxable += b.taxable || 0;
    gstRateMap[r].cgst += b.cgst || 0;
    gstRateMap[r].sgst += b.sgst || 0;
    gstRateMap[r].igst += b.igst || 0;
    gstRateMap[r].total += b.grand || 0;
  });

  const gstRateSummary = Object.values(gstRateMap);

  const exportGstCSV = () => {
    const rows = [["GST Rate", "Taxable Value", "CGST", "SGST", "IGST", "Invoice Total"]];
    gstRateSummary.forEach((r) => {
      rows.push([`${r.rate}%`, r.taxable.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), r.igst.toFixed(2), r.total.toFixed(2)]);
    });
    download(`gst-rate-summary-${todayISO()}.csv`, toCSV(rows), "text/csv");
  };

  return (
    <AppLayout title="Reports & Business Analytics" subtitle="Financial P&L, sales breakdowns, GST filing helpers & top items">
      <div className="space-y-6">
        {/* Preset Toolbar */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">From:</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">To:</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs" />
            </div>
          </div>

          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5 text-xs font-bold">
            <button onClick={() => setPreset("today")} className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">Today</button>
            <button onClick={() => setPreset("week")} className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">7 Days</button>
            <button onClick={() => setPreset("month")} className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">This Month</button>
            <button onClick={() => setPreset("all")} className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">All Time</button>
          </div>
        </div>

        {/* Stats Grid 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Cash Bills" value={rs(sumGrand(cashBills))} subtext={`${cashBills.length} bill(s)`} icon={DollarSign} color="magenta" />
          <StatCard label="Non-Tax Invoices" value={rs(sumGrand(nonTaxBills))} subtext={`${nonTaxBills.length} invoice(s)`} icon={DollarSign} color="amber" />
          <StatCard label="Tax Invoices" value={rs(sumGrand(taxBills))} subtext={`${taxBills.length} invoice(s)`} icon={DollarSign} color="blue" />
          <StatCard label="Total GST Payable" value={rs(sumGst(filteredBills))} subtext="CGST + SGST + IGST" icon={TrendingUp} color="green" />
        </div>

        {/* Stats Grid 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Net Profit" value={rs(netProfit)} subtext="Sales + Service profit − Expenses" icon={TrendingUp} color="green" />
          <StatCard label="Service Profit" value={rs(serviceProfit)} subtext={`Service income ${rs(serviceIncome)}`} icon={TrendingUp} color="blue" />
          <StatCard label="Operating Expenses" value={rs(totalExp)} subtext="Total in date range" icon={ShieldAlert} color="amber" />
          <StatCard label="Stock Purchased" value={rs(totalPurchases)} subtext="Cash out on purchases" icon={DollarSign} color="magenta" />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <h3 className="font-bold text-white font-heading text-sm pb-3 border-b border-white/10 mb-4">
              Top Selling Products / Models
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Item / Model</th>
                    <th className="py-2.5 px-3 text-center">Qty Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {topSelling.length ? (
                    topSelling.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-white">{it.model}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-300">{it.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-white">{rs(it.value)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-500">No sales recorded in date range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GST Filing Helper */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="font-bold text-white font-heading text-sm">GST Filing Summary</h3>
                <button
                  onClick={exportGstCSV}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">GST Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Invoice Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium font-mono">
                    {gstRateSummary.length ? (
                      gstRateSummary.map((r, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 text-rose-300 font-bold">{r.rate}%</td>
                          <td className="py-2.5 px-3 text-right text-slate-200">{rs2(r.taxable)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{rs2(r.cgst)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{rs2(r.sgst)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">{rs2(r.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-sans">No GST taxable sales in date range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic mt-4 pt-3 border-t border-white/5">
              Rate-wise GST totals calculated for GSTR-1 / GSTR-3B monthly filing reference.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
