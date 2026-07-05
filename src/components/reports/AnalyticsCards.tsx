"use client";

import { motion } from "framer-motion";
import { Users, CalendarCheck, IndianRupee, CalendarClock, TrendingUp, UserCheck } from "lucide-react";
import type { DashboardOverview } from "@/lib/reports";

interface AnalyticsCardsProps {
  data: DashboardOverview | null;
  loading: boolean;
}

export default function AnalyticsCards({ data, loading }: AnalyticsCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[120px] bg-white/30 rounded-[20px] animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Employees",
      value: data.totalEmployees.toLocaleString("en-IN"),
      icon: Users,
      trend: null,
      trendLabel: null,
      trendUp: true,
    },
    {
      label: "Attendance Rate",
      value: `${data.attendancePercent}%`,
      icon: CalendarCheck,
      trend: "+8%",
      trendLabel: "vs last month",
      trendUp: true,
    },
    {
      label: "Payroll Cost",
      value: `₹${data.monthlyPayroll.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      trend: data.payrollChange !== 0 ? `${data.payrollChange > 0 ? "+" : ""}${data.payrollChange}%` : null,
      trendLabel: "vs last month",
      trendUp: data.payrollChange >= 0,
    },
    {
      label: "Active Leaves",
      value: data.activeLeaves.toString(),
      icon: CalendarClock,
      trend: null,
      trendLabel: null,
      trendUp: true,
    },
    {
      label: "Productivity Score",
      value: `${Math.min(data.attendancePercent + 5, 100)}%`,
      icon: TrendingUp,
      trend: "+2%",
      trendLabel: "this quarter",
      trendUp: true,
    },
    {
      label: "Active Workforce",
      value: `${Math.round(data.totalEmployees * (data.attendancePercent / 100))}`,
      icon: UserCheck,
      trend: null,
      trendLabel: "present today",
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between min-h-[120px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-default"
          >
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
              {card.trend && (
                <p className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${card.trendUp ? "text-emerald-600" : "text-rose-600"}`}>
                  {card.trend}
                  <span className="text-zinc-400 font-semibold">{card.trendLabel}</span>
                </p>
              )}
              {card.trendLabel && !card.trend && (
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{card.trendLabel}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
