"use client";

import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, TrendingDown, Wallet, Gift } from "lucide-react";

interface SalaryBreakdownProps {
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
}

export default function SalaryBreakdown({
  basicSalary, allowances, bonuses, deductions, netSalary,
}: SalaryBreakdownProps) {
  const grossTotal = basicSalary + allowances + bonuses;
  const maxVal = Math.max(grossTotal, netSalary, 1);

  const items = [
    { label: "Basic Pay", amount: basicSalary, icon: Wallet, color: "bg-[var(--color-primary)]", textColor: "text-[var(--color-primary)]" },
    { label: "HRA & Allowances", amount: allowances, icon: IndianRupee, color: "bg-[var(--color-primary-light)]", textColor: "text-[var(--color-primary-light)]" },
    { label: "Bonus", amount: bonuses, icon: Gift, color: "bg-emerald-500", textColor: "text-emerald-600" },
    { label: "Tax & Deductions", amount: -deductions, icon: TrendingDown, color: "bg-rose-500", textColor: "text-rose-600" },
  ];

  const deductionItems = [
    { label: "Tax", amount: Math.round(deductions * 0.6), color: "bg-rose-400" },
    { label: "PF", amount: Math.round(deductions * 0.3), color: "bg-amber-400" },
    { label: "Other", amount: Math.round(deductions * 0.1), color: "bg-zinc-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
          <IndianRupee className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Salary Breakdown</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Detailed compensation structure</p>
        </div>
      </div>

      {/* Income Progress Bars */}
      <div className="space-y-3.5 mb-5">
        {items.map((item) => {
          const pct = Math.min(Math.abs(item.amount) / maxVal * 100, 100);
          const isNeg = item.amount < 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <item.icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                  <span className="text-zinc-500 font-semibold">{item.label}</span>
                </div>
                <span className={`font-bold tabular-nums ${isNeg ? "text-rose-600" : "text-[#111827]"}`}>
                  {isNeg ? "–" : "+"} ₹{Math.abs(item.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/30 border border-[var(--border-light)]/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deductions Breakdown */}
      {deductions > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
          <h4 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5">Deductions Breakdown</h4>
          <div className="space-y-2">
            {deductionItems.map((d) => {
              const pct = Math.min((d.amount / maxVal) * 100, 100);
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-zinc-500 font-semibold">{d.label}</span>
                    <span className="font-bold text-zinc-700 tabular-nums">₹{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Net Salary */}
      <div className="pt-4 border-t border-[var(--border-light)]/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-[#111827]">Net Salary</span>
            <span className="text-[9px] text-zinc-400 font-bold block">Take-home pay</span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-[var(--color-primary)] tabular-nums">
          ₹{netSalary.toLocaleString("en-IN")}
        </span>
      </div>
    </motion.div>
  );
}
