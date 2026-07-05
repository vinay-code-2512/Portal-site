"use client";

import { motion } from "framer-motion";
import type { DailyHour } from "@/hooks/useWeeklyStats";

interface WeeklyOverviewProps {
  dailyHours: DailyHour[];
  weekTotal: number;
}

export default function WeeklyOverview({ dailyHours, weekTotal }: WeeklyOverviewProps) {
  const maxHours = Math.max(...dailyHours.map((d) => d.hours), 0.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-300">This Week</h3>
        <p className="text-lg font-bold text-white tabular-nums">{weekTotal}h</p>
      </div>

      <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
        {dailyHours.map((d) => {
          const heightPercent = (d.hours / maxHours) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <span className="text-[10px] text-zinc-500 tabular-nums">{d.hours.toFixed(1)}</span>
              <div
                className={`w-full rounded-lg transition-all duration-300 min-h-[4px] ${
                  d.isToday
                    ? "bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-light)] shadow-[0_0_12px_var(--color-primary-glow)]"
                    : "bg-white/[0.06]"
                }`}
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />
              <span className={`text-[10px] font-medium ${d.isToday ? "text-[var(--color-primary-light)]" : "text-zinc-500"}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
