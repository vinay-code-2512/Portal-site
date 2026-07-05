"use client";

import type { MonthlyStats } from "@/hooks/useAttendance";

interface MonthlyStatsBarProps {
  stats: MonthlyStats | null;
}

export default function MonthlyStatsBar({ stats }: MonthlyStatsBarProps) {
  if (!stats) return null;

  const items = [
    { label: "Present", value: stats.present, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Late", value: stats.late, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Absent", value: stats.absent, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Half Day", value: stats.halfDay, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary-dim)]" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="hrms-glass rounded-[16px] p-4 text-center relative overflow-hidden">
          <div className={`absolute inset-0 ${item.bg}`} />
          <p className={`relative text-xl sm:text-2xl font-bold ${item.color} tabular-nums`}>{item.value}</p>
          <p className="relative text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
