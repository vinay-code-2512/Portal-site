"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User, Calendar } from "lucide-react";
import { markAttendance } from "@/lib/adminAttendance";
import { useAuth } from "@/context/AuthContext";

interface MarkAttendanceModalProps {
  uid?: string | null;
  employeeName?: string;
  selectedDate: string;
  onClose: () => void;
  onDone: () => void;
  absentEmployees?: { uid: string; name: string }[];
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "emerald" },
  { value: "late", label: "Late", color: "orange" },
  { value: "half-day", label: "Half Day", color: "yellow" },
] as const;

export default function MarkAttendanceModal({
  uid,
  employeeName,
  selectedDate,
  onClose,
  onDone,
  absentEmployees = [],
}: MarkAttendanceModalProps) {
  const { currentUser } = useAuth();
  const [selectedUid, setSelectedUid] = useState(uid || (absentEmployees[0]?.uid || ""));
  const [status, setStatus] = useState<"present" | "late" | "half-day">("present");
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState(new Date().getMinutes());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGlobalMark = !uid;

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!selectedUid) {
      setError("Please select an employee");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await markAttendance(selectedUid, selectedDate, status, hour, minute, note || null, currentUser.uid);
      onDone();
    } catch (err: any) {
      setError(err?.message || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (val: string, active: boolean) => {
    if (!active) return "bg-white/35 border border-[var(--border-light)]/40 text-zinc-500 hover:text-zinc-800 hover:bg-white/50";
    switch (val) {
      case "present": return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-bold";
      case "late": return "bg-amber-500/10 border-amber-500/30 text-amber-700 font-bold";
      case "half-day": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 font-bold";
      default: return "";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="hrms-glass rounded-[24px] overflow-hidden w-full max-w-md border border-[var(--border-light)] shadow-2xl bg-white/55 backdrop-blur-md"
        >
          {/* Purple Header */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                Workforce Management
              </span>
              <h2 className="text-base font-extrabold text-white">
                {isGlobalMark ? "Mark Attendance" : `Attendance: ${employeeName}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Employee Selector or Display */}
            {isGlobalMark ? (
              <div>
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Select Employee
                  </span>
                </label>
                <select
                  value={selectedUid}
                  onChange={(e) => setSelectedUid(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer"
                >
                  <option value="" disabled>Choose an employee...</option>
                  {absentEmployees.map((emp) => (
                    <option key={emp.uid} value={emp.uid}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1">
                  Employee
                </label>
                <div className="px-3 py-2 rounded-xl bg-white/30 border border-[var(--border-light)]/20 text-xs font-bold text-zinc-800">
                  {employeeName}
                </div>
              </div>
            )}

            {/* Date Display (Read-only) */}
            <div>
              <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Date
                </span>
              </label>
              <div className="px-3 py-2 rounded-xl bg-white/30 border border-[var(--border-light)]/20 text-xs font-bold text-zinc-800">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Status Option Pills */}
            <div>
              <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${getStatusColor(opt.value, status === opt.value)}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Picker */}
            <div>
              <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Check-in Time
                </span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")} (
                      {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                      )
                    </option>
                  ))}
                </select>
                <span className="text-zinc-500 font-extrabold">:</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes field */}
            <div>
              <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter notes (e.g. Late due to personal reasons)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)] resize-none"
              />
            </div>

            {/* Error alerts */}
            {error && (
              <p className="text-[10px] font-bold text-rose-600 bg-rose-500/10 rounded-xl px-3 py-2 border border-rose-500/25">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {saving ? "Saving..." : `Mark ${status}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
