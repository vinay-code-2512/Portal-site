"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { formatFirebaseDate } from "@/lib/format";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  actionLoading: string | null;
  onSelect?: (request: LeaveRequest) => void;
}

export default function LeaveRequestCard({ request, onApprove, onReject, actionLoading, onSelect }: LeaveRequestCardProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");

  const isLoading = actionLoading === request.id;

  function calcDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  async function handleApprove() {
    await onApprove(request.id!);
  }

  async function handleReject() {
    if (!rejectNote.trim()) {
      setRejectError("A rejection note is required");
      return;
    }
    setRejectError("");
    await onReject(request.id!, rejectNote.trim());
    setShowRejectInput(false);
    setRejectNote("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[16px] p-4 sm:p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-sm text-white font-bold shrink-0 cursor-pointer"
          onClick={() => onSelect?.(request)}
        >
          {(request.employeeName || "?").charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onSelect?.(request)}
                  className="text-sm font-extrabold text-[#111827] hover:text-[var(--color-primary)] transition-colors text-left"
                >
                  {request.employeeName}
                </button>
                <span className="text-[10px] text-zinc-400 font-mono">#{request.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-dim)] px-2 py-0.5 rounded-md">
                  {LEAVE_TYPE_LABELS[request.leaveType]}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {request.startDate} → {request.endDate} &middot; {calcDuration(request.startDate, request.endDate)}d
                </span>
              </div>
            </div>
            <button
              onClick={() => onSelect?.(request)}
              className="w-7 h-7 rounded-lg bg-white/60 border border-[var(--border-light)]/50 flex items-center justify-center text-zinc-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed bg-white/40 rounded-lg px-3 py-2 border border-[var(--border-light)]/30">
            {request.reason}
          </p>

          <p className="text-[10px] text-zinc-400 mt-1.5">
            Applied {formatFirebaseDate(request.createdAt)}
          </p>
        </div>
      </div>

      {showRejectInput ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={rejectNote}
            onChange={(e) => { setRejectNote(e.target.value); setRejectError(""); }}
            rows={2}
            placeholder="Reason for rejection (required)..."
            className="w-full min-h-[60px] px-3 py-2 rounded-xl bg-white/70 border border-red-200 text-xs text-[#111827] placeholder-zinc-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
          />
          {rejectError && (
            <p className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              {rejectError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1 min-h-[40px] rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              Confirm Reject
            </button>
            <button
              onClick={() => { setShowRejectInput(false); setRejectNote(""); setRejectError(""); }}
              disabled={isLoading}
              className="min-h-[40px] px-4 rounded-xl bg-white/70 border border-[var(--border-light)]/50 text-zinc-500 text-xs font-bold hover:text-zinc-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 min-h-[40px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-xs font-bold shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={isLoading}
            className="flex-1 min-h-[40px] rounded-xl bg-white/70 border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      )}
    </motion.div>
  );
}
