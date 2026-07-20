"use client";

import React from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/ui/StatCard";
import { useData } from "@/context/DataContext";
import { rs, fmtDate, todayISO } from "@/lib/utils";
import { 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  AlertTriangle, 
  Plus, 
  Zap, 
  Package, 
  Wrench, 
  BarChart3, 
  Printer, 
  Clock,
  ArrowUpRight
} from "lucide-react";

export default function DashboardPage() {
  const { bills, mobiles, accessories, spareParts, usedPhones, services } = useData();

  const today = todayISO();
  const activeBills = bills.filter((b) => !b.void);
  const todayBills = activeBills.filter((b) => b.date === today);
  const todaySales = todayBills.reduce((s, b) => s + (b.grand || 0), 0);
  const totalSales = activeBills.reduce((s, b) => s + (b.grand || 0), 0);
  const totalGst = activeBills.reduce((s, b) => s + (b.gst || 0), 0);
  const dues = activeBills.reduce((s, b) => s + (Number(b.balance) || 0), 0);
  const duesCount = activeBills.filter((b) => (Number(b.balance) || 0) > 0).length;

  const allInventory = [
    ...mobiles.map((m) => ({ ...m, categoryName: "Mobiles" })),
    ...accessories.map((a) => ({ ...a, categoryName: "Accessories" })),
    ...spareParts.map((s) => ({ ...s, categoryName: "Spare Parts" })),
    ...usedPhones.map((u) => ({ ...u, categoryName: "Used Phones" })),
  ];

  const lowStock = allInventory.filter((i) => Number(i.qty) > 0 && Number(i.qty) <= 2).length;
  const outStock = allInventory.filter((i) => Number(i.qty) <= 0).length;
  const pendingRepairs = services.filter((s) => s.status !== "Delivered").length;

  const recentBills = [...activeBills]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  return (
    <AppLayout title="Dashboard" subtitle="Real-time shop metrics & daily sales at a glance">
      <div className="space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Sales"
            value={rs(todaySales)}
            subtext={`${todayBills.length} bill(s) raised today`}
            icon={DollarSign}
            color="magenta"
          />
          <StatCard
            label="Total Sales"
            value={rs(totalSales)}
            subtext={`${activeBills.length} bill(s) all-time`}
            icon={ShoppingBag}
            color="blue"
          />
          <StatCard
            label="GST Collected"
            value={rs(totalGst)}
            subtext="CGST + SGST + IGST"
            icon={Receipt}
            color="green"
          />
          <StatCard
            label="Stock Alerts"
            value={lowStock + outStock}
            subtext={`${lowStock} low · ${outStock} out of stock`}
            icon={AlertTriangle}
            color="amber"
          />
        </div>

        {/* Dues Banner */}
        {dues > 0.5 && (
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-rose-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Outstanding Customer Dues</h4>
                <p className="text-xs text-slate-400">
                  <span className="text-rose-400 font-mono font-bold">{rs(dues)}</span> balance due across {duesCount} invoice(s)
                </p>
              </div>
            </div>
            <Link
              href="/customers"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>View Customer Dues</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Main Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bills Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/10 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-heading">Recent Invoices</h3>
                <p className="text-xs text-slate-400">Latest sales transactions recorded</p>
              </div>
              <Link
                href="/billing/new"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>New Bill</span>
              </Link>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-semibold">Bill No.</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {recentBills.length ? (
                    recentBills.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-rose-400">{b.billNo}</td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3 text-slate-200">{b.customer.name || "—"}</td>
                        <td className="py-3 px-3 text-slate-400">{fmtDate(b.date)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {rs(b.grand)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/bills?print=${b.id}`}
                            className="p-1.5 inline-flex rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No bills created yet. Click "New Bill" to raise your first invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Launchpad & Live Status */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-5 border border-white/10">
              <h3 className="text-base font-bold text-white font-heading mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <Link
                  href="/billing/new"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all group"
                >
                  <div className="p-2 rounded-lg bg-rose-600 text-white shadow-md">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold group-hover:text-rose-300">Raise New Bill</p>
                    <p className="text-[10px] text-slate-400">Cash Bill, GST Tax & Non-Tax Invoice</p>
                  </div>
                </Link>

                <Link
                  href="/billing/quick"
                  className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.04] text-amber-300 font-semibold text-xs transition-all group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold group-hover:text-amber-300">Quick Bill</p>
                    <p className="text-[10px] text-slate-400">Fast capture for walk-in items</p>
                  </div>
                </Link>

                <Link
                  href="/inventory"
                  className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.04] text-slate-300 font-semibold text-xs transition-all group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold group-hover:text-blue-300">Manage Inventory</p>
                    <p className="text-[10px] text-slate-400">Mobiles, Accessories, Spares, Used</p>
                  </div>
                </Link>

                <Link
                  href="/services"
                  className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.04] text-slate-300 font-semibold text-xs transition-all group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold group-hover:text-emerald-300">
                      Service / Repair Jobs
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {pendingRepairs} job(s) currently open
                    </p>
                  </div>
                </Link>

                <Link
                  href="/reports"
                  className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.04] text-slate-300 font-semibold text-xs transition-all group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold group-hover:text-purple-300">Sales Reports</p>
                    <p className="text-[10px] text-slate-400">GST filings, profit, & analytics</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
