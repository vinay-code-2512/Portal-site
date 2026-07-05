"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, CalendarOff, TrendingUp, Umbrella } from "lucide-react";

interface AdminLeaveOverviewProps {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  employeesOnLeave?: number;
  leaveUtilization?: number;
  leaveBalance?: number;
  loading?: boolean;
}

export default function AdminLeaveOverview({
  pendingCount, approvedToday, rejectedToday,
  employeesOnLeave, leaveUtilization, leaveBalance,
  loading,
}: AdminLeaveOverviewProps) {
  const cards = [
    { label: "Pending Requests", value: pendingCount, icon: Clock, color: "text-amber-500" },
    { label: "Approved Leaves", value: approvedToday, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Rejected Leaves", value: rejectedToday, icon: XCircle, color: "text-red-500" },
    { label: "Employees On Leave", value: employeesOnLeave ?? "—", icon: CalendarOff, color: "text-[var(--color-primary-light)]" },
    { label: "Leave Utilization", value: leaveUtilization != null ? `${leaveUtilization}%` : "—", icon: TrendingUp, color: "text-violet-500" },
    { label: "Leave Balance", value: leaveBalance ?? "—", icon: Umbrella, color: "text-sky-500" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-white/40 rounded-[20px] animate-pulse border border-[var(--border-light)]/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="hrms-glass rounded-[20px] p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className={`text-xl font-extrabold tabular-nums ${card.color}`}>{card.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-bold">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
