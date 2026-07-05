"use client";

import { ChevronDown, Loader2, ClipboardList, Inbox } from "lucide-react";
import LeaveRequestCard from "./LeaveRequestCard";
import type { LeaveRequest } from "@/lib/leaves";

interface LeaveApprovalQueueProps {
  requests: LeaveRequest[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  actionLoading: string | null;
  onSelectRequest?: (request: LeaveRequest) => void;
}

export default function LeaveApprovalQueue({
  requests, loading, hasMore, loadingMore, onLoadMore,
  onApprove, onReject, actionLoading, onSelectRequest,
}: LeaveApprovalQueueProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-white/40 rounded-[16px] animate-pulse border border-[var(--border-light)]/30" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
          <Inbox className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-extrabold text-[#111827]">All Caught Up!</p>
        <p className="text-xs text-zinc-400 mt-1">No pending leave requests to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <LeaveRequestCard
          key={r.id}
          request={r}
          onApprove={onApprove}
          onReject={onReject}
          actionLoading={actionLoading}
          onSelect={onSelectRequest}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
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
  );
}
