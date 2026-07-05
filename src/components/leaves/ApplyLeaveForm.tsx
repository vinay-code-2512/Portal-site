"use client";

import { useState, useRef, type FormEvent } from "react";
import { Send, Loader2, Paperclip, X, File } from "lucide-react";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, type LeaveType, type LeaveBalanceMap } from "@/lib/leaves";

interface ApplyLeaveFormProps {
  balances: LeaveBalanceMap | null;
  onSubmit: (leaveType: LeaveType, startDate: string, endDate: string, reason: string, attachment?: File | null) => Promise<void>;
}

export default function ApplyLeaveForm({ balances, onSubmit }: ApplyLeaveFormProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = "w-full min-h-[44px] px-4 rounded-xl bg-white/70 backdrop-blur-sm border border-[var(--color-primary)]/20 text-sm text-[#111827] placeholder-zinc-400 focus:outline-none focus:border-[var(--color-primary)]/60 focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all appearance-none";

  const remaining = balances ? balances[leaveType].remaining : 0;
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!startDate) { setError("Start date is required"); return; }
    if (!endDate) { setError("End date is required"); return; }
    if (endDate < startDate) { setError("End date must be on or after start date"); return; }
    if (!reason.trim()) { setError("Reason is required"); return; }
    if (remaining <= 0) { setError(`No ${LEAVE_TYPE_LABELS[leaveType]} balance remaining`); return; }

    try {
      setLoading(true);
      await onSubmit(leaveType, startDate, endDate, reason.trim(), attachment);
      setSuccess("Leave request submitted successfully!");
      setStartDate("");
      setEndDate("");
      setReason("");
      setAttachment(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">Apply for Leave</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">Submit a new leave request</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold">{success}</div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Leave Type</label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          className={inputClass + " cursor-pointer"}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t} disabled={balances ? balances[t].remaining <= 0 : false}>
              {LEAVE_TYPE_LABELS[t]} {balances ? `(${balances[t].remaining} left)` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate && e.target.value > endDate) setEndDate(e.target.value);
            }}
            min={today}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || today}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Tell us why you need leave..."
          className="w-full min-h-[80px] px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-[var(--color-primary)]/20 text-sm text-[#111827] placeholder-zinc-400 focus:outline-none focus:border-[var(--color-primary)]/60 focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Attachment (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setAttachment(f);
          }}
        />
        {attachment ? (
          <div className="flex items-center gap-3 w-full min-h-[44px] px-4 rounded-xl bg-white/70 backdrop-blur-sm border border-[var(--color-primary)]/20 text-sm text-[#111827]">
            <File className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            <span className="flex-1 truncate font-medium">{attachment.name}</span>
            <span className="text-[10px] text-zinc-400 tabular-nums">{(attachment.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="p-1 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 w-full min-h-[44px] px-4 rounded-xl bg-white/70 backdrop-blur-sm border border-dashed border-[var(--color-primary)]/20 text-sm text-zinc-400 cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <Paperclip className="w-4 h-4 text-zinc-400" />
            <span>Attach supporting document</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-sm font-bold shadow-[0_4px_16px_rgba(80,57,240,0.25)] hover:shadow-[0_6px_24px_rgba(80,57,240,0.35)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Submit Leave Request
      </button>
    </form>
  );
}
