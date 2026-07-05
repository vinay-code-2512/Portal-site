"use client";

import { motion } from "framer-motion";
import { Coffee, Check, LogOut, Activity } from "lucide-react";
import type { EnrichedAttendance } from "@/lib/adminAttendance";

interface LiveMonitorProps {
  records: EnrichedAttendance[];
}

export default function LiveMonitor({ records }: LiveMonitorProps) {
  // Classification
  const onBreak = records.filter((r) => r.breaks?.some((b) => b && !b.end));
  const checkedOut = records.filter((r) => r.status === "checked-out");
  const checkedIn = records.filter((r) => r.status !== "absent" && r.status !== "on-leave");
  
  // Working = Present or Late check-in, and not currently on break, and not checked out
  const working = records.filter(
    (r) =>
      (r.status === "present" || r.status === "late") &&
      !r.breaks?.some((b) => b && !b.end)
  );

  const sections = [
    {
      title: "Currently Working",
      count: working.length,
      icon: (
        <span className="relative flex w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full w-3 h-3 bg-emerald-500" />
        </span>
      ),
      list: working,
      color: "text-emerald-600 bg-emerald-500/10",
    },
    {
      title: "On Break",
      count: onBreak.length,
      icon: <Coffee className="w-3.5 h-3.5 text-amber-500" />,
      list: onBreak,
      color: "text-amber-600 bg-amber-500/10",
    },
    {
      title: "Checked Out",
      count: checkedOut.length,
      icon: <LogOut className="w-3.5 h-3.5 text-zinc-400" />,
      list: checkedOut,
      color: "text-zinc-500 bg-zinc-500/10",
    },
    {
      title: "Checked In Today",
      count: checkedIn.length,
      icon: <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />,
      list: checkedIn,
      color: "text-[var(--color-primary)] bg-[var(--color-primary-dim)]",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2.5">
        <Activity className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Live Presence Monitor
        </h3>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto max-h-[560px] pr-1 scrollbar-thin">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sec.icon}
                <span className="text-xs font-bold text-zinc-700">
                  {sec.title}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${sec.color}`}>
                {sec.count}
              </span>
            </div>

            {sec.list.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic pl-5">No employees in this status</p>
            ) : (
              <div className="flex flex-col gap-1.5 pl-5">
                {sec.list.map((emp) => {
                  const initials = emp.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={emp.uid}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-[var(--border-light)]/40 bg-white/40 hover:bg-white/60 transition-all duration-200 text-[10px] truncate"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden shadow-sm ring-2 ring-white/50">
                        {emp.photoURL ? (
                          <img src={emp.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="font-bold text-zinc-700 truncate flex-1">
                        {emp.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
