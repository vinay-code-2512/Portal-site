"use client";

import { motion } from "framer-motion";
import { CheckSquare, Clock, Award } from "lucide-react";
import type { AdminDashboardData } from "@/hooks/useAdminDashboard";

interface ProductivitySnapshotProps {
  attendancePercent: number;
}

export default function ProductivitySnapshot({ attendancePercent }: ProductivitySnapshotProps) {
  const items = [
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Tasks Completed",
      value: "—",
      color: "text-purple-400",
      note: "Requires task module",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Hours Logged",
      value: "—",
      color: "text-[var(--color-primary-light)]",
      note: "Requires task module",
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: "Attendance Score",
      value: `${attendancePercent}%`,
      color: "text-emerald-400",
      note: "Today's attendance",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-7"
    >
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Productivity Snapshot</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 ${item.color}`}>
              {item.icon}
            </div>
            <p className="text-lg font-bold text-white tabular-nums">{item.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{item.label}</p>
            {item.note && <p className="text-[8px] text-zinc-600 mt-1">{item.note}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
