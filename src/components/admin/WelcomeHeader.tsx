"use client";

import { motion } from "framer-motion";
import { UserPlus, FileText } from "lucide-react";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function WelcomeHeader() {
  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white italic">
            Hello, <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary-glow)] bg-clip-text text-transparent">Admin</span>
          </h2>
          <p className="text-xs text-zinc-500">{formatDate(now)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs font-bold shadow-[0_4px_16px_rgba(80,57,240,0.35)] hover:shadow-[0_6px_24px_rgba(80,57,240,0.45)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
          <button className="min-h-[44px] px-5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs font-bold hover:bg-white/[0.1] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            View Reports
          </button>
        </div>
      </div>
    </motion.div>
  );
}
