"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { MonthlyStats } from "@/hooks/useAttendance";

interface AttendanceStatusCardProps {
  stats: MonthlyStats | null;
  loading?: boolean;
}

interface StatusDisplay {
  label: string;
  key: keyof MonthlyStats;
  icon: typeof CheckCircle;
  color: string;
}

const statuses: StatusDisplay[] = [
  { label: "Present", key: "present", icon: CheckCircle, color: "emerald" },
  { label: "Late", key: "late", icon: AlertTriangle, color: "amber" },
  { label: "Absent", key: "absent", icon: XCircle, color: "red" },
  { label: "Half Day", key: "halfDay", icon: Clock, color: "purple" },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.15)]",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-400",
    glow: "shadow-[0_0_16px_rgba(251,191,36,0.15)]",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    text: "text-red-400",
    glow: "shadow-[0_0_16px_rgba(239,68,68,0.15)]",
  },
    purple: {
        bg: "bg-[var(--color-primary-dim)]",
        border: "border-[var(--color-primary)]/25",
        text: "text-[var(--color-primary-light)]",
        glow: "shadow-[0_0_16px_var(--color-primary-glow)]",
    },
};

export default function AttendanceStatusCard({ stats, loading }: AttendanceStatusCardProps) {
  const hasData = stats && stats.total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="hrms-glass rounded-[20px] p-5 hrms-attendance-card"
    >
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
        Attendance Status
      </p>

      {!loading && !hasData ? (
        <EmptyState
          icon={<CheckCircle className="w-6 h-6" />}
          title="No attendance records this month"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {statuses.map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color];
            const count = stats?.[item.key] ?? 0;
            const active = count > 0;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  active
                    ? `${c.bg} ${c.border} ${c.glow}`
                    : "bg-white/[0.02] border-white/5 opacity-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? c.text : "text-zinc-600"}`} />
                <div>
                  <span className={`text-xs font-semibold ${active ? "text-white" : "text-zinc-500"}`}>
                    {item.label}
                  </span>
                  <p className={`text-[10px] font-bold ${active ? c.text : "text-zinc-600"}`}>
                    {count}
                  </p>
                </div>
                {active && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${c.text.replace("text-", "bg-")} shadow-[0_0_8px_rgba(52,211,153,0.6)]`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
