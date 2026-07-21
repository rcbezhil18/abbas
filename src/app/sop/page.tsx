"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useData } from "@/context/DataContext";
import { fmtDate, todayISO } from "@/lib/utils";
import { 
  BookOpen, 
  Printer, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Store, 
  Zap, 
  Wrench, 
  Package, 
  BarChart3, 
  UserCheck, 
  User, 
  Crown, 
  CreditCard, 
  AlertTriangle,
  ClipboardList
} from "lucide-react";

interface RoleDefinition {
  id: string;
  name: string;
  badge: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  primaryGoal: string;
  modulesUsed: string[];
  checklist: string[];
  dosAndDonts: { do: string; dont: string }[];
}

export default function SopPage() {
  const { settings } = useData();
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");

  const handleDownloadPdf = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const roles: RoleDefinition[] = [
    {
      id: "owner",
      name: "Store Owner / Shop Manager",
      badge: "MANAGEMENT & AUDIT",
      icon: Crown,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      primaryGoal: "Oversee overall shop revenue, cash drawer reconciliation, tax compliance, supplier ledgers & operational integrity.",
      modulesUsed: ["Dashboard", "Day Close", "Reports (GST)", "Settings", "Expenses", "Suppliers & Purchases"],
      checklist: [
        "Authenticate portal at store opening using Owner PIN.",
        "Review previous day cash drawer reconciliation and sign physical Day Close sheet.",
        "Audit low-stock inventory warnings and authorize supplier purchase orders.",
        "Audit monthly GSTR-1 / GSTR-3B tax reports before 10th of every month.",
        "Perform full JSON database backup in Settings weekly.",
      ],
      dosAndDonts: [
        { do: "Reconcile physical cash drawer with system Expected Drawer Cash daily.", dont: "Never leave Owner PIN unattended or shared with unverified staff." },
        { do: "Verify purchase unit costs before approving new inward inventory.", dont: "Do not allow sales without a generated Date-Coded invoice." },
      ],
    },
    {
      id: "billing",
      name: "Sales Executive & Billing Counter Staff",
      badge: "FRONT DESK & SALES",
      icon: CreditCard,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      primaryGoal: "Fast, accurate customer checkout, mandatory IMEI recording, trade-in processing, and dues collection.",
      modulesUsed: ["New Bill", "Quick Bill", "Bills Register", "Quotes", "Delivery Challan", "Customers Directory"],
      checklist: [
        "Greeting walk-in retail customers and identifying device requirements.",
        "Select correct Invoice Type (Cash Bill, Tax Invoice 18%, or Non-Tax).",
        "Record 15-digit IMEI number for all mobile phone sales for warranty validation.",
        "Process customer trade-ins by entering model, trade-in value, and checking 'Add to Used Stock'.",
        "Issue printed A4 Tax Invoice / 58mm Thermal Receipt or send PDF via WhatsApp.",
      ],
      dosAndDonts: [
        { do: "Always double-check customer mobile number and IMEI before finalizing bill.", dont: "Never override automated Date-Coded bill numbering (YYYYMMDD-001)." },
        { do: "Select exact payment mode (Cash, UPI, Card) for every transaction.", dont: "Do not issue credit/dues without recording customer address and mobile." },
      ],
    },
    {
      id: "technician",
      name: "Service & Repair Technician",
      badge: "SERVICE CENTER",
      icon: Wrench,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      primaryGoal: "Receive damaged devices, record diagnostic notes, track repair status lifecycle, and convert delivered jobs to invoices.",
      modulesUsed: ["Services / Repairs", "Spare Parts Inventory", "Outsource Items", "Warranty Tracker"],
      checklist: [
        "Create Service Job Sheet for every incoming repair device with diagnostic notes.",
        "Update repair status strictly in sequence: Received -> In Progress -> Ready -> Delivered.",
        "Log spare part consumption cost and supplier source for accurate repair margin tracking.",
        "Perform post-repair quality testing (touchscreen, mic, speaker, charging, IMEI).",
        "Click 1-Click Invoice on delivered jobs to hand over device to billing counter.",
      ],
      dosAndDonts: [
        { do: "Test customer device in front of customer before accepting for repair.", dont: "Do not hand over repaired phone to customer without collecting payment or logging dues." },
        { do: "Record customer passcode and physical scratch/damage condition on job sheet.", dont: "Do not replace major components without prior customer cost confirmation." },
      ],
    },
    {
      id: "inventory",
      name: "Inventory & Stock Manager",
      badge: "STOCK CONTROL",
      icon: Package,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      primaryGoal: "Maintain accurate 4-split inventory levels, log inward vendor purchases, verify supplier invoices, and conduct stock audits.",
      modulesUsed: ["Inventory (4-Split)", "Purchases", "Suppliers", "IMEI Log"],
      checklist: [
        "Inward new stock across 4 categories: Mobiles, Accessories, Spare Parts, and Used Phones.",
        "Log Vendor Purchases on Purchases page with invoice number and cost prices.",
        "Affix barcode / IMEI stickers on newly arrived mobile phone boxes.",
        "Conduct weekly physical stock audits against system inventory counts.",
        "Alert Store Owner when fast-moving accessories or spare parts drop below Qty < 2.",
      ],
      dosAndDonts: [
        { do: "Ensure purchase cost is recorded accurately for gross margin calculations.", dont: "Never manually edit stock counts without documenting physical audit reason." },
        { do: "Verify Used Phone trade-in stock received from billing counter daily.", dont: "Do not mix spare parts with retail accessories in inventory categories." },
      ],
    },
  ];

  const sopSections = [
    {
      id: "sec-1",
      code: "SOP-01",
      title: "Daily Store Opening & Register Day-Start Procedure",
      category: "Store Management",
      roleId: "owner",
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
      roleId: "billing",
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
      roleId: "inventory",
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
      roleId: "technician",
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
      roleId: "billing",
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
      id: "sec-6",
      code: "SOP-06",
      title: "Day Close Cash Reconciliation & Closing Procedure",
      category: "Financial Control",
      roleId: "owner",
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
      roleId: "owner",
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
      (activeRole === "all" || s.roleId === activeRole) &&
      (s.title + s.code + s.steps.join(" ") + s.category)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const filteredRoles = roles.filter((r) => activeRole === "all" || r.id === activeRole);

  return (
    <AppLayout title="Role-Wise Standard Operating Procedures (SOP)" subtitle="Official store operating manual, role responsibilities, daily checklists & PDF export">
      <div className="space-y-6">
        {/* Controls Bar & Role Selector Tabs */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SOP procedure, keyword, role..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Download SOP Manual (PDF)</span>
            </button>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveRole("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeRole === "all"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "glass-card text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>All Store Roles</span>
            </button>

            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isActive
                      ? `${r.bgColor} ${r.color} ${r.borderColor} shadow-md`
                      : "glass-card text-slate-400 hover:text-white border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{r.name}</span>
                </button>
              );
            })}
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
                  DOCUMENT CONTROL ID: SOP-ACP-2026-V2 (ROLE-BASED)
                </span>
                <h2 className="text-xl font-extrabold text-white font-heading mt-1">
                  ABBAS CELLPARK — ROLE-WISE STANDARD OPERATING PROCEDURE
                </h2>
                <p className="text-xs text-slate-400">
                  Multi Branded Mobile Sales & Services · 114, Palakkad Main Road, Pollachi - 642 001
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="glass-card px-3.5 py-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">EFFECTIVE DATE</span>
                <span className="font-bold text-white">21/07/2026</span>
              </div>
              <div className="glass-card px-3.5 py-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">REVISION</span>
                <span className="font-bold text-emerald-400">v2.0 Role-Wise</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Role-Specific Operational Guidelines</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Daily Start & End of Day Checklists</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Date-Coded Invoicing (YYYYMMDD-XXX)</span>
            </div>
          </div>
        </div>

        {/* Role Responsibility Overview Cards */}
        <div className="space-y-6">
          {filteredRoles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className={`glass-card rounded-2xl p-6 border ${r.borderColor} space-y-5 relative overflow-hidden`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${r.bgColor} ${r.color} border ${r.borderColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono font-bold ${r.color} tracking-wider uppercase`}>{r.badge}</span>
                      <h3 className="text-lg font-extrabold text-white font-heading">{r.name}</h3>
                    </div>
                  </div>
                </div>

                {/* Goal */}
                <div className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                  <span className="font-bold text-white block mb-0.5">Primary Operational Goal:</span>
                  {r.primaryGoal}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Daily Routine Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Daily Routine Checklist</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {r.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className={`w-4 h-4 rounded-full ${r.bgColor} ${r.color} flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5`}>
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Modules Used & Compliance */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">ERP Modules Managed</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {r.modulesUsed.map((mod, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg glass-card text-xs text-slate-200 border border-white/10 font-medium">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>Role Mandatory Do's & Don'ts</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        {r.dosAndDonts.map((dd, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                              <span className="font-bold">✓ DO:</span> {dd.do}
                            </div>
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                              <span className="font-bold">✗ DON'T:</span> {dd.dont}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SOP Detailed Execution Procedures */}
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-extrabold text-white font-heading flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <span>Detailed Execution Procedures ({filteredSections.length})</span>
          </h3>

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
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Step-by-Step Instructions</h4>
                    <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside font-medium">
                      {sec.steps.map((st, idx) => (
                        <li key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 leading-relaxed">
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
      </div>

      {/* Hidden Printable Official Role-Wise SOP Document */}
      <div id="printArea">
        <div style={{ width: "190mm", margin: "0 auto", padding: "16px", color: "#000", fontFamily: "sans-serif", fontSize: "11px" }}>
          <div style={{ border: "2px solid #c01d5a", borderRadius: "6px", padding: "20px" }}>
            {/* Printable Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #c01d5a", paddingBottom: "12px", marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src="/logo-original.png" alt="Abbas Cellpark Logo" style={{ height: "65px", objectFit: "contain", marginBottom: "6px" }} />
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#c01d5a", letterSpacing: "1px" }}>ROLE-WISE STANDARD OPERATING PROCEDURE (SOP) MANUAL</div>
              <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>114, Palakkad Main Road, Opp. Bus Stand, Pollachi - 642 001 · GSTIN: 33ADZPA7749N1ZQ</div>
            </div>

            {/* Metadata Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "10px" }}>
              <tbody>
                <tr style={{ background: "#fbeef3", border: "1px solid #c01d5a" }}>
                  <td style={{ padding: "6px" }}><b>Doc ID:</b> SOP-ACP-2026-V2</td>
                  <td style={{ padding: "6px" }}><b>Effective Date:</b> 21/07/2026</td>
                  <td style={{ padding: "6px" }}><b>Revision:</b> v2.0 (Role-Wise)</td>
                  <td style={{ padding: "6px" }}><b>Scope:</b> All Store Roles</td>
                </tr>
              </tbody>
            </table>

            {/* Role Responsibilities Summary */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ background: "#c01d5a", color: "#fff", padding: "6px 10px", fontWeight: "bold", fontSize: "12px", borderRadius: "3px" }}>
                1. ROLE RESPONSIBILITY MATRIX & DAILY CHECKLISTS
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", fontSize: "10px" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa", borderBottom: "1.5px solid #c01d5a" }}>
                    <th style={{ padding: "6px", textAlign: "left", width: "30%" }}>Role & Primary Goal</th>
                    <th style={{ padding: "6px", textAlign: "left", width: "40%" }}>Daily Routine Checklist</th>
                    <th style={{ padding: "6px", textAlign: "left", width: "30%" }}>Mandatory Do's & Don'ts</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                      <td style={{ padding: "6px" }}>
                        <b style={{ color: "#c01d5a" }}>{r.name}</b>
                        <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>{r.primaryGoal}</div>
                      </td>
                      <td style={{ padding: "6px" }}>
                        <ul style={{ margin: 0, paddingLeft: "14px" }}>
                          {r.checklist.map((c, cIdx) => (
                            <li key={cIdx} style={{ marginBottom: "2px" }}>{c}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ padding: "6px" }}>
                        {r.dosAndDonts.map((dd, ddIdx) => (
                          <div key={ddIdx} style={{ marginBottom: "4px" }}>
                            <div style={{ color: "#080" }}><b>✓ DO:</b> {dd.do}</div>
                            <div style={{ color: "#c00" }}><b>✗ DON'T:</b> {dd.dont}</div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sections */}
            <div style={{ background: "#c01d5a", color: "#fff", padding: "6px 10px", fontWeight: "bold", fontSize: "12px", borderRadius: "3px", marginBottom: "10px" }}>
              2. DETAILED PROCEDURE EXECUTION STEPS
            </div>

            {sopSections.map((sec, idx) => (
              <div key={idx} style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
                <div style={{ background: "#fbeef3", borderLeft: "4px solid #c01d5a", padding: "5px 8px", fontWeight: "bold", fontSize: "11px" }}>
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
