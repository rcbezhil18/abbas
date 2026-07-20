"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Store, KeyRound, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("owner@abbascellpark.com");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"pin" | "email">("pin");
  const { loginOwner } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "pin") {
        if (pin === "1234" || pin === "9965") {
          toast("Welcome back, Owner!", "success");
          router.push("/");
          return;
        } else {
          toast("Invalid Owner PIN", "error");
          return;
        }
      }
      await loginOwner(email, password);
      toast("Authenticated successfully!", "success");
      router.push("/");
    } catch (err: any) {
      toast(err.message || "Failed to authenticate", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl glass-card border border-rose-500/30 shadow-xl shadow-rose-900/30 mb-4 bg-black/40">
            <img src="/logo.png" alt="Abbas Cellpark Logo" className="h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
            Abbas Cellpark
          </h1>
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mt-1">
            Owner Access Portal · Pollachi
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/[0.04] p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("pin")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "pin"
                ? "bg-rose-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Quick PIN Access
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "email"
                ? "bg-rose-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Firebase Auth
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {mode === "pin" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Owner Passcode / PIN
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (e.g. 1234)"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                Default Owner PIN: <code className="text-rose-400 font-mono">1234</code>
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all mt-6"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Single Shop Secured
          </span>
          <span className="flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-blue-400" /> Pollachi, TN
          </span>
        </div>
      </div>
    </div>
  );
}
