"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Search, Clock, CalendarDays, Check, X } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLocalDateString } from "@/lib/format";
import type { AdminDashboardData } from "@/hooks/useAdminDashboard";

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string; ring: string }> = {
  present: { bg: "bg-emerald-500/10 border-emerald-500/25", dot: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-500/30" },
  late: { bg: "bg-amber-500/10 border-amber-500/25", dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500/30" },
  absent: { bg: "bg-rose-500/10 border-rose-500/25", dot: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-500/30" },
  "half-day": { bg: "bg-amber-500/10 border-amber-500/25", dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500/30" },
  "on-leave": { bg: "bg-purple-500/10 border-purple-500/25", dot: "bg-purple-500", text: "text-purple-600", ring: "ring-purple-500/30" },
  "checked-out": { bg: "bg-zinc-500/10 border-zinc-500/25", dot: "bg-zinc-400", text: "text-zinc-600", ring: "ring-zinc-500/30" },
  break: { bg: "bg-sky-500/10 border-sky-500/25", dot: "bg-sky-500", text: "text-sky-600", ring: "ring-sky-500/30" },
  "pending-review": { bg: "bg-orange-500/10 border-orange-500/25", dot: "bg-orange-500", text: "text-orange-600", ring: "ring-orange-500/30" },
};

function formatTime(ts: any) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

interface TodaysAttendanceProps {
  data: AdminDashboardData;
}

const FILTER_PILLS = [
  { key: "all", label: "All" },
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "absent", label: "Absent" },
  { key: "pending", label: "Pending" },
] as const;

function matchStatusFilter(w: { status: string }, filter: string) {
  if (filter === "all") return true;
  if (filter === "present") return w.status === "present" || w.status === "break";
  if (filter === "late") return w.status === "late";
  if (filter === "absent") return w.status === "absent" || w.status === "pending-review";
  if (filter === "pending") return w.status === "checked-out" || w.status === "on-leave";
  return true;
}

export default function TodaysAttendance({ data }: TodaysAttendanceProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const update = () => {
      setIstTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const filtered = useMemo(() => {
    const byStatus = data.workforce.filter((w) => matchStatusFilter(w, filterStatus));
    if (!search.trim()) return byStatus;
    const q = search.toLowerCase();
    return byStatus.filter(
      (w) => w.name.toLowerCase().includes(q) || (w.department || "").toLowerCase().includes(q)
    );
  }, [data.workforce, filterStatus, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[24px] border border-white/30 bg-white/30 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(99,102,241,0.15)]"
    >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-y-4 mb-6">
          {/* Left — Title + date */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-[#111827] uppercase tracking-[0.15em]">
              Today&apos;s{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Employee Attendance
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <CalendarDays className="w-3 h-3 text-zinc-400" />
              <span className="text-[11px] text-zinc-500 font-semibold">{todayStr}</span>
            </div>
          </div>

          {/* Center — Filter Pills */}
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center bg-black/[0.06] backdrop-blur-sm rounded-xl p-1 border border-white/30 gap-0.5 overflow-x-auto shadow-sm">
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setFilterStatus(pill.key)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-out cursor-pointer ${
                    filterStatus === pill.key
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-105"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right — IST Live Clock + Total */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {/* IST Clock */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm">
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-extrabold text-zinc-800 tabular-nums">{istTime || "--:--"}</span>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">IST</span>
              </div>
            </div>

            {/* Total badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-extrabold text-zinc-700 tabular-nums">{data.totalEmployees}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-white/50 backdrop-blur-sm border border-white/40 text-zinc-700 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all duration-300 shadow-sm"
          />
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/20 backdrop-blur-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[9px] text-black uppercase tracking-wider font-extrabold bg-white/30 backdrop-blur-sm">
                <th className="pb-3.5 pt-3.5 pr-3 pl-4 font-extrabold text-left">Employee</th>
                <th className="pb-3.5 pt-3.5 pr-3 font-extrabold text-left">Department</th>
                <th className="pb-3.5 pt-3.5 pr-3 font-extrabold text-left">Check In</th>
                <th className="pb-3.5 pt-3.5 pr-3 font-extrabold text-left">Check Out</th>
                <th className="pb-3.5 pt-3.5 pr-3 font-extrabold text-left">Break Time</th>
                <th className="pb-3.5 pt-3.5 pr-3 font-extrabold text-left">Status</th>
                <th className="pb-3.5 pt-3.5 pr-4 font-extrabold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((w, i) => {
                const displayStatus = w.autoCheckedOut ? "pending-review" : w.status;
                const style = STATUS_STYLES[displayStatus] || STATUS_STYLES.absent;
                const initial = (w.name || "?").charAt(0).toUpperCase();
                return (
                  <motion.tr
                    key={w.uid}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.3, ease: "easeOut" }}
                    className="text-xs text-zinc-700 transition-all duration-200 ease-out even:bg-white/[0.06] hover:bg-white/30 hover:shadow-sm hover:scale-[1.001] cursor-default"
                  >
                    <td className="py-3 pr-3 pl-4">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/admin/employees/details?id=${w.uid}`)}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] text-white font-extrabold shrink-0 overflow-hidden shadow-md ring-2 ring-white/50">
                          {w.photoURL ? (
                            <img src={w.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800">{w.name}</span>
                          <span className="text-[9px] text-zinc-400 font-bold tabular-nums">
                            {w.uid.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-zinc-500">
                      {w.department || "—"}
                    </td>
                    <td className="py-3 pr-3 font-bold text-zinc-700 tabular-nums">
                      {formatTime(w.checkIn)}
                    </td>
                    <td className="py-3 pr-3 font-bold text-zinc-700 tabular-nums">
                      {formatTime(w.checkOut)}
                    </td>
                    <td className="py-3 pr-3 font-bold text-zinc-700 tabular-nums text-[11px]">
                      {w.breakMinutes != null
                        ? `${w.breakMinutes}m`
                        : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ring-2 ${style.ring}`} />
                        {displayStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {w.autoCheckedOut ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, "attendance", `${w.uid}_${getLocalDateString(new Date())}`), {
                                status: "present",
                                autoCheckedOut: false,
                                updatedAt: serverTimestamp(),
                              });
                              window.location.reload();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Present
                          </button>
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, "attendance", `${w.uid}_${getLocalDateString(new Date())}`), {
                                status: "absent",
                                autoCheckedOut: false,
                                updatedAt: serverTimestamp(),
                              });
                              window.location.reload();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            Absent
                          </button>
                        </div>
                      ) : w.status === "absent" ? (
                        <span className="inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 cursor-pointer">
                          Mark Present
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-semibold bg-white/30 px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur-sm">
                          Active
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">No employees match the current filters</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
