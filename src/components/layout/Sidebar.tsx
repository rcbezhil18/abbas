"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Receipt, 
  Zap, 
  FileText, 
  ListOrdered, 
  Send, 
  Hash, 
  Package, 
  Truck, 
  Users, 
  Wrench, 
  ShieldCheck, 
  UserCheck, 
  ShoppingBag, 
  Wallet, 
  BarChart3, 
  Settings,
  BookOpen,
  Store,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Day Close", href: "/dayclose", icon: CalendarCheck },
    ],
  },
  {
    label: "Billing",
    items: [
      { name: "New Bill", href: "/billing/new", icon: Receipt },
      { name: "Quick Bill", href: "/billing/quick", icon: Zap },
      { name: "Quotes", href: "/quotes", icon: FileText },
      { name: "Bills Register", href: "/bills", icon: ListOrdered },
      { name: "Delivery Challan", href: "/challan", icon: Send },
      { name: "IMEI Log", href: "/imei", icon: Hash },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Inventory", href: "/inventory", icon: Package },
      { name: "Purchases", href: "/purchases", icon: ShoppingBag },
      { name: "Suppliers", href: "/suppliers", icon: Users },
      { name: "Services / Repairs", href: "/services", icon: Wrench },
      { name: "Warranty", href: "/warranty", icon: ShieldCheck },
      { name: "Customers", href: "/customers", icon: UserCheck },
      { name: "Outsource Items", href: "/outsource", icon: Truck },
      { name: "Expenses", href: "/expenses", icon: Wallet },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "SOP Manual", href: "/sop", icon: BookOpen },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#09070c] border-r border-white/10 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl glass-card p-1 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-900/20 group-hover:scale-105 transition-all">
              <img src="/icon.png" alt="Abbas Cell Park Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-extrabold text-white font-heading text-base leading-tight tracking-tight group-hover:text-rose-300 transition-colors">
                Abbas Cellpark
              </h2>
              <span className="text-[9px] font-semibold tracking-wider text-rose-400 uppercase block">
                Multi Branded Sales & Service
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </h3>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-900/30"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Store className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="truncate">
              <p className="text-slate-200 font-medium truncate">GSTIN: 33ADZPA7749N1ZQ</p>
              <p className="text-[10px] text-slate-500">Offline Cache & Firestore Sync</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
