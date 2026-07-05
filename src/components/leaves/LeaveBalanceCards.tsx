"use client";

import { motion } from "framer-motion";
import { Umbrella, HeartPulse, Briefcase, AlertTriangle } from "lucide-react";
import type { LeaveBalanceMap, LeaveType } from "@/lib/leaves";
import { LEAVE_TYPE_LABELS } from "@/lib/leaves";

const TYPE_ICONS: Record<LeaveType, typeof Umbrella> = {
  casual: Umbrella,
  sick: HeartPulse,
  paid: Briefcase,
  emergency: AlertTriangle,
};

const TYPE_COLORS: Record<LeaveType, string> = {
  casual: "text-emerald-500",
  sick: "text-amber-500",
  paid: "text-[var(--color-primary)]",
  emergency: "text-red-500",
};

const STROKE_COLORS: Record<LeaveType, string> = {
  casual: "#10B981",
  sick: "#F59E0B",
  paid: "var(--color-primary, #5B4CFF)",
  emergency: "#EF4444",
};

interface LeaveBalanceCardsProps {
  balances: LeaveBalanceMap;
}

export default function LeaveBalanceCards({ balances }: LeaveBalanceCardsProps) {
  const types = Object.keys(balances) as LeaveType[];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {types.map((type, i) => {
        const b = balances[type];
        const Icon = TYPE_ICONS[type];
        const color = TYPE_COLORS[type];
        const strokeColor = STROKE_COLORS[type];
        const pct = b.available > 0 ? (b.used / b.available) * 100 : 0;
        const radius = 34;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;

        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#111827]">{LEAVE_TYPE_LABELS[type]}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">
                    {b.remaining} remaining
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-3">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700"
                    style={{ opacity: pct > 0 ? 1 : 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-[#111827] tabular-nums">{b.remaining}</span>
                  <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Left</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--border-light)]/50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#111827] tabular-nums">{b.used}</p>
                <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Used</p>
              </div>
              <div className="w-px h-8 bg-[var(--border-light)]/50" />
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#111827] tabular-nums">{b.available}</p>
                <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Total</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
