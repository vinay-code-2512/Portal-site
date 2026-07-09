"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString, formatTime, isSunday } from "@/lib/format";
import { ClipboardList, FileText, ExternalLink, X, Clock, XCircle, CheckCircle, CalendarDays, ChevronLeft, ChevronRight, BarChart3, Circle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

interface ActivityAttachment {
  name: string;
  url: string;
  type: "image" | "pdf";
}

interface ActivityEntry {
  id: string;
  note: string;
  attachments: ActivityAttachment[];
  timestamp: Timestamp;
  slotHour?: number | null;
  slotMinutes?: number | null;
  entryType: "confirmed" | "missed";
}


interface ActivityRow {
  id: string;
  time: string;
  sortValue: number;
  status: "confirmed" | "missed" | "pending";
  note: string;
  attachments: { name: string; url: string; type: "image" | "pdf" }[];
  timestamp: Timestamp | null;
}

function getTargetHours(shiftDurationHours: number): number[] {
  return Array.from({ length: shiftDurationHours }, (_, i) => 11 + i);
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

function getActivityRows(dateKey: string, entries: ActivityEntry[], shiftDurationHours: number = 8): ActivityRow[] {
  if (isSunday(dateKey)) return [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = getLocalDateString(now);
  const targetHours = getTargetHours(shiftDurationHours);
  const rows: ActivityRow[] = [];

  const hasHalfHourEntries = entries.some((e) => e.slotMinutes === 30);

  const getSlotMinutes = (e: ActivityEntry): number => e.slotMinutes ?? 0;

  const filledSlots = new Set<string>();

  entries.forEach((e) => {
    const d = e.timestamp?.toDate();
    if (!d) return;
    if (getLocalDateString(d) !== dateKey) return;
    if (!targetHours.includes(e.slotHour ?? d.getHours())) return;
    const mins = getSlotMinutes(e);
    const key = `${d.getHours()}_${mins}`;
    filledSlots.add(key);
    rows.push({
      id: e.id,
      time: formatTime(e.timestamp),
      sortValue: d.getHours() * 60 + mins,
      status: e.entryType,
      note: e.note,
      attachments: e.attachments || [],
      timestamp: e.timestamp,
    });
  });

  const lastHour = targetHours[targetHours.length - 1];

  targetHours.forEach((hour) => {
    const offsets = hasHalfHourEntries && hour !== lastHour ? [0, 30] : [0];
    offsets.forEach((offset) => {
      const key = `${hour}_${offset}`;
      if (filledSlots.has(key)) return;
      const minutes = hour * 60 + offset;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const label = `${displayHour}:${offset === 30 ? "30" : "00"} ${ampm}`;
      if (dateKey > todayStr || (dateKey === todayStr && minutes > currentMinutes)) {
        rows.push({
          id: `pending_${key}`,
          time: label,
          sortValue: minutes,
          status: "pending",
          note: "",
          attachments: [],
          timestamp: null,
        });
      } else {
        rows.push({
          id: `missed_${key}`,
          time: label,
          sortValue: minutes,
          status: "missed",
          note: "No activity confirmed",
          attachments: [],
          timestamp: null,
        });
      }
    });
  });

  rows.sort((a, b) => a.sortValue - b.sortValue);
  return rows;
}

function getDailyCounts(entries: ActivityEntry[], referenceDate: Date, shiftDurationHours: number = 9): { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const weekStart = getStartOfWeek(referenceDate);
  const days: { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    if (d.getDay() === 0) continue;
    const dateStr = getLocalDateString(d);
    const rows = getActivityRows(dateStr, entries, shiftDurationHours);
    const confirmed = rows.filter((r) => r.status === "confirmed").length;
    const missed = rows.filter((r) => r.status === "missed").length;
    days.push({ day: dayNames[d.getDay()], count: confirmed + missed, confirmed, missed, date: dateStr, isToday: dateStr === todayStr });
  }
  return days;
}

function DaySlotsView({ dateKey, entries, shiftDurationHours }: { dateKey: string; entries: ActivityEntry[]; shiftDurationHours?: number }) {
  const rows = getActivityRows(dateKey, entries, shiftDurationHours);
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
          {row.note && (
            <p className="text-sm text-zinc-200 mb-2 ml-7">{row.note}</p>
          )}
          {row.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-7">
              {row.attachments.map((att, ai) => (
                <div key={ai}>
                  {att.type === "image" ? (
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      <img src={att.url} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-white/10 hover:opacity-80 transition-opacity" />
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

function WeeklyBarChart({ dailyCounts }: { dailyCounts: { day: string; count: number; confirmed: number; missed: number; date: string; isToday: boolean }[] }) {
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);
  return (
    <div className="hrms-glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
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
                  <div className="w-full bg-rose-500/60 transition-all duration-300" style={{ height: `${(1 - confFrac) * 100}%` }} />
                )}
                <div className={`w-full transition-all duration-300 ${d.isToday ? "bg-gradient-to-t from-cyan-500 to-teal-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : d.confirmed > 0 ? "bg-sky-500/60" : "bg-white/[0.06]"}`} style={{ height: d.count > 0 ? `${confFrac * 100}%` : '100%' }} />
              </div>
              <span className={`text-[10px] font-medium ${d.isToday ? "text-cyan-400" : "text-zinc-500"}`}>{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-sky-500/60" />
          <span className="text-[9px] text-zinc-500">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-rose-500/60" />
          <span className="text-[9px] text-zinc-500">Missed</span>
        </div>
      </div>
    </div>
  );
}

function useActivityData(uid: string | undefined, start: Date, end: Date) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const startKey = start.toISOString();
  const endKey = end.toISOString();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const toEntry = (d: any, entryType: "confirmed" | "missed"): ActivityEntry | null => {
      const data = d.data();
      const ts = data.timestamp as Timestamp;
      const td = ts?.toDate();
      if (!td || td < start || td >= end) return null;
      return {
        id: d.id,
        note: data.description || data.note || "",
        attachments: data.attachments || [],
        timestamp: ts,
        slotHour: data.slotHour ?? null,
        slotMinutes: data.slotMinutes ?? null,
        entryType,
      };
    };

    let snapshotsReceived = 0;
    let confirmedDocs: any[] = [];
    let missedDocs: any[] = [];

    const merge = () => {
      const list: ActivityEntry[] = [];
      confirmedDocs.forEach((d) => { const e = toEntry(d, "confirmed"); if (e) list.push(e); });
      missedDocs.forEach((d) => { const e = toEntry(d, "missed"); if (e) list.push(e); });
      setEntries(list);
    };

    const onConfirmed = (snap: any) => {
      confirmedDocs = snap.docs;
      snapshotsReceived++;
      merge();
      if (snapshotsReceived >= 2) setLoading(false);
    };

    const onMissed = (snap: any) => {
      missedDocs = snap.docs;
      snapshotsReceived++;
      merge();
      if (snapshotsReceived >= 2) setLoading(false);
    };

    const onError = (err: any) => {
      console.error("useActivityData error:", err);
      setLoading(false);
    };

    const qConfirmed = query(
      collection(db, "activity_log"),
      where("uid", "==", uid),
      where("type", "==", "activity_confirmation"),
      orderBy("timestamp", "desc")
    );

    const qMissed = query(
      collection(db, "activity_log"),
      where("uid", "==", uid),
      where("type", "==", "missed_activity"),
      orderBy("timestamp", "desc")
    );

    const unsubConfirmed = onSnapshot(qConfirmed, onConfirmed, onError);
    const unsubMissed = onSnapshot(qMissed, onMissed, onError);

    return () => {
      unsubConfirmed();
      unsubMissed();
    };
  }, [uid, startKey, endKey]);

  return { entries, loading };
}

function TodayContent({ uid, shiftDurationHours }: { uid: string; shiftDurationHours: number }) {
  const now = new Date();
  const { entries, loading } = useActivityData(uid, getStartOfDay(now), getStartOfTomorrow(now));
  if (loading) return <LoadingState variant="list" count={3} />;
  const todayStr = getLocalDateString(now);
  const rows = getActivityRows(todayStr, entries, shiftDurationHours);
  const confirmedCount = rows.filter((r) => r.status === "confirmed").length;
  const missedCount = rows.filter((r) => r.status === "missed").length;
  const hasActivity = entries.length > 0;
  return (
    <div className="space-y-4">
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
          <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No activity today</p>
        </div>
      ) : (
        <DaySlotsView dateKey={todayStr} entries={entries} shiftDurationHours={shiftDurationHours} />
      )}
    </div>
  );
}

function WeeklyContent({ uid, shiftDurationHours }: { uid: string; shiftDurationHours: number }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekRef = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekStart = useMemo(() => getStartOfWeek(weekRef), [weekRef]);
  const weekEnd = useMemo(() => getStartOfNextWeek(weekRef), [weekRef]);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const { entries, loading } = useActivityData(uid, weekStart, weekEnd);
  const dailyCounts = getDailyCounts(entries, weekRef, shiftDurationHours);
  const weekConfirmed = dailyCounts.reduce((s, d) => s + d.confirmed, 0);
  const weekMissed = dailyCounts.reduce((s, d) => s + d.missed, 0);
  const allDates = new Set<string>();
  entries.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
  return (
    <div className="space-y-4">
      <div className="hrms-glass rounded-[20px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Week</span>
          <span className="text-xs font-semibold text-zinc-200 ml-1">{weekLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((p) => p - 1)} className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/20 transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setWeekOffset(0)} disabled={weekOffset === 0} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            Today
          </button>
          <button onClick={() => setWeekOffset((p) => p + 1)} className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/20 transition-all cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState variant="list" count={3} />
      ) : (
        <>
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
          <WeeklyBarChart dailyCounts={dailyCounts} />
          {sortedDates.length === 0 ? (
            <div className="hrms-glass rounded-[20px] p-6 text-center">
              <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No activity this week</p>
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
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{dayName}, {formatted}</h3>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div className="ml-1">
                      <DaySlotsView dateKey={dateKey} entries={entries} shiftDurationHours={shiftDurationHours} />
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

function HistoryContent({ uid, shiftDurationHours }: { uid: string; shiftDurationHours: number }) {
  const [selectedDate, setSelectedDate] = useState("");
  const { entries, loading } = useActivityData(uid, new Date(0), new Date("9999-12-31"));
  const filtered = !selectedDate ? entries : entries.filter((entry) => {
    const d = entry.timestamp?.toDate();
    if (!d) return false;
    return getLocalDateString(d) === selectedDate;
  });
  const allDates = new Set<string>();
  filtered.forEach((e) => { const d = e.timestamp?.toDate(); if (d) allDates.add(getLocalDateString(d)); });
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
  const rowLists = sortedDates.map((dk) => getActivityRows(dk, filtered, shiftDurationHours));
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
            <button onClick={() => setSelectedDate("")} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
              Clear
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <LoadingState variant="list" count={3} />
      ) : (
        <>
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
              <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No activity records found</p>
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
                      <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{dayName}, {formatted}</h3>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div className="ml-1">
                      <DaySlotsView dateKey={dateKey} entries={filtered} shiftDurationHours={shiftDurationHours} />
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

export default function EmployeeActivities() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <ActivitiesPage />
    </Suspense>
  );
}

function ActivitiesPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "today";
  const { currentUser, loading: authLoading } = useAuth();
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [fetchingSheet, setFetchingSheet] = useState(true);
  const [shiftDurationHours, setShiftDurationHours] = useState(8);

  useEffect(() => {
    if (authLoading || !currentUser) return;
    const fetchSheet = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const data = userDoc.data();
        if (data?.googleSheetId) {
          setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${data.googleSheetId}/edit`);
        }
        if (data?.shiftDurationHours) {
          setShiftDurationHours(data.shiftDurationHours);
        }
      } catch {
        // silent
      } finally {
        setFetchingSheet(false);
      }
    };
    fetchSheet();
  }, [currentUser, authLoading]);

  if (authLoading) return <LoadingState variant="page" />;
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">Please log in to view your activities.</p>
      </div>
    );
  }

  const uid = currentUser.uid;
  const tabs = [
    { key: "today", label: "Today" },
    { key: "weekly", label: "Weekly" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-[0_0_16px_var(--color-primary-glow)] shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-primary)] uppercase tracking-wider font-semibold">Employee / Activities</p>
          <h1 className="text-xl font-bold mt-0.5">
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
              My Activities
            </span>
          </h1>
        </div>
      </div>

      {(!fetchingSheet && googleSheetUrl) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hrms-glass rounded-[20px] p-5"
        >
          <a
            href={googleSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-[0_0_16px_rgba(52,211,153,0.2)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M8 8h8" /><path d="M8 12h6" /><path d="M8 16h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">Activity Sheet</p>
                <p className="text-xs text-zinc-500 mt-0.5">Open your activity log in Google Sheets</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold shadow-[0_4px_16px_rgba(52,211,153,0.2)] group-hover:shadow-[0_6px_24px_rgba(52,211,153,0.3)] transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Sheet
            </div>
          </a>
        </motion.div>
      )}

      {fetchingSheet && (
        <div className="hrms-glass rounded-[20px] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-48 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/employee/activities?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.key ? "bg-white/10 text-zinc-200 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === "today" && <TodayContent uid={uid} shiftDurationHours={shiftDurationHours} />}
        {tab === "weekly" && <WeeklyContent uid={uid} shiftDurationHours={shiftDurationHours} />}
        {tab === "history" && <HistoryContent uid={uid} shiftDurationHours={shiftDurationHours} />}
      </motion.div>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-lg w-full rounded-2xl overflow-hidden min-h-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <img src={selectedPhoto} alt="Activity photo" className="w-full h-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
