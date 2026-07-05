"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ShiftProgressCardProps {
  percentage?: number;
  startTime?: string;
  endTime?: string;
  checkIn?: any;
  checkOut?: any;
  shiftDurationHours?: number;
}

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function formatFirebaseTime(ts: any) {
  const d = toDate(ts);
  if (!d) return null;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function calcProgress(checkIn: any, checkOut: any, shiftHours: number): number {
  const start = toDate(checkIn);
  if (!start) return 0;

  const end = toDate(checkOut);
  if (end) return 100;

  const now = new Date();
  const elapsed = (now.getTime() - start.getTime()) / 1000 / 3600; // hours
  const pct = Math.round((elapsed / shiftHours) * 100);
  return Math.max(0, Math.min(pct, 100));
}

export default function ShiftProgressCard({
  percentage,
  startTime: mockStart,
  endTime: mockEnd,
  checkIn,
  checkOut,
  shiftDurationHours = 8,
}: ShiftProgressCardProps) {
  const startDisplay = checkIn ? formatFirebaseTime(checkIn) : mockStart || "09:00 AM";
  const endDisplay = checkOut ? formatFirebaseTime(checkOut) : mockEnd || "06:00 PM";

  const [progress, setProgress] = useState(() =>
    percentage ?? calcProgress(checkIn, checkOut, shiftDurationHours)
  );

  useEffect(() => {
    if (percentage != null) {
      setProgress(percentage);
      return;
    }

    setProgress(calcProgress(checkIn, checkOut, shiftDurationHours));

    // Update every 60 seconds while shift is active
    if (checkIn && !checkOut) {
      const id = setInterval(() => {
        setProgress(calcProgress(checkIn, checkOut, shiftDurationHours));
      }, 60000);
      return () => clearInterval(id);
    }
  }, [percentage, checkIn, checkOut, shiftDurationHours]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="hrms-glass rounded-[24px] p-8 flex flex-col items-center"
    >
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">
        Shift Progress
      </p>

      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          <motion.circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5039F0" />
              <stop offset="100%" stopColor="#6A55F5" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-3xl font-black text-white"
          >
            {progress}%
          </motion.span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">
            Completed
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8 mt-6 pt-6 border-t border-white/5 w-full justify-center">
        <div className="text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Start</p>
          <p className="text-base font-bold text-zinc-300 mt-0.5">{startDisplay}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">End</p>
          <p className="text-base font-bold text-zinc-300 mt-0.5">{endDisplay}</p>
        </div>
      </div>
    </motion.div>
  );
}
