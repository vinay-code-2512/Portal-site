"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { SessionStatus } from "@/hooks/useTimeTracker";

interface LiveClockCardProps {
  sessionStatus: SessionStatus;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LiveClockCard({ sessionStatus }: LiveClockCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isActive = sessionStatus === "working";
  const isBreak = sessionStatus === "on-break";

  const statusLabel = isActive
    ? "Active Session"
    : isBreak
      ? "On Break"
      : sessionStatus === "checked-out"
        ? "Checked Out"
        : "Not Checked In";

  const statusColor = isActive
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
    : isBreak
      ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
      : "bg-zinc-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`hrms-glass rounded-[20px] p-5 sm:p-7 relative overflow-hidden ${isActive ? "hrms-glass--glow" : ""}`}
    >
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">{getGreeting(now)}</p>
          <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
            {formatTime(now)}
          </p>
          <p className="text-xs text-zinc-500">{formatDate(now)}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? "animate-pulse" : ""} ${statusColor}`} />
          <span className="text-xs text-zinc-400">{statusLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}
