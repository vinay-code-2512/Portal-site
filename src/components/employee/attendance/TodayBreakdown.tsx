"use client";

import { motion } from "framer-motion";
import { Clock, Coffee, Timer } from "lucide-react";
import type { AttendanceRecord } from "@/hooks/useAttendance";

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface TodayBreakdownProps {
  todayRecord: AttendanceRecord | null;
  currentWorkMs: number;
  currentBreakMs: number;
}

export default function TodayBreakdown({ todayRecord, currentWorkMs, currentBreakMs }: TodayBreakdownProps) {
  if (!todayRecord) return null;

  let grossMs = 0;
  if (todayRecord.checkIn) {
    const checkInTime = todayRecord.checkIn.toDate();
    const endTime = todayRecord.checkOut?.toDate() || new Date();
    grossMs = endTime.getTime() - checkInTime.getTime();
  }

  const completedBreakMs = todayRecord.breaks?.reduce((sum: number, b: any) => {
    if (b.end) return sum + (b.end.toDate().getTime() - b.start.toDate().getTime());
    return sum;
  }, 0) || 0;

  const hasOpenBreak = todayRecord.breaks?.some((b: any) => !b.end);
  const totalBreakMs = completedBreakMs + (hasOpenBreak ? currentBreakMs : 0);
  const netMs = Math.max(0, currentWorkMs);

  const stats = [
    { icon: <Clock className="w-4 h-4" />, label: "Gross Hours", value: formatMs(grossMs), color: "text-[var(--color-primary-light)]" },
    { icon: <Coffee className="w-4 h-4" />, label: "Break Time", value: formatMs(totalBreakMs), color: "text-amber-400" },
    { icon: <Timer className="w-4 h-4" />, label: "Net Hours", value: formatMs(netMs), color: "text-emerald-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Today&apos;s Breakdown</h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="hrms-glass rounded-[16px] p-4 text-center">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
