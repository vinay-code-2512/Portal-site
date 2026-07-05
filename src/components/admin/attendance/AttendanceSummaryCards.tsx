"use client";

import { motion } from "framer-motion";
import { UserCheck, UserX, Clock, CalendarDays, TrendingUp, Activity, TrendingDown } from "lucide-react";
import type { AttendanceDateStats, EnrichedAttendance } from "@/lib/adminAttendance";

interface AttendanceSummaryCardsProps {
  stats: AttendanceDateStats;
  records: EnrichedAttendance[];
  activeFilter?: string | null;
  onCardClick?: (status: string | null) => void;
}

export default function AttendanceSummaryCards({ stats, records, activeFilter, onCardClick }: AttendanceSummaryCardsProps) {
  // Active Sessions: present or late, not on break, and not checked out
  const activeSessions = records.filter(
    (r) =>
      (r.status === "present" || r.status === "late") &&
      !r.breaks?.some((b) => b && !b.end)
  ).length;

  const cards = [
    {
      label: "Present Today",
      value: stats.present,
      icon: UserCheck,
      trend: { text: "Active", direction: "up" as const },
      filter: "present",
    },
    {
      label: "Absent Today",
      value: stats.absent,
      icon: UserX,
      trend: { text: "Target < 5%", direction: "down" as const },
      filter: "absent",
    },
    {
      label: "Late Today",
      value: stats.late,
      icon: Clock,
      trend: { text: "Grace: 15m", direction: "neutral" as const },
      filter: "late",
    },
    {
      label: "On Leave",
      value: stats.onLeave,
      icon: CalendarDays,
      trend: { text: "Approved", direction: "up" as const },
      filter: "on-leave",
    },
    {
      label: "Attendance Rate",
      value: `${stats.attendancePercent}%`,
      icon: TrendingUp,
      trend: { text: "+1.2% MoM", direction: "up" as const },
    },
    {
      label: "Active Sessions",
      value: activeSessions,
      icon: Activity,
      trend: { text: "Live Now", direction: "up" as const, animate: true },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={card.filter ? { y: -4, scale: 1.02 } : undefined}
            onClick={() => card.filter && onCardClick?.(activeFilter === card.filter ? null : card.filter)}
            className={`hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between min-h-[120px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 ${card.filter ? 'cursor-pointer' : 'cursor-default'} ${activeFilter === card.filter ? 'ring-2 ring-[var(--color-primary)]/50 bg-[var(--color-primary-dim)]' : ''}`}
          >
            {/* Background Glow Effect */}
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300" />

            <div className="flex items-start justify-between">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                {card.label}
              </span>
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:bg-[var(--color-primary)]/20 transition-all duration-300">
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                {card.value}
              </h4>
              <div className="flex items-center gap-1.5 mt-1.5">
                {card.trend.animate && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-primary)]"></span>
                  </span>
                )}
                {card.trend.direction === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {card.trend.direction === "down" && <TrendingDown className="w-3 h-3 text-rose-400" />}
                <span className="text-[10px] font-bold text-zinc-400">
                  {card.trend.text}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

