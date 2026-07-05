"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, UserCheck } from "lucide-react";
import type { EnrichedAttendance } from "@/lib/adminAttendance";
import EmptyState from "@/components/shared/EmptyState";
import MarkAttendanceModal from "./MarkAttendanceModal";

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string }> = {
  present: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  late: {
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  absent: {
    bg: "bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
  "half-day": {
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  "on-leave": {
    bg: "bg-purple-500/10 border-purple-500/20",
    dot: "bg-purple-500",
    text: "text-purple-700",
  },
  "checked-out": {
    bg: "bg-zinc-500/10 border-zinc-500/20",
    dot: "bg-zinc-400",
    text: "text-zinc-700",
  },
};

function formatTime(ts: any) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

interface AttendanceTableProps {
  records: EnrichedAttendance[];
  selectedDate: string;
  onRefresh: () => void;
}

export default function AttendanceTable({ records, selectedDate, onRefresh }: AttendanceTableProps) {
  const [markUid, setMarkUid] = useState<string | null>(null);

  const presentCount = records.filter((r) => r.status === "present" || r.status === "late" || r.status === "half-day" || r.status === "checked-out").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const absentForMark = records.filter((r) => r.status === "absent");

  if (!records.length) {
    return (
      <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4">Employee Attendance</h3>
        <EmptyState icon={<Clock className="w-6 h-6 text-zinc-400" />} title="No employees found" />
      </div>
    );
  }

  return (
    <>
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        {/* Table Header Controls */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Employee Attendance</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              {presentCount} Present &middot; {absentCount} Absent
            </p>
          </div>
          {absentForMark.length > 0 && (
            <button
              onClick={() => {
                const firstAbsent = absentForMark[0];
                setMarkUid(firstAbsent.uid);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Mark Attendance
            </button>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold border-b border-[var(--border-light)]/40 text-left">
                <th className="pb-3.5 pr-4 font-extrabold">Employee</th>
                <th className="pb-3.5 pr-4 font-extrabold">Department</th>
                <th className="pb-3.5 pr-4 font-extrabold">Check In</th>
                <th className="pb-3.5 pr-4 font-extrabold">Check Out</th>
                <th className="pb-3.5 pr-4 font-extrabold">Working Hours</th>
                <th className="pb-3.5 pr-4 font-extrabold">Status</th>
                <th className="pb-3.5 text-right font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]/20">
              {records.map((r, i) => {
                const style = STATUS_STYLES[r.status] || STATUS_STYLES.absent;
                const initial = (r.name || "?").charAt(0).toUpperCase();
                return (
                  <motion.tr
                    key={r.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="text-xs text-zinc-700 hover:bg-white/20 transition-all duration-200"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                          {r.photoURL ? (
                            <img src={r.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800">{r.name}</span>
                          <span className="text-[9px] text-zinc-400 font-bold tabular-nums">
                            {r.employeeId || r.uid.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-zinc-600">
                      {r.department || "—"}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-zinc-700 tabular-nums">
                      {formatTime(r.checkIn)}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-zinc-700 tabular-nums">
                      {formatTime(r.checkOut)}
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-zinc-500 tabular-nums">
                      {r.netHours || "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {r.status === "absent" ? (
                        <button
                          onClick={() => setMarkUid(r.uid)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--color-primary-dim)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all cursor-pointer border border-[var(--color-primary-light)]/20"
                        >
                          Mark Present
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic font-semibold">Active</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {records.map((r, i) => {
            const style = STATUS_STYLES[r.status] || STATUS_STYLES.absent;
            const initial = (r.name || "?").charAt(0).toUpperCase();
            return (
              <motion.div
                key={r.uid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
                className="p-4 rounded-xl bg-white/20 border border-[var(--border-light)]/40 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                      {r.photoURL ? (
                        <img src={r.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-800 text-xs">{r.name}</span>
                      <span className="text-[9px] text-zinc-400 font-bold">{r.department || "—"}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/25 p-2 rounded-lg text-[10px] text-zinc-500">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">In</span>
                    <span className="font-bold text-zinc-700 mt-0.5">{formatTime(r.checkIn)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Out</span>
                    <span className="font-bold text-zinc-700 mt-0.5">{formatTime(r.checkOut)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Hours</span>
                    <span className="font-bold text-zinc-700 mt-0.5">{r.netHours || "—"}</span>
                  </div>
                </div>

                {r.status === "absent" && (
                  <button
                    onClick={() => setMarkUid(r.uid)}
                    className="w-full py-2 rounded-lg text-[10px] font-bold bg-[var(--color-primary-dim)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all cursor-pointer border border-[var(--color-primary-light)]/20 text-center"
                  >
                    Mark Attendance
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {markUid && (
        <MarkAttendanceModal
          uid={markUid}
          employeeName={records.find((r) => r.uid === markUid)?.name || ""}
          selectedDate={selectedDate}
          onClose={() => setMarkUid(null)}
          onDone={() => {
            setMarkUid(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
