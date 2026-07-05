"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Users } from "lucide-react";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

interface TeamLeaveCalendarProps {
  onLoad: (startDate: string, endDate: string) => Promise<void>;
  teamLeaves: LeaveRequest[];
}

export default function TeamLeaveCalendar({ onLoad, teamLeaves }: TeamLeaveCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  useEffect(() => {
    onLoad(startDate, endDate);
  }, [startDate, endDate, onLoad]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const leavesByDate: Record<string, LeaveRequest[]> = {};
  for (const l of teamLeaves) {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (!leavesByDate[key]) leavesByDate[key] = [];
      leavesByDate[key].push(l);
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const hasApproved = teamLeaves.some(l => l.status === "approved");
  const hasPending = teamLeaves.some(l => l.status === "pending");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#111827]">Team Leave Calendar</h3>
            <p className="text-[10px] text-zinc-500 font-semibold">{monthNames[month]} {year}</p>
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
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
          Approved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Pending
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Rejected
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
          const leaves = leavesByDate[dateStr] || [];
          const isToday = dateStr === today.toISOString().slice(0, 10);

          const hasApproved = leaves.some(l => l.status === "approved");
          const hasPending = leaves.some(l => l.status === "pending");
          const hasRejected = leaves.some(l => l.status === "rejected");

          let dotColors = "";
          if (hasApproved) dotColors = "bg-[var(--color-primary)]";
          if (hasPending) dotColors = "bg-amber-500";
          if (hasRejected) dotColors = "bg-red-500";
          if (hasApproved && hasPending) dotColors = "bg-gradient-to-r from-[var(--color-primary)] to-amber-500";

          return (
            <div
              key={day}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] transition-all ${
                isToday
                  ? "bg-[var(--color-primary-dim)] ring-1 ring-[var(--color-primary)]/30"
                  : leaves.length > 0
                    ? "bg-white/60 hover:bg-white/80"
                    : "hover:bg-white/40"
              }`}
            >
              <span className={`font-bold ${isToday ? "text-[var(--color-primary)]" : "text-zinc-500"}`}>
                {day}
              </span>
              {leaves.length > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColors}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Employee list */}
      {teamLeaves.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-light)]/50 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              This month &middot; {teamLeaves.length} leave{teamLeaves.length > 1 ? "s" : ""}
            </span>
          </div>
          {teamLeaves.map((l) => {
            const statusColor = l.status === "approved"
              ? "bg-[var(--color-primary)]"
              : l.status === "pending"
                ? "bg-amber-500"
                : "bg-red-500";
            return (
              <div key={l.id} className="flex items-center gap-2.5 text-[11px] text-zinc-500 py-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                <span className="font-bold text-zinc-700">{l.employeeName}</span>
                <span className="text-zinc-400">
                  {l.startDate === l.endDate ? l.startDate : `${l.startDate} → ${l.endDate}`}
                </span>
                <span className="text-zinc-400">&middot;</span>
                <span className="text-zinc-400">{LEAVE_TYPE_LABELS[l.leaveType]}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
