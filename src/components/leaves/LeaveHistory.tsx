"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, CalendarOff } from "lucide-react";
import { formatFirebaseDate } from "@/lib/format";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 border-emerald-200 text-emerald-600",
  pending: "bg-amber-50 border-amber-200 text-amber-600",
  rejected: "bg-red-50 border-red-200 text-red-600",
};

const STATUS_DOTS: Record<string, string> = {
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-red-500",
};

interface LeaveHistoryProps {
  requests: LeaveRequest[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export default function LeaveHistory({ requests, loading, hasMore, loadingMore, onLoadMore }: LeaveHistoryProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function calcDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-0.5 h-16 bg-zinc-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center py-10 text-center">
        <CalendarOff className="w-8 h-8 text-zinc-300 mb-2" />
        <p className="text-xs text-zinc-400 font-semibold">No leave requests yet</p>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <h3 className="text-sm font-extrabold text-[#111827] mb-4">Leave History</h3>

      {isMobile ? (
        <div className="space-y-2">
          {requests.map((r, i) => {
            const s = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="hrms-glass rounded-[14px] p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${s}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] text-zinc-400">{formatFirebaseDate(r.createdAt)}</span>
                </div>
                <p className="text-sm font-bold text-[#111827] mb-0.5">{LEAVE_TYPE_LABELS[r.leaveType]}</p>
                <p className="text-[11px] text-zinc-500">
                  {r.startDate} → {r.endDate} &middot; {calcDuration(r.startDate, r.endDate)}d
                </p>
                <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">{r.reason}</p>
                {r.adminNote && (
                  <p className="text-[10px] text-zinc-400 mt-1.5 italic">Admin note: {r.adminNote}</p>
                )}
              </motion.div>
            );
          })}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-1">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/70 border border-[var(--color-primary)]/20 text-xs text-[var(--color-primary)] font-bold hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Load More
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--color-primary)]/30 via-[var(--color-primary-light)]/20 to-transparent rounded-full" />

          <div className="space-y-0">
            {requests.map((r, i) => {
              const dotColor = STATUS_DOTS[r.status] || STATUS_DOTS.pending;
              const s = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex gap-5 pb-5 last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${dotColor} ring-4 ring-white/80 mt-1.5`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 hrms-glass rounded-[14px] p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#111827]">{LEAVE_TYPE_LABELS[r.leaveType]}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold ${s}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {r.startDate} → {r.endDate} &middot; {calcDuration(r.startDate, r.endDate)}d
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0">{formatFirebaseDate(r.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{r.reason}</p>
                    {r.adminNote && (
                      <div className="mt-2 text-[10px] text-zinc-400 italic bg-white/40 rounded-lg px-3 py-1.5 border border-[var(--border-light)]/30">
                        Admin: {r.adminNote}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4 pb-1">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/70 border border-[var(--color-primary)]/20 text-xs text-[var(--color-primary)] font-bold hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
