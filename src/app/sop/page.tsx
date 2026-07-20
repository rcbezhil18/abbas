"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useData } from "@/context/DataContext";
import { fmtDate, todayISO } from "@/lib/utils";
import { BookOpen, Download, Printer, Search, ShieldCheck, CheckCircle2, FileText, Store, Zap, Wrench, Package, BarChart3 } from "lucide-react";

export default function SopPage() {
  const { settings } = useData();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleDownloadPdf = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const sopSections = [
    {
      id: "sec-1",
      code: "SOP-01",
      title: "Daily Opening & Register Day-Start Procedure",
      category: "Store Management",
      icon: Store,
      steps: [
        "Store Manager/Owner logs into ERP Portal at https://abbascell.web.app using Owner PIN (Default: 1234).",
        "Verify Dashboard KPIs: Check previous day sales summary, low-stock inventory alerts, and pending repair jobs.",
        "Inspect Cash Drawer: Count physical opening cash and verify zero discrepancy against previous Day Close sheet.",
        "Check system status indicator at bottom left: Confirm 'Offline Cache & Firestore Sync' is active.",
      ],
      rules: [
        "Never share Owner PIN with unauthorized personnel.",
        "Do not commence new sales if previous day close sheet was not generated.",
      ],
    },
    {
      id: "sec-2",
      code: "SOP-02",
      title: "Counter Sales, Billing & Date-Coded Numbering",
      category: "Billing Operations",
      icon: Zap,
      steps: [
        "Select Invoice Type: Choose Cash Bill (Retail), Tax Invoice (GST 18%), or Non-Tax Invoice based on buyer request.",
        "Enter Customer Information: Full Name and 10-digit Mobile Number. For B2B Tax Invoices, enter Buyer GSTIN & Place of Supply.",
        "Stock Picking: Use 'Pick from Stock' modal to search and select item. Quantity is automatically deducted from active inventory.",
        "Device Trade-in Exchange: If customer exchanges a device, check 'Customer is trading in a device', enter model, agreed trade-in value, and check 'Add to Used Phones Stock'.",
        "Date-Coded Bill Numbering: System automatically assigns sequential YYYYMMDD-001 format (e.g. 20260720-001 for 1st bill of the day).",
        "Print & Issue: Click 'Save & Print Invoice' to generate A4 Tax Invoice / 58mm Thermal Receipt, or click 'Share on WhatsApp'.",
      ],
      rules: [
        "For Mobile sales, recording IMEI/Serial number (15 digits) is MANDATORY for warranty tracking.",
        "Ensure payment mode (Cash, UPI, Card) is accurately selected before saving.",
      ],
    },
    {
      id: "sec-3",
      code: "SOP-03",
      title: "4-Split Inventory & Inward Stock Purchases",
      category: "Inventory Management",
      icon: Package,
      steps: [
        "Stock Categorization: Maintain strict separation across 4 categories — Mobiles, Accessories, Spare Parts, and Used Phones.",
        "Inward Stock Purchase: Go to Purchases page -> Select Supplier -> Select Category -> Enter Brand, Model, Purchase Cost, Retail Sell Price, and Qty.",
        "Auto-Stock Increment: Saving an inward purchase automatically increases available quantity in the corresponding inventory category.",
        "Low Stock Warnings: Monitor red stock alert badges on Dashboard and Inventory tabs for items with Qty < 2.",
      ],
      rules: [
        "Purchase Cost must be entered accurately for realized net profit calculations.",
        "Used Phones acquired via customer trade-ins automatically inherit agreed trade-in cost.",
      ],
    },
    {
      id: "sec-4",
      code: "SOP-04",
      title: "Repair / Service Job Sheet Lifecycle",
      category: "Service Center",
      icon: Wrench,
      steps: [
        "Job Receipt: Go to Services page -> Click 'New Repair Job' -> Enter Customer Name, Mobile, Device Model, Issue, and Estimated Charge.",
        "Status Workflow: Update job status as work progresses: Received -> In Progress -> Ready -> Delivered.",
        "Spare Part Tracking: Record spare part cost and vendor source for margin analysis (Service Profit = Charge - Part Cost).",
        "One-Click Billing: When status reaches 'Delivered', click the Receipt icon to instantly load job details into New Bill builder.",
      ],
      rules: [
        "Customer phone passcode and condition remarks must be recorded in diagnostic notes.",
        "Delivered service income automatically tallies into Day Close cash drawer totals.",
      ],
    },
    {
      id: "sec-5",
      code: "SOP-05",
      title: "Customer Dues & Ledger Settlement",
      category: "Accounts Receivable",
      icon: FileText,
      steps: [
        "Dues Tracking: View customer balance dues on Dashboard, Customers Directory, and Bills Register.",
        "Dues Collection: Go to Customers Directory or Bills Register -> Click 'Collect Dues' icon -> Enter Amount Received & Payment Mode.",
        "Oldest-First Settlement: System automatically applies payment to the oldest unpaid invoices first.",
        "Customer Ledger: Click 'View History' on customer row to audit full purchase ledger and payment receipts.",
      ],
      rules: [
        "Partial payments must be recorded on the same date received to maintain accurate Day Close tally.",
      ],
    },
    {
      id: "sec-[#6]",
      code: "SOP-06",
      title: "Day Close Cash Reconciliation & Closing Procedure",
      category: "Financial Control",
      icon: ShieldCheck,
      steps: [
        "Access Day Close Module: Go to Day Close page -> Select Date (default today).",
        "Verify Tally: Review Total Bills Raised, Gross Sales Volume, and Payment Mode Breakdown (Cash, UPI, Card, Service Income).",
        "Count Physical Cash: Match physical drawer cash against Expected Drawer Cash Balance (Cash Collected + Service Income - Expenses).",
        "Print & Sign: Click 'Print Day Close Sheet' to generate official PDF closing summary. Store Manager signs physical copy.",
      ],
      rules: [
        "Day Close sheet MUST be printed and filed daily at shop closing.",
        "Any cash shortage or excess > ₹100 must be documented in Day Close audit notes.",
      ],
    },
    {
      id: "sec-7",
      code: "SOP-07",
      title: "GST Filing & Financial Reports Export",
      category: "Tax Compliance",
      icon: BarChart3,
      steps: [
        "Navigate to Reports page -> Set date preset (Today, 7 Days, This Month, Custom Date Range).",
        "Review Rate-Wise GST Summary: Check Taxable Value, CGST (9%), SGST (9%), IGST (18%), and Gross Total.",
        "Export CSV: Click 'Export CSV' to download GSTR-1 / GSTR-3B monthly filing reference spreadsheet.",
        "P&L Audit: Review Realized Net Profit = Sales Margin + Service Profit - Shop Operating Expenses.",
      ],
      rules: [
        "GST reports must be cross-verified with monthly tax filings before 10th of every month.",
      ],
    },
  ];

  const filteredSections = sopSections.filter(
    (s) =>
      (activeTab === "all" || s.category.toLowerCase().includes(activeTab.toLowerCase())) &&
      (s.title + s.code + s.steps.join(" ") + s.category)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Standard Operating Procedures (SOP)" subtitle="Official store operating manual, workflow guidelines & PDF export">
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SOP procedure, keyword, section..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Download SOP Manual (PDF)</span>
            </button>
          </div>
        </div>

        {/* SOP Header Metadata Card */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl glass-card p-2 border border-rose-500/30 flex items-center justify-center shadow-xl shadow-rose-900/20 bg-black/40 shrink-0">
                <img src="/icon.png" alt="Abbas Cellpark Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  DOCUMENT CONTROL ID: SOP-ACP-2026-V1
                </span>
                <h2 className="text-xl font-extrabold text-white font-heading mt-1">
                  ABBAS CELLPARK — STANDARD OPERATING PROCEDURE
                </h2>
                <p className="text-xs text-slate-400">
                  Multi Branded Mobile Sales & Services · 114, Palakkad Main Road, Pollachi - 642 001
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="glass-card px-3.5 py-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">EFFECTIVE DATE</span>
                <span className="font-bold text-white">20/07/2026</span>
              </div>
              <div className="glass-card px-3.5 py-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">VERSION</span>
                <span className="font-bold text-emerald-400">1.0 (PROD)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real-time Firebase Firestore Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Date-Coded Numbering Standard (YYYYMMDD-XXX)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4-Split Inventory & GST GSTR-1 Compliance</span>
            </div>
          </div>
        </div>

        {/* SOP Sections List */}
        <div className="space-y-6">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.id} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-rose-400">{sec.code} · {sec.category}</span>
                      <h3 className="text-base font-bold text-white font-heading">{sec.title}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Standard Execution Steps</h4>
                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside font-medium">
                    {sec.steps.map((st, idx) => (
                      <li key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 leading-relaxed">
                        <span>{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {sec.rules && sec.rules.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                    <h5 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      <span>Mandatory Compliance Rules</span>
                    </h5>
                    <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-0.5">
                      {sec.rules.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden Printable Official SOP Document */}
      <div id="printArea">
        <div style={{ width: "190mm", margin: "0 auto", padding: "16px", color: "#000", fontFamily: "sans-serif", fontSize: "11px" }}>
          <div style={{ border: "2px solid #c01d5a", borderRadius: "6px", padding: "20px" }}>
            {/* Printable Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #c01d5a", paddingBottom: "12px", marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/logo-original.png" alt="Abbas Cellpark Logo" style={{ height: "65px", objectFit: "contain", marginBottom: "6px" }} />
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#c01d5a", letterSpacing: "1px" }}>STANDARD OPERATING PROCEDURE (SOP) MANUAL</div>
              <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>114, Palakkad Main Road, Opp. Bus Stand, Pollachi - 642 001 · GSTIN: 33ADZPA7749N1ZQ</div>
            </div>

            {/* Metadata Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "10px" }}>
              <tbody>
                <tr style={{ background: "#fbeef3", border: "1px solid #c01d5a" }}>
                  <td style={{ padding: "6px" }}><b>Doc ID:</b> SOP-ACP-2026-V1</td>
                  <td style={{ padding: "6px" }}><b>Effective Date:</b> 20/07/2026</td>
                  <td style={{ padding: "6px" }}><b>Version:</b> 1.0 (Production)</td>
                  <td style={{ padding: "6px" }}><b>Target:</b> All Shop Personnel</td>
                </tr>
              </tbody>
            </table>

            {/* Sections */}
            {sopSections.map((sec, idx) => (
              <div key={idx} style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
                <div style={{ background: "#c01d5a", color: "#fff", padding: "6px 10px", fontWeight: "bold", fontSize: "12px", borderRadius: "3px" }}>
                  {sec.code} — {sec.title.toUpperCase()} ({sec.category})
                </div>
                <ol style={{ paddingLeft: "18px", marginTop: "6px", marginBottom: "6px", lineHeight: "1.5" }}>
                  {sec.steps.map((st, sIdx) => (
                    <li key={sIdx} style={{ marginBottom: "3px" }}>{st}</li>
                  ))}
                </ol>
                {sec.rules && sec.rules.length > 0 && (
                  <div style={{ background: "#fff0f3", borderLeft: "3px solid #c01d5a", padding: "6px", fontSize: "10px", color: "#900" }}>
                    <b>Compliance Rules:</b> {sec.rules.join(" | ")}
                  </div>
                )}
              </div>
            ))}

            {/* Document Approval Signatures */}
            <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1.5px dashed #c01d5a", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <div>
                <p><b>Prepared & Approved By:</b></p>
                <p style={{ marginTop: "30px" }}>_______________________________</p>
                <p>Store Owner / Authorized Signatory</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p><b>Store Seal & Date:</b></p>
                <p style={{ marginTop: "30px" }}>_______________________________</p>
                <p>Abbas Cellpark, Pollachi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
