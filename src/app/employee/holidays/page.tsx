"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchHolidays } from "@/lib/holidays";
import type { Holiday } from "@/lib/holidays";
import HolidayCard from "@/components/employee/HolidayCard";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function EmployeeHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHolidays();
        if (!cancelled) setHolidays(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load holidays");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const holidaysByDate: Record<string, Holiday[]> = {};
  for (const h of holidays) {
    if (!holidaysByDate[h.date]) holidaysByDate[h.date] = [];
    holidaysByDate[h.date].push(h);
  }

  // Upcoming and recent holidays (for the list card)
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter(h => h.date >= today.toISOString().slice(0, 10)).slice(0, 15);

  const monthHolidays = holidays.filter(h => h.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pt-6 sm:pt-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-[0_0_16px_var(--color-primary-glow)] shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-primary)] uppercase tracking-wider font-semibold">Employee / Holidays</p>
          <h1 className="text-xl font-bold mt-0.5">
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
              Upcoming Holidays
            </span>
          </h1>
        </div>
      </div>

      <div className="max-w-xl">
        <HolidayCard holidays={upcoming} loading={loading} />
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">Holiday Calendar</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{MONTHS[month]} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-white/70 border border-[var(--border-light)]/50 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-white/70 border border-[var(--border-light)]/50 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-[10px] font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Holiday
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
            Today
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-[9px] text-zinc-400 text-center font-bold py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayHolidays = holidaysByDate[dateStr] || [];
            const isToday = dateStr === today.toISOString().slice(0, 10);

            return (
              <div
                key={day}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] transition-all ${
                  isToday
                    ? "bg-[var(--color-primary-dim)] ring-1 ring-[var(--color-primary)]/30"
                    : dayHolidays.length > 0
                      ? "bg-emerald-50 hover:bg-emerald-100"
                      : "hover:bg-white/40"
                }`}
                title={dayHolidays.map(h => h.name).join(", ")}
              >
                <span className={`font-bold ${
                  isToday ? "text-[var(--color-primary)]" :
                  dayHolidays.length > 0 ? "text-emerald-600" : "text-zinc-500"
                }`}>
                  {day}
                </span>
                {dayHolidays.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-emerald-500" />
                )}
              </div>
            );
          })}
        </div>

        {/* Holiday list for this month */}
        {monthHolidays.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-light)]/50 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {MONTHS[month]} {year} &middot; {monthHolidays.length} holiday{monthHolidays.length !== 1 ? "s" : ""}
              </span>
            </div>
            {monthHolidays.map((h) => (
              <div key={h.id || h.date} className="flex items-center gap-2.5 text-[11px] text-zinc-500 py-1">
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                <span className="font-bold text-zinc-700">{h.name}</span>
                <span className="text-zinc-400">{h.date}</span>
                {h.type && (
                  <>
                    <span className="text-zinc-400">&middot;</span>
                    <span className="text-zinc-400">{h.type}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
