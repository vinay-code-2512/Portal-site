"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import type { AttendanceRecord } from "@/hooks/useAttendance";
import EmptyState from "@/components/shared/EmptyState";

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

const PAGE_SIZE = 10;

function formatDuration(record: AttendanceRecord) {
  if (!record.checkIn) return "-";
  const checkIn = record.checkIn.toDate();
  const checkOut = record.checkOut?.toDate();
  if (!checkOut) return "In progress";
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const breakMs = record.breaks?.reduce((sum: number, b: any) => {
    if (b.end) return sum + (b.end.toDate().getTime() - b.start.toDate().getTime());
    return sum;
  }, 0) || 0;
  const netMs = Math.max(0, diffMs - breakMs);
  const hours = Math.floor(netMs / (1000 * 60 * 60));
  const mins = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function formatBreakMinutes(record: AttendanceRecord) {
  const breakMs = record.breaks?.reduce((sum: number, b: any) => {
    if (b.end) return sum + (b.end.toDate().getTime() - b.start.toDate().getTime());
    return sum;
  }, 0) || 0;
  if (breakMs === 0) return "—";
  const mins = Math.round(breakMs / 60000);
  return `${mins}m`;
}

function statusStyle(status: string) {
  switch (status) {
    case "present":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "late":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "half-day":
      return "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20 text-[var(--color-primary-light)]";
    default:
      return "bg-red-500/10 border-red-500/20 text-red-400";
  }
}

export default function AttendanceHistory({ records }: AttendanceHistoryProps) {
  const [page, setPage] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [records.length]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const totalPages = Math.ceil(sortedRecords.length / PAGE_SIZE);

  const pageRecords = useMemo(() => {
    return sortedRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [sortedRecords, page]);

  if (!sortedRecords.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-7"
      >
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Attendance History</h3>
        <EmptyState icon={<Calendar className="w-6 h-6" />} title="No attendance records yet" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-7"
    >
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Attendance History</h3>

      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-7 gap-3 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold px-3 py-2">
          <span>Date</span>
          <span>Check In</span>
          <span>Check Out</span>
          <span>Hours</span>
          <span>Break</span>
          <span>Status</span>
          <span>Photo</span>
        </div>

        {pageRecords.map((record) => {
          const checkIn = record.checkIn?.toDate();
          const checkOut = record.checkOut?.toDate();

          return (
            <div
              key={record.id}
              className="grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 items-center"
            >
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Date</span>
                <span className="text-xs text-white tabular-nums">
                  {record.date?.split("-").reverse().join("-")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Check In</span>
                <span className="text-xs text-zinc-300">
                  {checkIn
                    ? checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Check Out</span>
                <span className="text-xs text-zinc-300">
                  {checkOut
                    ? checkOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Hours</span>
                <span className="text-xs text-white tabular-nums">{formatDuration(record)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Break</span>
                <span className="text-xs text-zinc-300 tabular-nums">{formatBreakMinutes(record)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusStyle(record.status)}`}>
                  {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "-"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 sm:hidden block font-semibold uppercase tracking-wider">Photo</span>
                {record.selfie ? (
                  <button
                    onClick={() => setSelectedPhoto(record.selfie!)}
                    className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 hover:border-[var(--color-primary)]/40 transition-all duration-200 cursor-pointer"
                  >
                    <img src={record.selfie} alt="Selfie" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-zinc-400 disabled:opacity-30 hover:text-white transition-colors cursor-pointer min-h-[36px]"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                i === page
                  ? "bg-[var(--color-primary-dim)] text-[var(--color-primary-light)] border border-[var(--color-primary)]/20"
                  : "bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-zinc-400 disabled:opacity-30 hover:text-white transition-colors cursor-pointer min-h-[36px]"
          >
            Next
          </button>
        </div>
      )}

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
              <img src={selectedPhoto} alt="Attendance selfie" className="w-full h-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
