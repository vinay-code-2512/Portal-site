"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Briefcase, User, Shield, FileText } from "lucide-react";
import { formatFirebaseDate } from "@/lib/format";
import { LEAVE_TYPE_LABELS, type LeaveRequest } from "@/lib/leaves";

interface LeaveDetailsDrawerProps {
  request: LeaveRequest | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-50 border-emerald-200 text-emerald-600",
  pending: "bg-amber-50 border-amber-200 text-amber-600",
  rejected: "bg-red-50 border-red-200 text-red-600",
};

export default function LeaveDetailsDrawer({ request, onClose }: LeaveDetailsDrawerProps) {
  useEffect(() => {
    if (request) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [request]);

  return (
    <AnimatePresence>
      {request && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-white/95 backdrop-blur-2xl border-l border-[var(--border-light)] shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/80" />
                <h2 className="text-sm font-extrabold text-white">Leave Details</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Employee Information */}
              <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 mb-3">
                  <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Employee Information</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-base text-white font-bold shrink-0">
                    {(request.employeeName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">{request.employeeName}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">#{request.employeeId}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Leave Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Type</p>
                    <p className="font-bold text-[#111827]">{LEAVE_TYPE_LABELS[request.leaveType]}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold ${STATUS_BADGE[request.status] || STATUS_BADGE.pending}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Start Date</p>
                    <p className="font-bold text-[#111827] tabular-nums">{request.startDate}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">End Date</p>
                    <p className="font-bold text-[#111827] tabular-nums">{request.endDate}</p>
                  </div>
                  <div className="col-span-2 bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Applied</p>
                    <p className="font-bold text-[#111827] tabular-nums">{formatFirebaseDate(request.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Reason</h3>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed bg-white/60 rounded-xl px-3 py-2.5">
                  {request.reason}
                </p>
              </div>

              {/* Attachment */}
              {request.attachmentUrl && (
                <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Attachment</h3>
                  </div>
                  <a
                    href={request.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)] hover:underline bg-white/60 rounded-xl px-3 py-2.5"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{request.attachmentName || "View Attachment"}</span>
                  </a>
                </div>
              )}

              {/* Admin Note */}
              {request.adminNote && (
                <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Admin Note</h3>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed bg-white/60 rounded-xl px-3 py-2.5">
                    {request.adminNote}
                  </p>
                </div>
              )}

              {/* Approval History */}
              <div className="hrms-glass rounded-[16px] p-4 border border-[var(--border-light)] bg-white/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <h3 className="text-[11px] font-extrabold text-[#111827] uppercase tracking-wider">Approval History</h3>
                </div>
                <div className="relative">
                  <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-[var(--color-primary)]/30 to-transparent rounded-full" />
                  <div className="space-y-3">
                    <div className="relative flex gap-3 pl-4">
                      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-2 ring-white" />
                      <div>
                        <p className="text-[11px] font-bold text-[#111827]">Request Submitted</p>
                        <p className="text-[10px] text-zinc-400">{formatFirebaseDate(request.createdAt)}</p>
                      </div>
                    </div>
                    {request.approvedAt && (
                      <div className="relative flex gap-3 pl-4">
                        <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                          request.status === "approved" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        <div>
                          <p className="text-[11px] font-bold text-[#111827] capitalize">
                            {request.status === "approved" ? "Approved" : "Rejected"}
                          </p>
                          <p className="text-[10px] text-zinc-400">{formatFirebaseDate(request.approvedAt)}</p>
                          {request.approvedBy && (
                            <p className="text-[10px] text-zinc-400">By: {request.approvedBy}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!request.approvedAt && (
                      <div className="relative flex gap-3 pl-4">
                        <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
                        <div>
                          <p className="text-[11px] font-bold text-amber-600">Awaiting Approval</p>
                          <p className="text-[10px] text-zinc-400">Pending review by admin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
