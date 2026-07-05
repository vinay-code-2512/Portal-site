"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, AlertTriangle, Inbox } from "lucide-react";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

interface PendingLeavesProps {
  requests: LeaveRequest[];
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  actionLoading: string | null;
  loading: boolean;
}

export default function PendingLeaves({
  requests,
  onApprove,
  onReject,
  actionLoading,
  loading,
}: PendingLeavesProps) {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");

  function calcDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  async function handleApprove(id: string) {
    await onApprove(id);
  }

  async function handleReject(id: string) {
    if (!rejectNote.trim()) {
      setRejectError("Rejection note is required");
      return;
    }
    setRejectError("");
    await onReject(id, rejectNote.trim());
    setRejectId(null);
    setRejectNote("");
  }

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md space-y-4">
        <div className="h-4 w-32 bg-zinc-200/50 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-zinc-200/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Pending Leave Requests
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-4">
          Review and respond to employee leave applications
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Inbox className="w-8 h-8 text-[var(--color-primary-light)] opacity-60 mb-2.5 animate-bounce" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">No pending requests</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">All leave requests have been processed</p>
            </motion.div>
          ) : (
            requests.map((r) => {
              const isLoading = actionLoading === r.id;
              const isRejectingThis = rejectId === r.id;
              const initials = (r.employeeName || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-[20px] border border-[var(--border-light)] bg-white/40 shadow-sm relative hover:bg-white/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Employee Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#111827] truncate">
                          {r.employeeName}
                        </span>
                        <span className="text-[9px] font-bold text-[var(--color-primary-light)] uppercase tracking-wider bg-[var(--color-primary-dim)] px-2 py-0.5 rounded-full border border-[var(--color-primary)]/10 shrink-0">
                          Pending
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                        {LEAVE_TYPE_LABELS[r.leaveType] || r.leaveType}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-medium tabular-nums">
                        {r.startDate} to {r.endDate} &middot;{" "}
                        <span className="text-[var(--color-primary-light)] font-bold">
                          {calcDuration(r.startDate, r.endDate)} Days
                        </span>
                      </p>
                      {r.reason && (
                        <p className="text-[10px] text-zinc-500 mt-2 bg-white/20 border border-white/35 rounded-lg px-2.5 py-1.5 leading-relaxed italic">
                          &ldquo;{r.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rejection input */}
                  {isRejectingThis ? (
                    <div className="mt-3.5 pt-3 border-t border-[var(--border-light)] space-y-2">
                      <textarea
                        value={rejectNote}
                        onChange={(e) => {
                          setRejectNote(e.target.value);
                          setRejectError("");
                        }}
                        rows={2}
                        placeholder="Provide reason for rejection (required)..."
                        className="w-full min-h-[52px] px-3 py-2 rounded-xl bg-white/60 border border-[var(--border-light)] text-[11px] text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-none"
                      />
                      {rejectError && (
                        <p className="flex items-center gap-1 text-[9px] text-red-500 font-semibold">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {rejectError}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(r.id!)}
                          disabled={isLoading}
                          className="flex-1 min-h-[34px] rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setRejectNote("");
                            setRejectError("");
                          }}
                          disabled={isLoading}
                          className="min-h-[34px] px-4 rounded-full bg-white border border-[var(--border-light)] text-zinc-500 text-[10px] font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-[var(--border-light)]">
                      {/* Approve Button (gradient purple, rounded) */}
                      <button
                        onClick={() => handleApprove(r.id!)}
                        disabled={isLoading}
                        className="flex-1 min-h-[34px] rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-[10px] font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Approve
                      </button>
                      {/* Reject Button (rounded outline) */}
                      <button
                        onClick={() => setRejectId(r.id!)}
                        disabled={isLoading}
                        className="flex-1 min-h-[34px] rounded-full bg-white border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
