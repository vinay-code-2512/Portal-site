"use client";

import { Megaphone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const ANNOUNCEMENTS = [
  {
    title: "Q2 Town Hall",
    date: "Jun 15, 2026",
    body: "Quarterly all-hands meeting at 3 PM in the main auditorium. Attendance is mandatory.",
    priority: "High",
  },
  {
    title: "Policy Update",
    date: "Jun 10, 2026",
    body: "Remote work policy updated. Employees can now work remotely up to 3 days per week.",
    priority: "Medium",
  },
  {
    title: "Holiday Notice",
    date: "Jun 8, 2026",
    body: "Office will remain closed on Jun 19th for the national holiday.",
    priority: "Low",
  },
];

export default function Announcements() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
            Announcements
          </h3>
        </div>
        <button className="flex items-center gap-1 text-[10px] text-[var(--color-primary-light)] hover:brightness-110 font-bold transition-all cursor-pointer">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {ANNOUNCEMENTS.map((a) => {
          const isHigh = a.priority === "High";
          return (
            <div
              key={a.title}
              className={`p-3.5 rounded-xl transition-all duration-200 border ${
                isHigh
                  ? "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20 shadow-[0_0_12px_rgba(91,76,255,0.06)]"
                  : "bg-white/40 border-[var(--border-light)] hover:bg-white/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHigh ? "bg-[var(--color-primary)] animate-pulse" : "bg-zinc-400"}`} />
                  <h4 className="text-xs font-bold text-[#111827] truncate">
                    {a.title}
                  </h4>
                </div>
                <span
                  className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                    isHigh
                      ? "text-[var(--color-primary)] bg-[var(--color-primary-dim)] border-[var(--color-primary)]/25"
                      : a.priority === "Medium"
                      ? "text-amber-600 bg-amber-500/10 border-amber-500/15"
                      : "text-zinc-500 bg-zinc-500/10 border-zinc-500/15"
                  }`}
                >
                  {a.priority}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed font-medium">
                {a.body}
              </p>
              <div className="flex justify-end mt-2">
                <span className="text-[9px] text-zinc-400 font-semibold tabular-nums">
                  {a.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
