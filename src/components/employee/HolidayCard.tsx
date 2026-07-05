"use client";

import { motion } from "framer-motion";
import { Sparkles, CalendarX } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { Holiday } from "@/hooks/useHolidays";

interface HolidayCardProps {
  holidays: Holiday[];
  loading?: boolean;
}

export default function HolidayCard({ holidays, loading }: HolidayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="hrms-glass rounded-[20px] p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary-light)]" />
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          Upcoming Holidays
        </p>
      </div>

      {!loading && holidays.length === 0 ? (
        <EmptyState
          icon={<CalendarX className="w-6 h-6" />}
          title="No upcoming holidays"
        />
      ) : (
        <div className="space-y-2.5">
          {holidays.map((h) => (
            <div
              key={h.id || h.date}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
            >
              <span className="text-sm text-zinc-300">{h.name}</span>
              <span className="text-[11px] text-zinc-500 font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5">
                {h.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
