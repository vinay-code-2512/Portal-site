"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEmployee } from "@/lib/employees";
import { getTodayRecord, getWeeklyRecords } from "@/lib/attendance";
import { getLocalDateString, isSunday } from "@/lib/format";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import WeeklyOverview from "@/components/employee/attendance/WeeklyOverview";
import type { DailyHour } from "@/hooks/useWeeklyStats";
import {
  Clock, CalendarDays, History as HistoryIcon, Target, Coffee, Timer,
  Play, AlertCircle, ChevronRight, ChevronLeft, User,
} from "lucide-react";

function toDate(val: any): Date {
  if (!val) return new Date();
  if (val.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime12(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateNice(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const MONTH_BADGES: Record<string, string> = {
  present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  late: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  absent: "bg-red-500/10 border-red-500/20 text-red-400",
  "half-day": "bg-orange-500/10 border-orange-500/20 text-orange-400",
};

const MONTH_DOTS: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
  "half-day": "bg-orange-500",
};

function computeHours(checkIn: any, checkOut: any): string {
  if (!checkIn) return "—";
  const ci = toDate(checkIn);
  const co = checkOut ? toDate(checkOut) : new Date();
  const diff = co.getTime() - ci.getTime();
  if (diff < 0) return "—";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function AttendanceHistory({ attendance }: { attendance: any[] }) {
  const filteredAttendance = attendance.filter((r) => !isSunday(r.date));
  const months = [...new Set(filteredAttendance.map((r) => getMonthKey(r.date)))].sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(months[0] || getMonthKey(new Date().toISOString().slice(0, 10)));

  const filtered = filteredAttendance.filter((r) => getMonthKey(r.date) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));

  const currentIdx = months.indexOf(selectedMonth);

  return (
    <div className="space-y-4">
      <div className="hrms-glass rounded-[20px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-[var(--color-primary-light)]" />
            <h2 className="text-sm font-bold text-white">Attendance Records</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const i = months.indexOf(selectedMonth); if (i < months.length - 1) setSelectedMonth(months[i + 1]); }}
              disabled={currentIdx >= months.length - 1}
              className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-zinc-300 font-medium min-w-[120px] text-center">{getMonthLabel(selectedMonth)}</span>
            <button
              onClick={() => { const i = months.indexOf(selectedMonth); if (i > 0) setSelectedMonth(months[i - 1]); }}
              disabled={currentIdx <= 0}
              className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-xs py-4 text-center">No attendance records for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                  <th className="text-left pb-3 pr-3">Date</th>
                  <th className="text-left pb-3 pr-3">Day</th>
                  <th className="text-left pb-3 pr-3">Check In</th>
                  <th className="text-left pb-3 pr-3">Check Out</th>
                  <th className="text-left pb-3 pr-3">Break</th>
                  <th className="text-left pb-3 pr-3">Hours</th>
                  <th className="text-right pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => {
                  const parts = r.date.split("-");
                  const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : r.date;
                  const day = new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
                  const hours = computeHours(r.checkIn, r.checkOut);
                  const breakMs = r.breaks?.reduce((sum: number, b: any) => {
                    if (b.end) return sum + (toDate(b.end).getTime() - toDate(b.start).getTime());
                    return sum + (Date.now() - toDate(b.start).getTime());
                  }, 0) || 0;
                  return (
                    <tr key={r.id} className="border-b border-white/[0.03] last:border-0">
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-300 font-medium tabular-nums">{formattedDate}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-500">{day}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-300 tabular-nums">{r.checkIn ? formatTime12(toDate(r.checkIn)) : "—"}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-300 tabular-nums">{r.checkOut ? formatTime12(toDate(r.checkOut)) : "—"}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-300 tabular-nums">{breakMs > 0 ? formatMs(breakMs) : "—"}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-zinc-300 tabular-nums">{hours}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${MONTH_BADGES[r.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${MONTH_DOTS[r.status] || "bg-zinc-500"}`} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TodayContent({ todayRecord, currentTime, emp }: { todayRecord: any; currentTime: Date; emp: any }) {
  const checkedIn = todayRecord?.checkIn;
  const checkedOut = todayRecord?.checkOut;
  const breaks: any[] = todayRecord?.breaks || [];
  const hasOpenBreak = breaks.some((b: any) => !b.end);
  const todayStatus = todayRecord?.status || "absent";

  let grossMs = 0;
  let completedBreakMs = 0;
  let currentWorkMs = 0;

  if (checkedIn) {
    const checkInDate = toDate(checkedIn);
    const endDate = checkedOut ? toDate(checkedOut) : currentTime;
    grossMs = endDate.getTime() - checkInDate.getTime();

    completedBreakMs = breaks.reduce((sum: number, b: any) => {
      if (b.end) return sum + (toDate(b.end).getTime() - toDate(b.start).getTime());
      return sum;
    }, 0);

    const openBreakMs = hasOpenBreak
      ? currentTime.getTime() - toDate(breaks.find((b: any) => !b.end).start).getTime()
      : 0;

    const totalBreakMs = completedBreakMs + openBreakMs;
    currentWorkMs = Math.max(0, grossMs - totalBreakMs);
  }

  const STATUS_STYLES: Record<string, string> = {
    present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    late: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    absent: "bg-red-500/10 border-red-500/20 text-red-400",
    "half-day": "bg-orange-500/10 border-orange-500/20 text-orange-400",
  };

  const STATUS_DOTS: Record<string, string> = {
    present: "bg-emerald-400",
    late: "bg-amber-400",
    absent: "bg-red-400",
    "half-day": "bg-orange-400",
  };

  const statusText = todayRecord
    ? todayStatus === "present"
      ? checkedOut
        ? "Completed"
        : hasOpenBreak
          ? "On Break"
          : "Working"
      : todayStatus.charAt(0).toUpperCase() + todayStatus.slice(1)
    : "Not Checked In";

  const shiftDuration = emp?.shiftDurationHours || 8;
  const shiftProgress = Math.min(100, Math.round((currentWorkMs / (shiftDuration * 3600000)) * 100));

  const timelineItems: { time: string; label: string; icon: React.ReactNode; active: boolean }[] = [];

  if (checkedIn) {
    timelineItems.push({
      time: formatTime12(toDate(checkedIn)),
      label: "Check In",
      icon: <Play className="w-3 h-3" />,
      active: true,
    });

    breaks.forEach((b: any) => {
      timelineItems.push({
        time: formatTime12(toDate(b.start)),
        label: "Break Start",
        icon: <Coffee className="w-3 h-3" />,
        active: true,
      });
      if (b.end) {
        timelineItems.push({
          time: formatTime12(toDate(b.end)),
          label: "Break End",
          icon: <Coffee className="w-3 h-3" />,
          active: true,
        });
      } else {
        timelineItems.push({
          time: "—",
          label: "Break (Ongoing)",
          icon: <Coffee className="w-3 h-3" />,
          active: false,
        });
      }
    });

    timelineItems.push({
      time: checkedOut ? formatTime12(toDate(checkedOut)) : formatTime12(currentTime),
      label: checkedOut ? "Check Out" : "Active",
      icon: <Clock className="w-3 h-3" />,
      active: !!checkedOut,
    });
  }

  return (
    <div className="space-y-4">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">{formatDateNice(currentTime)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {formatTime12(currentTime)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${hasOpenBreak ? "animate-pulse" : ""} ${STATUS_DOTS[todayStatus] || "bg-zinc-500"}`} />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${STATUS_STYLES[todayStatus] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {!todayRecord ? (
        <div className="hrms-glass rounded-[20px] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 font-medium">No attendance recorded for today</p>
          <p className="text-xs text-zinc-600 mt-1">The employee has not checked in yet today.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Today&apos;s Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-[var(--color-primary-light)]">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(grossMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Gross Hours</p>
              </div>
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-amber-400">
                  <Coffee className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(completedBreakMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Break Time</p>
              </div>
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-emerald-400">
                  <Timer className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(currentWorkMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Net Hours</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Shift Progress</h3>
            <div className="hrms-glass rounded-[20px] p-5 flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--color-primary-light)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(shiftProgress / 100) * 213.6} 213.6`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[var(--color-primary-light)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white">{shiftProgress}%</p>
                <p className="text-xs text-zinc-500">of {shiftDuration}-hour shift completed</p>
                <div className="mt-2 w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500"
                    style={{ width: `${shiftProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {timelineItems.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Session Timeline</h3>
              <div className="hrms-glass rounded-[20px] p-5">
                <div className="space-y-0">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pb-4 last:pb-0">
                      {idx < timelineItems.length - 1 && (
                        <div className="absolute left-[15px] top-7 bottom-0 w-px bg-white/[0.06]" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.active ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]" : "bg-white/[0.04] text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0 pt-1">
                        <p className="text-xs text-zinc-300 font-medium">{item.label}</p>
                        <p className="text-[11px] text-zinc-500 tabular-nums">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getWeekRange(offset: number) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function formatWeekLabel(monday: Date, sunday: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} - ${sunday.toLocaleDateString("en-US", opts)}`;
}

const WEEK_STATUS_COLORS: Record<string, { fill: string; stroke: string; bg: string }> = {
  present: { fill: "var(--color-primary-light)", stroke: "var(--color-primary)", bg: "bg-emerald-500/10" },
  late: { fill: "#f59e0b", stroke: "#d97706", bg: "bg-amber-500/10" },
  absent: { fill: "#ef4444", stroke: "#dc2626", bg: "bg-red-500/10" },
  "half-day": { fill: "#f97316", stroke: "#ea580c", bg: "bg-orange-500/10" },
};

function WeeklyDonut({ stats, total }: { stats: Record<string, number>; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const segments = [
    { key: "present", label: "Present" },
    { key: "late", label: "Late" },
    { key: "absent", label: "Absent" },
    { key: "half-day", label: "Half Day" },
  ];
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const paths = segments.map((seg) => {
    const value = stats[seg.key] || 0;
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * circumference;
    const dashOffset = -offset;
    const cumBefore = offset;
    offset += length;
    const midFrac = length > 0 ? (cumBefore + length / 2) / circumference : 0;
    const midAngle = midFrac * 2 * Math.PI;
    const popDist = 1;
    const tx = Math.sin(midAngle) * popDist;
    const ty = -Math.cos(midAngle) * popDist;
    return { ...seg, value, fraction, length, dashOffset, cumBefore, tx, ty, color: WEEK_STATUS_COLORS[seg.key] };
  });

  const active = hovered ? paths.find((p) => p.key === hovered) : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center relative">
      <div className="relative w-44 h-44">
        <svg
          className="w-44 h-44 -rotate-90"
          viewBox="-5 -5 90 90"
          onMouseMove={handleMouseMove}
        >
          <defs>
            <radialGradient id="donutCenterGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#4f46e5" />
            </radialGradient>
          </defs>
          {paths.map((p) => {
            const isHovered = hovered === p.key;
            return (
              <circle
                key={p.key}
                cx="40" cy="40" r={radius}
                fill="none"
                stroke={isHovered ? p.color.stroke : p.color.fill}
                strokeWidth={isHovered ? 12 : 8}
                strokeDasharray={p.length > 0 ? `${p.length} ${circumference - p.length}` : `0 ${circumference}`}
                strokeDashoffset={p.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHovered(p.key)}
                onMouseLeave={() => { setHovered(null); setMousePos(null); }}
                style={{
                  filter: isHovered ? "brightness(1.3)" : undefined,
                  transform: isHovered ? `translate(${p.tx}px, ${p.ty}px)` : undefined,
                }}
              />
            );
          })}
          <circle cx="40" cy="40" r="27" fill="url(#donutCenterGrad)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
        </div>
      </div>

      {active && mousePos && (
        <div
          className="pointer-events-none z-50"
          style={{
            position: "absolute",
            left: mousePos.x + 12,
            top: mousePos.y - 12,
            transform: "translateY(-100%)",
          }}
        >
          <div
            className="px-3 py-2 rounded-xl text-center whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(91, 76, 255, 0.2)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <p className="text-xs font-bold text-[#111827] capitalize">{active.label}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
              {active.value} day{active.value !== 1 ? "s" : ""} &middot; {Math.round(active.fraction * 100)}%
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {paths.filter((p) => p.value > 0).map((p) => (
          <div
            key={p.key}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onMouseEnter={() => setHovered(p.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color.fill }} />
            <span className="text-[10px] text-zinc-400 capitalize">{p.label} ({p.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyContent({ employeeId }: { employeeId: string }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [dailyHours, setDailyHours] = useState<DailyHour[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekRecords, setWeekRecords] = useState<any[]>([]);
  const [weekStats, setWeekStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeek() {
      try {
        setLoading(true);
        const now = new Date();
        const today = getLocalDateString(now);
        const { monday, sunday } = getWeekRange(weekOffset);

        const mondayStr = getLocalDateString(monday);
        const sundayStr = getLocalDateString(sunday);

        const records = await getWeeklyRecords(employeeId, mondayStr, sundayStr);
        if (cancelled) return;

        const days: DailyHour[] = [];
        let total = 0;
        const stats: Record<string, number> = { present: 0, late: 0, absent: 0, "half-day": 0 };
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          if (d.getDay() === 0) continue;
          const dateStr = getLocalDateString(d);
          const record = records.find((r: any) => r.date === dateStr);

          let hours = 0;
          if (record?.checkIn && record?.checkOut) {
            const checkIn = record.checkIn.toDate();
            const checkOut = record.checkOut.toDate();
            const breaksMs = record.breaks?.reduce((sum: number, b: any) => {
              if (b.end) return sum + (b.end.toDate() - b.start.toDate());
              return sum;
            }, 0) || 0;
            hours = Math.max(0, (checkOut.getTime() - checkIn.getTime() - breaksMs) / (1000 * 60 * 60));
          } else if (record?.checkIn && !record?.checkOut) {
            const checkIn = record.checkIn.toDate();
            const nowMs = Date.now();
            const breaksMs = record.breaks?.reduce((sum: number, b: any) => {
              if (b.end) return sum + (b.end.toDate() - b.start.toDate());
              return sum;
            }, 0) || 0;
            hours = Math.max(0, (nowMs - checkIn.getTime() - breaksMs) / (1000 * 60 * 60));
          }

          days.push({
            day: dayNames[d.getDay()],
            date: dateStr,
            hours: Math.round(hours * 100) / 100,
            isToday: dateStr === today,
          });
          total += hours;

          if (record) {
            const s = record.status as keyof typeof stats;
            if (stats[s] !== undefined) stats[s]++;
          }
        }

        setDailyHours(days);
        setWeekTotal(Math.round(total * 100) / 100);
        setWeekRecords(records);
        setWeekStats(stats);
      } catch (err) {
        console.error("Failed to load weekly stats:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeek();
    return () => { cancelled = true; };
  }, [employeeId, weekOffset]);

  const { monday, sunday } = getWeekRange(weekOffset);
  const weekLabel = formatWeekLabel(monday, sunday);
  const totalDays = weekRecords.length;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="hrms-glass rounded-[20px] p-4 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{weekLabel}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {weekOffset === 0 ? "Current Week" : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? "s" : ""} ago`}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          disabled={weekOffset >= 0}
          className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bar Chart */}
      {!loading && <WeeklyOverview dailyHours={dailyHours} weekTotal={weekTotal} />}

      {/* Donut + Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div className="hrms-glass rounded-[20px] p-5">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Attendance Split</h3>
          <WeeklyDonut stats={weekStats} total={totalDays} />
        </div>

        {/* Weekly Table */}
        <div className="lg:col-span-2 hrms-glass rounded-[20px] p-5">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Daily Breakdown</h3>
          {loading ? (
            <LoadingState />
          ) : weekRecords.length === 0 ? (
            <p className="text-zinc-500 text-xs py-4 text-center">No records for this week.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                    <th className="text-left pb-3 pr-3">Date</th>
                    <th className="text-left pb-3 pr-3">Day</th>
                    <th className="text-left pb-3 pr-3">Check In</th>
                    <th className="text-left pb-3 pr-3">Check Out</th>
                    <th className="text-left pb-3 pr-3">Break</th>
                    <th className="text-left pb-3 pr-3">Hours</th>
                    <th className="text-right pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyHours.map((d) => {
                    const record = weekRecords.find((r: any) => r.date === d.date);
                    const breakMs = record?.breaks?.reduce((sum: number, b: any) => {
                      if (b.end) return sum + (toDate(b.end).getTime() - toDate(b.start).getTime());
                      return sum + (Date.now() - toDate(b.start).getTime());
                    }, 0) || 0;
                    return (
                      <tr key={d.date} className="border-b border-white/[0.03] last:border-0">
                        <td className="py-3 pr-3">
                          <span className={`text-xs font-medium tabular-nums ${d.isToday ? "text-[var(--color-primary-light)]" : "text-zinc-300"}`}>
                            {d.date}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`text-xs ${d.isToday ? "text-[var(--color-primary-light)]" : "text-zinc-500"}`}>
                            {d.day}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-xs text-zinc-300 tabular-nums">
                            {record?.checkIn ? formatTime12(toDate(record.checkIn)) : "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-xs text-zinc-300 tabular-nums">
                            {record?.checkOut ? formatTime12(toDate(record.checkOut)) : "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-xs text-zinc-300 tabular-nums">
                            {breakMs > 0 ? formatMs(breakMs) : "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-xs text-zinc-300 tabular-nums">{d.hours > 0 ? `${d.hours}h` : "—"}</span>
                        </td>
                        <td className="py-3 text-right">
                          {record ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${MONTH_BADGES[record.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${MONTH_DOTS[record.status] || "bg-zinc-500"}`} />
                              {record.status}
                            </span>
                          ) : (
                            <span className="text-[9px] text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeAttendancePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const tab = searchParams.get("tab") || "today";

  const [employee, setEmployee] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [emp, today, attSnap] = await Promise.all([
          getEmployee(id),
          getTodayRecord(id),
          getDocs(query(collection(db, "attendance"), where("uid", "==", id))),
        ]);

        setEmployee(emp);
        setTodayRecord(today);
        setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r: any) => !isSunday(r.date)));
      } catch (err: any) {
        setError(err?.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">No employee selected.</p>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-6">
      {/* Header */}
      <div className="hrms-glass rounded-[20px] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0 overflow-hidden">
            {employee?.photoURL ? (
              <img src={employee.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              employee?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{employee?.fullName || "Employee"}</h1>
            <p className="text-sm text-zinc-400">{employee?.designation} &middot; {employee?.department}</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === "today" && <TodayContent todayRecord={todayRecord} currentTime={currentTime} emp={employee} />}
      {tab === "weekly" && <WeeklyContent employeeId={id} />}
      {tab === "history" && <AttendanceHistory attendance={attendance} />}
    </div>
  );
}
