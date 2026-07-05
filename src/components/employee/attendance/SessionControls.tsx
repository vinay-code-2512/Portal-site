"use client";

import { motion } from "framer-motion";
import { LogIn, LogOut, Coffee, Play } from "lucide-react";
import type { SessionStatus } from "@/hooks/useTimeTracker";

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

interface SessionControlsProps {
  sessionStatus: SessionStatus;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  currentBreakMs: number;
  loading?: boolean;
}

export default function SessionControls({
  sessionStatus,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  currentBreakMs,
  loading,
}: SessionControlsProps) {
  if (sessionStatus === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <button
          onClick={onCheckIn}
          disabled={loading}
          className="w-full sm:w-auto min-h-[56px] px-10 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-lg font-bold shadow-[0_8px_32px_var(--color-primary-glow)] hover:shadow-[0_12px_40px_var(--color-primary-glow)] disabled:opacity-50 transition-all duration-200 btn-cta-pulse cursor-pointer flex items-center justify-center gap-2.5"
        >
          <LogIn className="w-5 h-5" />
          Check In
        </button>
      </motion.div>
    );
  }

  if (sessionStatus === "on-break") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="text-center sm:text-left">
          <p className="text-sm text-amber-400 font-semibold">On Break</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatMs(currentBreakMs)}
          </p>
        </div>
        <button
          onClick={onEndBreak}
          disabled={loading}
          className="w-full sm:w-auto min-h-[56px] px-10 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-lg font-bold shadow-[0_8px_32px_var(--color-primary-glow)] hover:shadow-[0_12px_40px_var(--color-primary-glow)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Play className="w-5 h-5" />
          Resume Work
        </button>
      </motion.div>
    );
  }

  if (sessionStatus === "checked-out") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 text-center"
      >
        <p className="text-sm text-zinc-400">You have checked out for today</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <button
        onClick={onCheckOut}
        disabled={loading}
        className="flex-1 min-h-[56px] rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-base font-bold shadow-[0_4px_20px_rgba(239,68,68,0.25)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.35)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Check Out
      </button>
      <button
        onClick={onStartBreak}
        disabled={loading}
        className="flex-1 min-h-[56px] rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-bold shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.35)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <Coffee className="w-5 h-5" />
        Take Break
      </button>
    </motion.div>
  );
}
