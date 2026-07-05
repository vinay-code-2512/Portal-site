"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { getAttendanceForDateRange } from "@/lib/adminAttendance";
import { getLocalDateString } from "@/lib/format";

interface DayData {
  date: string;
  day: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  total: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export default function MonthlyCalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const first = getLocalDateString(new Date(year, month, 1));
    const last = getLocalDateString(new Date(year, month + 1, 0));

    async function fetch() {
      setLoading(true);
      try {
        const data = await getAttendanceForDateRange(first, last);
        if (!cancelled) setRecords(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const days = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const today = getLocalDateString(new Date());
    const result: DayData[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({
        date: "",
        day: 0,
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        total: 0,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = getLocalDateString(new Date(year, month, d));
      const dayRecords = records.filter((r) => r.date === dateStr);
      const present = dayRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
      const late = dayRecords.filter((r: any) => r.status === "late").length;
      const halfDay = dayRecords.filter((r: any) => r.status === "half-day").length;
      result.push({
        date: dateStr,
        day: d,
        present,
        late,
        absent: dayRecords.filter((r: any) => r.status === "absent").length,
        halfDay,
        total: dayRecords.length,
        isToday: dateStr === today,
        isCurrentMonth: true,
      });
    }

    return result;
  }, [records, year, month]);

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)]">
            <CalendarRange className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
              Monthly Attendance Heatmap
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              Attendance rate distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/35 hover:bg-white/60 text-zinc-600 hover:text-[var(--color-primary)] border border-[var(--border-light)]/40 transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-800 font-extrabold min-w-[130px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/35 hover:bg-white/60 text-zinc-600 hover:text-[var(--color-primary)] border border-[var(--border-light)]/40 transition-all cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((wd) => (
              <div
                key={wd}
                className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider text-center py-1.5"
              >
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              if (!day.isCurrentMonth) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const rate = day.total > 0 ? day.present / day.total : 0;
              let bgStyle = "bg-white/20 border border-[var(--border-light)]/30";

              if (day.isToday) {
                bgStyle = "bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)]/20";
              } else if (day.total > 0) {
                if (rate >= 0.9) {
                  bgStyle = "bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/30";
                } else if (rate >= 0.6) {
                  bgStyle = "bg-[var(--color-primary-light)]/15 border border-[var(--color-primary-light)]/25 hover:bg-[var(--color-primary-light)]/25";
                } else {
                  bgStyle = "bg-[var(--color-primary-glow)]/10 border border-[var(--color-primary-glow)]/20 hover:bg-[var(--color-primary-glow)]/20";
                }
              }

              return (
                <div
                  key={day.date}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 p-1 text-[10px] transition-all duration-200 cursor-default ${bgStyle}`}
                >
                  <span
                    className={`font-extrabold leading-none ${
                      day.isToday
                        ? "text-[var(--color-primary)]"
                        : day.total > 0
                        ? "text-zinc-800"
                        : "text-zinc-400"
                    }`}
                  >
                    {day.day}
                  </span>

                  {day.total > 0 ? (
                    <div className="flex items-center gap-0.5">
                      {day.present > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"
                          title={`${day.present} Present`}
                        />
                      )}
                      {day.late > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)]"
                          title={`${day.late} Late`}
                        />
                      )}
                      {day.halfDay > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]"
                          title={`${day.halfDay} Half Day`}
                        />
                      )}
                      {day.absent > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#E4E2FF]"
                          title={`${day.absent} Absent`}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="w-1 h-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Indicators Legend */}
          <div className="flex items-center justify-center flex-wrap gap-4 mt-5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider border-t border-[var(--border-light)]/40 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30" />
              <span>&gt;= 90% Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[var(--color-primary-light)]/15 border border-[var(--color-primary-light)]/25" />
              <span>60-90% Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[var(--color-primary-glow)]/10 border border-[var(--color-primary-glow)]/20" />
              <span>&lt; 60% Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)]" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4E2FF]" />
              <span>Absent</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
