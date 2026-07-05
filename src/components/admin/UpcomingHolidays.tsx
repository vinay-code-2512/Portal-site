"use client";

import { motion } from "framer-motion";
import { Calendar, CalendarDays, Loader2 } from "lucide-react";
import type { Holiday } from "@/hooks/useHolidays";

interface UpcomingHolidaysProps {
  holidays: Holiday[];
  loading?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function UpcomingHolidays({ holidays, loading }: UpcomingHolidaysProps) {
  const displayed = holidays.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Upcoming Holidays
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-6">
          Public &amp; company holidays
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-xs">Loading holidays...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <CalendarDays className="w-8 h-8 opacity-40 mb-2" />
          <p className="text-xs">No upcoming holidays</p>
        </div>
      ) : (
        <div className="relative pl-1 flex-1">
          <div className="absolute left-[15px] top-2 bottom-6 w-[2px] bg-[var(--color-primary)]/20" />

          <div className="space-y-4">
            {displayed.map((h) => (
              <div key={h.id || h.date} className="relative pl-9 group">
                <div className="absolute left-0 top-[1.5px] w-8 h-8 rounded-full bg-white border border-[var(--border-light)] shadow-[0_2px_8px_rgba(91,76,255,0.06)] flex items-center justify-center z-10 transition-transform duration-200 group-hover:scale-110 group-hover:border-[var(--color-primary-light)]">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-primary-light)]" />
                </div>
                <div className="flex items-center justify-between transition-all duration-200 group-hover:translate-x-0.5">
                  <span className="text-[11px] text-[#111827] font-semibold leading-snug">
                    {h.name}
                  </span>
                  <span className="text-[9.5px] text-zinc-400 font-medium tabular-nums ml-2 whitespace-nowrap">
                    {formatDate(h.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
