import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: "magenta" | "blue" | "green" | "amber" | "red";
}

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = "magenta",
}: StatCardProps) {
  const colorMap = {
    magenta: "border-l-rose-500 text-rose-400 bg-rose-500/10",
    blue: "border-l-blue-500 text-blue-400 bg-blue-500/10",
    green: "border-l-emerald-500 text-emerald-400 bg-emerald-500/10",
    amber: "border-l-amber-500 text-amber-400 bg-amber-500/10",
    red: "border-l-red-500 text-red-400 bg-red-500/10",
  };

  return (
    <div
      className={`glass-card rounded-xl p-5 border-l-4 ${colorMap[color].split(" ")[0]} flex items-center justify-between relative overflow-hidden group hover:border-r hover:border-r-white/20 transition-all`}
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">
          {value}
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${colorMap[color].split(" ").slice(1).join(" ")}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
