"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useData } from "@/context/DataContext";
import { rs, fmtDate, addMonths, daysBetween, todayISO } from "@/lib/utils";
import { ShieldCheck, Search, Printer } from "lucide-react";
import Link from "next/link";

export default function WarrantyPage() {
  const { bills } = useData();
  const [search, setSearch] = useState("");

  const today = todayISO();

  // Extract warranty records from all active bills
  const warrantyRecords: any[] = [];
  bills
    .filter((b) => !b.void && Number(b.warrantyMonths) > 0)
    .forEach((b) => {
      b.items.forEach((it) => {
        const code = (it.imei1 || it.imei2 || "").trim();
        if (!code) return;

        const expiry = addMonths(b.date, b.warrantyMonths);
        const daysRemaining = daysBetween(today, expiry);
        const isActive = daysRemaining >= 0;

        warrantyRecords.push({
          code,
          model: it.model,
          custName: b.customer.name,
          custMobile: b.customer.mobile,
          soldDate: b.date,
          months: b.warrantyMonths,
          expiry,
          daysRemaining,
          isActive,
          billNo: b.billNo,
          billId: b.id,
        });
      });
    });

  const filtered = warrantyRecords.filter(
    (r) =>
      (r.code + r.model + r.custName + (r.custMobile || "") + r.billNo)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Warranty Register" subtitle="Coverage status by IMEI/Serial, customer name & purchase date">
      <div className="space-y-6">
        {/* Search Toolbar */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IMEI, model, customer, bill no..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
          />
        </div>

        {/* Warranty Register Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">IMEI / Serial</th>
                  <th className="py-3.5 px-4 font-semibold">Device Model</th>
                  <th className="py-3.5 px-4 font-semibold">Customer Details</th>
                  <th className="py-3.5 px-4 font-semibold">Purchase Date</th>
                  <th className="py-3.5 px-4 font-semibold">Expiry Date</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((r, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{r.code}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{r.model}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{r.custName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{r.custMobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{fmtDate(r.soldDate)}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-white font-bold">{fmtDate(r.expiry)}</div>
                        <div className="text-[10px] text-slate-400">{r.months} Months Warranty</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            r.isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {r.isActive ? `Active · ${r.daysRemaining}d left` : "Expired"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/bills?print=${r.billId}`}
                          className="px-3 py-1.5 rounded-lg glass-card hover:bg-white/10 text-rose-300 text-[11px] font-mono font-bold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{r.billNo}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No warranty records found matching search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
