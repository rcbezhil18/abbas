"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useData } from "@/context/DataContext";
import { fmtDate } from "@/lib/utils";
import { Hash, Search, Printer } from "lucide-react";
import Link from "next/link";

export default function ImeiLogPage() {
  const { bills, mobiles, usedPhones } = useData();
  const [search, setSearch] = useState("");

  const imeiRows: any[] = [];

  // Extract from billed items
  bills.forEach((b) => {
    if (b.void) return;
    b.items.forEach((it) => {
      [it.imei1, it.imei2, it.battery].forEach((code, idx) => {
        if (code && String(code).trim()) {
          imeiRows.push({
            code: String(code).trim(),
            typeLabel: ["IMEI 1", "IMEI 2", "Battery"][idx],
            model: it.model,
            custName: b.customer.name,
            custMobile: b.customer.mobile,
            billNo: b.billNo,
            billId: b.id,
            status: "Sold",
            date: b.date,
          });
        }
      });
    });
  });

  // Extract from active Mobiles inventory
  mobiles.forEach((m) => {
    if (m.imei && String(m.imei).trim() && Number(m.qty) > 0) {
      imeiRows.push({
        code: String(m.imei).trim(),
        typeLabel: "Mobile Inventory",
        model: `${m.brand} ${m.model}`,
        custName: m.supplierName || "In Stock",
        custMobile: "",
        billNo: "In Stock",
        billId: "",
        status: "In Stock",
        date: "",
      });
    }
  });

  // Extract from active Used Phones inventory
  usedPhones.forEach((u) => {
    if (u.imei && String(u.imei).trim() && Number(u.qty) > 0) {
      imeiRows.push({
        code: String(u.imei).trim(),
        typeLabel: "Used Phone Stock",
        model: `${u.brand} ${u.model}`,
        custName: u.supplierName || "Trade-in / Stock",
        custMobile: "",
        billNo: "In Stock",
        billId: "",
        status: "In Stock",
        date: "",
      });
    }
  });

  const filtered = imeiRows.filter(
    (r) =>
      (r.code + r.model + (r.custName || "") + (r.custMobile || "") + r.billNo)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="IMEI / Serial Master Log" subtitle="Search every IMEI or serial number recorded in sales & inventory">
      <div className="space-y-6">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IMEI, serial, device model, customer..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all font-mono"
          />
        </div>

        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">IMEI / Serial</th>
                  <th className="py-3.5 px-4 font-semibold">Tag</th>
                  <th className="py-3.5 px-4 font-semibold">Model</th>
                  <th className="py-3.5 px-4 font-semibold">Customer / Vendor</th>
                  <th className="py-3.5 px-4 font-semibold">Bill No</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filtered.length ? (
                  filtered.map((r, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-sm">{r.code}</td>
                      <td className="py-3.5 px-4 text-slate-400">{r.typeLabel}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{r.model}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{r.custName || "—"}</div>
                        {r.custMobile && <div className="font-mono text-[11px] text-slate-400">{r.custMobile}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === "In Stock" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {r.billNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{r.date ? fmtDate(r.date) : "—"}</td>
                      <td className="py-3.5 px-4 text-right">
                        {r.billId ? (
                          <Link
                            href={`/bills?print=${r.billId}`}
                            className="p-1.5 inline-flex rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No IMEI or serial numbers logged yet.
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
