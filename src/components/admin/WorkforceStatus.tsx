"use client";

import { motion } from "framer-motion";
import { Users, CalendarOff, UserX, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { WorkforceEntry } from "@/hooks/useAdminDashboard";

interface WorkforceStatusProps {
  workforce: WorkforceEntry[];
}

export default function WorkforceStatus({ workforce }: WorkforceStatusProps) {
  const total = workforce.length || 1;
  const active = workforce.filter((w) =>
    ["present", "break", "late", "checked-out"].includes(w.status)
  ).length;
  const onLeave = workforce.filter((w) => w.status === "on-leave").length;
  const absentCount = workforce.filter((w) => w.status === "absent").length;
  const late = workforce.filter((w) => w.status === "late").length;

  const stats = [
    {
      title: "Active Employees",
      count: active,
      percent: Math.round((active / total) * 100),
      icon: <Users className="w-4 h-4 text-[var(--color-primary)]" />,
      trend: "+1.2%",
      isPositive: true,
    },
    {
      title: "On Leave",
      count: onLeave,
      percent: Math.round((onLeave / total) * 100),
      icon: <CalendarOff className="w-4 h-4 text-[var(--color-primary)]" />,
      trend: "+0.4%",
      isPositive: false, // neutral/negative
    },
    {
      title: "Absent Today",
      count: absentCount,
      percent: Math.round((absentCount / total) * 100),
      icon: <UserX className="w-4 h-4 text-[var(--color-primary)]" />,
      trend: "-1.5%",
      isPositive: true, // fewer absences is positive
    },
    {
      title: "Late Today",
      count: late,
      percent: Math.round((late / total) * 100),
      icon: <Clock className="w-4 h-4 text-[var(--color-primary)]" />,
      trend: "-0.8%",
      isPositive: true, // fewer late arrivals is positive
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Workforce Status
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-5">
          Real-time summary of today&apos;s staff metrics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((s) => (
          <motion.div
            key={s.title}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="hrms-glass bg-white/45 border border-[var(--border-light)] rounded-[16px] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                {s.icon}
              </div>
              <span
                className={`text-[9px] font-bold flex items-center gap-0.5 ${
                  s.isPositive ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {s.isPositive ? (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                )}
                {s.trend}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#111827] tabular-nums">
                  {s.count}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tabular-nums">
                  {s.percent}%
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mt-1">
                {s.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
