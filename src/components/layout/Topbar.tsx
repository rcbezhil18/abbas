"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Zap, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Topbar({ title, subtitle, onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#09070c]/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/billing/new"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Bill</span>
        </Link>

        <Link
          href="/billing/quick"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-card text-amber-400 hover:text-amber-300 text-xs font-bold hover:border-amber-500/40 transition-all"
        >
          <Zap className="w-4 h-4 fill-amber-400/20" />
          <span className="hidden md:inline">Quick Bill</span>
        </Link>

        {user ? (
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-slate-300 hover:text-rose-400 text-xs font-semibold hover:border-rose-500/30 transition-all"
            title="Logout Owner"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-slate-300 text-xs font-semibold">
            <User className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Owner Access</span>
          </div>
        )}
      </div>
    </header>
  );
}
