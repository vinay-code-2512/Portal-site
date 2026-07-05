"use client";

import { motion } from "framer-motion";
import { CalendarDays, CalendarOff } from "lucide-react";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

interface LeaveCalendarProps {
  requests: LeaveRequest[];
  loading?: boolean;
}

export default function LeaveCalendar({ requests, loading }: LeaveCalendarProps) {
  const approved = requests.filter((r) => r.status === "approved");

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-white/[0.04] rounded-xl" />
        ))}
      </div>
    );
  }

  if (approved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CalendarOff className="w-8 h-8 text-zinc-700 mb-2" />
        <p className="text-xs text-zinc-500">No upcoming approved leaves</p>
      </div>
    );
  }

  function calcDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-4 h-4 text-[var(--color-primary-light)]" />
        <h3 className="text-sm font-semibold text-zinc-300">Upcoming Approved Leaves</h3>
      </div>
      {approved.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5"
        >
          <div className="w-1.5 h-8 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-300 font-semibold">{LEAVE_TYPE_LABELS[r.leaveType]}</p>
            <p className="text-[10px] text-zinc-500">
              {r.startDate} → {r.endDate} &middot; {calcDuration(r.startDate, r.endDate)} day{calcDuration(r.startDate, r.endDate) > 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
