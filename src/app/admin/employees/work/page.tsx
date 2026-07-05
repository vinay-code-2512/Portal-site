"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEmployee } from "@/lib/employees";
import { getLocalDateString, formatTime } from "@/lib/format";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  Clock, CalendarDays, History, CheckCircle, FileText, ExternalLink, BarChart3, PieChart, Circle, ChevronLeft, ChevronRight, XCircle,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  description: string;
  timestamp: Timestamp;
  attachments?: { name: string; url: string; type: "image" | "pdf" }[];
  slotHour?: number | null;
}

function getTargetHours(shiftDurationHours: number): number[] {
  return Array.from({ length: shiftDurationHours || 9 }, (_, i) => 11 + i);
}

interface ActivityRow {
  id: string;
  time: string;
  sortValue: number;
  status: "confirmed" | "missed" | "pending";
  description: string;
  attachments: { name: string; url: string; type: "image" | "pdf" }[];
  timestamp: Timestamp | null;
}

function getActivityRows(
  dateKey: string,
  entries: ActivityEntry[],
  missedEntries: ActivityEntry[],
  targetHours: number[]
): ActivityRow[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = getLocalDateString(now);
  const rows: ActivityRow[] = [];

  const hasEntryForHour = (hour: number): boolean =>
    rows.some((r) => {
      if (!r.timestamp) return false;
      const h = r.timestamp.toDate().getHours();
      return h === hour;
    });

  entries.forEach((e) => {
    const d = e.timestamp?.toDate();
    if (!d) return;
    if (getLocalDateString(d) !== dateKey) return;
    if (!targetHours.includes(e.slotHour ?? d.getHours())) return;
    if (e.slotHour != null && e.slotHour !== d.getHours() && !targetHours.includes(e.slotHour)) return;
    rows.push({
      id: e.id,
      time: formatTime(e.timestamp),
      sortValue: d.getHours() * 60 + d.getMinutes(),
      status: "confirmed",
      description: e.description,
      attachments: e.attachments || [],
      timestamp: e.timestamp,
    });
  });

  missedEntries.forEach((e) => {
    const d = e.timestamp?.toDate();
    if (!d) return;
    if (getLocalDateString(d) !== dateKey) return;
    if (e.slotHour != null && !targetHours.includes(e.slotHour)) return;
    rows.push({
      id: e.id,
      time: formatTime(e.timestamp),
      sortValue: d.getHours() * 60 + d.getMinutes(),
      status: "missed",
      description: e.description,
      attachments: e.attachments || [],
      timestamp: e.timestamp,
    });
  });

  targetHours.forEach((hour) => {
    if (hasEntryForHour(hour)) return;
    const minutes = hour * 60;
    const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
    if (dateKey > todayStr || (dateKey === todayStr && minutes > currentMinutes)) {
      rows.push({
        id: `pending_${hour}`,
        time: label,
        sortValue: minutes,
        status: "pending",
        description: "",
        attachments: [],
        timestamp: null,
      });
    } else {
      rows.push({
        id: `missed_${hour}`,
        time: label,
        sortValue: minutes,
        status: "missed",
        description: "No activity confirmed",
        attachments: [],
        timestamp: null,
      });
    }
  });

  rows.sort((a, b) => a.sortValue - b.sortValue);
  return rows;
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return getStartOfDay(d);
}

function getStartOfNextWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  start.setDate(start.getDate() + 7);
  return start;
}

function getStartOfTomorrow(date: Date): Date {
  const start = getStartOfDay(date);
  start.setDate(start.getDate() + 1);
  return start;
}

function useActivityData(employeeId: string, start: Date, end: Date) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [missedEntries, setMissedEntries] = useState<ActivityEntry[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const startKey = start.toISOString();
  const endKey = end.toISOString();

  useEffect(() => {
    if (!employeeId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const [userSnap, logSnap, missedSnap] = await Promise.all([
          getDoc(doc(db, "users", employeeId)),
          getDocs(
            query(
              collection(db, "activity_log"),
              where("uid", "==", employeeId),
              where("type", "==", "activity_confirmation"),
              orderBy("timestamp", "desc")
            )
          ),
          getDocs(
            query(
              collection(db, "activity_log"),
              where("uid", "==", employeeId),
              where("type", "==", "missed_activity"),
              orderBy("timestamp", "desc")
            )
          ),
        ]);

        setMissedCount(userSnap.data()?.missedModalCount ?? 0);

        const list: ActivityEntry[] = [];
        logSnap.forEach((d) => {
          const data = d.data();
          const ts = data.timestamp as Timestamp;
          const td = ts?.toDate();
          if (td && td >= start && td < end) {
            list.push({
              id: d.id,
              description: data.description || data.note || "",
              timestamp: ts,
              attachments: data.attachments || [],
            });
          }
        });
        setEntries(list);

        const missedList: ActivityEntry[] = [];
        missedSnap.forEach((d) => {
          const data = d.data();
          const ts = data.timestamp as Timestamp;
          const td = ts?.toDate();
          if (td && td >= start && td < end) {
            missedList.push({
              id: d.id,
              description: data.description || data.note || "",
              timestamp: ts,
              attachments: data.attachments || [],
              slotHour: data.slotHour ?? null,
            });
          }
        });
        setMissedEntries(missedList);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [employeeId, startKey, endKey]);

  return { entries, missedEntries, missedCount, loading };
}

function DaySlotsView({ dateKey, entries, missedEntries, targetHours }: { dateKey: string; entries: ActivityEntry[]; missedEntries: ActivityEntry[]; targetHours: number[] }) {
  const rows = getActivityRows(dateKey, entries, missedEntries, targetHours);
  return (
    <div className="hrms-glass rounded-[16px] overflow-hidden">
      {rows.map((row, ri) => (
        <div key={row.id} className={`p-3.5 pl-4 border-l-2 ${row.status === "confirmed" ? "border-emerald-500/40" : row.status === "pending" ? "border-zinc-500/30" : "border-amber-500/40"} ${ri < rows.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">
              {row.time}
            </span>
            {row.status === "confirmed" ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Confirmed
              </span>
            ) : row.status === "pending" ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Pending
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5" /> Missed
              </span>
            )}
          </div>
          {row.description && (
            <p className="text-sm text-zinc-200 mb-2 ml-7">{row.description}</p>
          )}
          {row.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-7">
              {row.attachments.map((att, ai) => (
                <div key={ai}>
                  {att.type === "image" ? (
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      <img src={att.url} alt={att.name} className="w-20 h-20 rounded-lg object-cover border border-white/10 hover:opacity-80 transition-opacity" />
                    </a>
                  ) : (
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                      {att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityView({
  entries, missedEntries, loading, emptyMessage, googleSheetId, shiftDurationHours = 9,
}: {
  entries: ActivityEntry[];
  missedEntries: ActivityEntry[];
  loading: boolean;
  emptyMessage: string;
  googleSheetId?: string | null;
  shiftDurationHours?: number;
}) {
  if (loading) return <LoadingState variant="list" count={3} />;

  const targetHours = getTargetHours(shiftDurationHours);
  const todayStr = getLocalDateString(new Date());
  const rows = getActivityRows(todayStr, entries, missedEntries, targetHours);
  const confirmedCount = rows.filter((r) => r.status === "confirmed").length;
  const missedCount = rows.filter((r) => r.status === "missed").length;
  const hasActivity = entries.length > 0 || missedEntries.length > 0;

  return (
    <div className="space-y-4">
      {googleSheetId && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Google Sheet
        </a>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="hrms-glass rounded-[16px] p-4 text-center">
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{confirmedCount}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Confirmed</p>
        </div>
        <div className="hrms-glass rounded-[16px] p-4 text-center">
          <p className="text-xl font-bold text-amber-400 tabular-nums">{missedCount}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Missed</p>
        </div>
      </div>

      {!hasActivity ? (
        <div className="hrms-glass rounded-[20px] p-6 text-center">
          <CheckCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">{emptyMessage}</p>
        </div>
      ) : (
        <DaySlotsView dateKey={todayStr} entries={entries} missedEntries={missedEntries} targetHours={targetHours} />
      )}
    </div>
  );
}

function TodayContent({ employeeId, googleSheetId, shiftDurationHours }: { employeeId: string; googleSheetId?: string | null; shiftDurationHours?: number }) {
  const now = new Date();
  const { entries, missedEntries, loading } = useActivityData(
    employeeId,
    getStartOfDay(now),
    getStartOfTomorrow(now),
  );
  return (
    <ActivityView
      entries={entries}
      missedEntries={missedEntries}
      loading={loading}
      emptyMessage="No activity confirmations today"
      googleSheetId={googleSheetId}
      shiftDurationHours={shiftDurationHours}
    />
  );
}

function getDailyCounts(entries: ActivityEntry[], missedEntries: ActivityEntry[] | undefined, referenceDate: Date, targetHours: number[]): { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const weekStart = getStartOfWeek(referenceDate);
  const days: { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = getLocalDateString(d);
    const rows = getActivityRows(dateStr, entries, missedEntries || [], targetHours);
    const confirmed = rows.filter((r) => r.status === "confirmed").length;
    const missed = rows.filter((r) => r.status === "missed").length;
    days.push({ day: dayNames[d.getDay()], count: confirmed + missed, confirmed, missed, date: dateStr, isToday: dateStr === todayStr });
  }
  return days;
}

function WeeklyBarChart({ dailyCounts }: { dailyCounts: { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] }) {
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);
  return (
    <div className="hrms-glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Daily Activity</h3>
      </div>
      <div className="flex items-end gap-2 sm:gap-3 h-28 sm:h-32">
        {dailyCounts.map((d) => {
          const heightPercent = Math.max((d.count / maxCount) * 100, 4);
          const confFrac = d.count > 0 ? d.confirmed / d.count : 1;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <span className="text-[10px] text-zinc-500 tabular-nums font-medium">{d.count}</span>
              <div className="w-full rounded-lg overflow-hidden flex flex-col-reverse" style={{ height: `${heightPercent}%`, minHeight: '4px' }}>
                {d.missed > 0 && (
                  <div
                    className="w-full bg-amber-500/60 transition-all duration-300"
                    style={{ height: `${(1 - confFrac) * 100}%` }}
                  />
                )}
                <div
                  className={`w-full transition-all duration-300 ${
                    d.isToday
                      ? "bg-gradient-to-t from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                      : d.confirmed > 0 ? "bg-emerald-500/60" : "bg-white/[0.06]"
                  }`}
                  style={{ height: d.count > 0 ? `${confFrac * 100}%` : '100%' }}
                />
              </div>
              <span className={`text-[10px] font-medium ${d.isToday ? "text-indigo-400" : "text-zinc-500"}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/60" />
          <span className="text-[9px] text-zinc-500">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500/60" />
          <span className="text-[9px] text-zinc-500">Missed</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyPieChart({ confirmed, missed }: { confirmed: number; missed: number }) {
  const total = confirmed + missed;
  const cFrac = total > 0 ? confirmed / total : 0;
  const mFrac = total > 0 ? missed / total : 0;
  const r = 80;
  const cx = 100;
  const cy = 100;

  const confirmedArc = cFrac > 0
    ? describeArc(cx, cy, r, 0, cFrac * 360)
    : "";

  const missedStartAngle = cFrac * 360;
  const missedArc = mFrac > 0
    ? describeArc(cx, cy, r, missedStartAngle, missedStartAngle + mFrac * 360)
    : "";

  if (total === 0) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 flex flex-col items-center justify-center min-h-[200px]">
        <PieChart className="w-6 h-6 text-zinc-500 mb-2" />
        <p className="text-xs text-zinc-500">No data</p>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-4 h-4 text-rose-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Confirmed vs Missed</h3>
      </div>
      <div className="flex flex-col items-center">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {cFrac === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill="#34d399" stroke="#059669" strokeWidth="1" />
          ) : mFrac === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          ) : (
            <>
              {confirmedArc && <path d={confirmedArc} fill="#34d399" stroke="#059669" strokeWidth="1" />}
              {missedArc && <path d={missedArc} fill="#fbbf24" stroke="#d97706" strokeWidth="1" />}
            </>
          )}
          <circle cx={cx} cy={cy} r="30" fill="var(--color-bg)" />
        </svg>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-zinc-400">Confirmed ({confirmed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-zinc-400">Missed ({missed})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

function WeeklyDonutChart({ confirmed, missed }: { confirmed: number; missed: number }) {
  const total = confirmed + missed;
  const circumference = 2 * Math.PI * 38;
  const confirmedLen = total > 0 ? (confirmed / total) * circumference : 0;
  const missedLen = total > 0 ? (missed / total) * circumference : 0;

  return (
    <div className="hrms-glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Circle className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completion Rate</h3>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 -rotate-90" viewBox="-5 -5 90 90">
            <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {confirmedLen > 0 && (
              <circle
                cx="40" cy="40" r="38"
                fill="none" stroke="#34d399" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${confirmedLen} ${circumference - confirmedLen}`}
                className="transition-all duration-500"
              />
            )}
            {missedLen > 0 && (
              <circle
                cx="40" cy="40" r="38"
                fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${missedLen} ${circumference - missedLen}`}
                strokeDashoffset={-confirmedLen}
                className="transition-all duration-500"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white tabular-nums">{total}</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Total</span>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-zinc-400">Confirmed ({confirmed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-zinc-400">Missed ({missed})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyContent({ employeeId, googleSheetId, shiftDurationHours = 9 }: { employeeId: string; googleSheetId?: string | null; shiftDurationHours?: number }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekRef = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekStart = useMemo(() => getStartOfWeek(weekRef), [weekRef]);
  const weekEnd = useMemo(() => getStartOfNextWeek(weekRef), [weekRef]);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const targetHours = getTargetHours(shiftDurationHours);

  const { entries, missedEntries, loading } = useActivityData(
    employeeId,
    weekStart,
    weekEnd,
  );
  const dailyCounts = getDailyCounts(entries, missedEntries, weekRef, targetHours);
  const weekConfirmed = dailyCounts.reduce((s, d) => s + d.confirmed, 0);
  const weekMissed = dailyCounts.reduce((s, d) => s + d.missed, 0);


  const allDates = new Set<string>();
  entries.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  missedEntries.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {/* Google Sheet Button */}
      {googleSheetId && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Google Sheet
        </a>
      )}

      {/* Week Navigation */}
      <div className="hrms-glass rounded-[20px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Week</span>
          <span className="text-xs font-semibold text-zinc-200 ml-1">{weekLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState variant="list" count={3} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="hrms-glass rounded-[16px] p-4 text-center">
              <p className="text-xl font-bold text-emerald-400 tabular-nums">{weekConfirmed}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Confirmed</p>
            </div>
            <div className="hrms-glass rounded-[16px] p-4 text-center">
              <p className="text-xl font-bold text-amber-400 tabular-nums">{weekMissed}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Missed</p>
            </div>
          </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WeeklyBarChart dailyCounts={dailyCounts} />
        <WeeklyPieChart confirmed={weekConfirmed} missed={weekMissed} />
        <WeeklyDonutChart confirmed={weekConfirmed} missed={weekMissed} />
      </div>

      {/* Grouped Entries */}
      {sortedDates.length === 0 ? (
        <div className="hrms-glass rounded-[20px] p-6 text-center">
          <CheckCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No activity confirmations this week</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const dateObj = new Date(dateKey + "T00:00:00");
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const formatted = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)]" />
                  <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    {dayName}, {formatted}
                  </h3>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div className="ml-1">
                  <DaySlotsView dateKey={dateKey} entries={entries} missedEntries={missedEntries} targetHours={targetHours} />
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}

function HistoryContent({ employeeId, googleSheetId, shiftDurationHours = 9 }: { employeeId: string; googleSheetId?: string | null; shiftDurationHours?: number }) {
  const targetHours = getTargetHours(shiftDurationHours);

  const { entries, missedEntries, missedCount, loading } = useActivityData(
    employeeId,
    new Date(0),
    new Date("9999-12-31"),
  );

  const [selectedDate, setSelectedDate] = useState("");

  const filtered = !selectedDate ? entries : entries.filter((entry) => {
    const d = entry.timestamp?.toDate();
    if (!d) return false;
    return getLocalDateString(d) === selectedDate;
  });

  const filteredMissed = !selectedDate ? missedEntries : missedEntries.filter((entry) => {
    const d = entry.timestamp?.toDate();
    if (!d) return false;
    return getLocalDateString(d) === selectedDate;
  });

  const allDates = new Set<string>();
  filtered.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  filteredMissed.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  const rowLists = sortedDates.map((dk) => getActivityRows(dk, filtered, filteredMissed, targetHours));
  const totalConfirmed = rowLists.reduce((s, rows) => s + rows.filter((r) => r.status === "confirmed").length, 0);
  const totalMissed = rowLists.reduce((s, rows) => s + rows.filter((r) => r.status === "missed").length, 0);


  return (
    <div className="space-y-4">
      <div className="hrms-glass rounded-[20px] p-4 sm:p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-1">
          <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Filter by Date</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 focus:outline-none focus:border-[var(--color-primary-light)] [color-scheme:dark]"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState variant="list" count={3} />
      ) : (
        <>
          {googleSheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Google Sheet
            </a>
          )}

      <div className="grid grid-cols-2 gap-3">
        <div className="hrms-glass rounded-[16px] p-4 text-center">
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{totalConfirmed}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Confirmed</p>
        </div>
        <div className="hrms-glass rounded-[16px] p-4 text-center">
          <p className="text-xl font-bold text-amber-400 tabular-nums">{totalMissed}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Missed</p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="hrms-glass rounded-[20px] p-6 text-center">
          <CheckCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No activity confirmations found for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const dateObj = new Date(dateKey + "T00:00:00");
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const formatted = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)]" />
                  <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    {dayName}, {formatted}
                  </h3>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div className="ml-1">
                  <DaySlotsView dateKey={dateKey} entries={filtered} missedEntries={filteredMissed} targetHours={targetHours} />
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default function EmployeeWorkPage() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const emp = await getEmployee(id);
        setEmployee(emp);
      } catch (err: any) {
        setError(err?.message || "Failed to load employee");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">No employee selected.</p>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState />;

  const sheetId = (employee as any)?.googleWorkSheetId || (employee as any)?.googleSheetId;
  const shiftDurationHours = (employee as any)?.shiftDurationHours || 9;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-6">
      {/* Employee Header */}
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
      {tab === "today" && <TodayContent employeeId={id} googleSheetId={sheetId} shiftDurationHours={shiftDurationHours} />}
      {tab === "weekly" && <WeeklyContent employeeId={id} googleSheetId={sheetId} shiftDurationHours={shiftDurationHours} />}
      {tab === "history" && <HistoryContent employeeId={id} googleSheetId={sheetId} shiftDurationHours={shiftDurationHours} />}
    </div>
  );
}
