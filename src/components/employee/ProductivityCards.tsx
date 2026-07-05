"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Clock, TrendingUp } from "lucide-react";

interface TaskStats {
  completed: number;
  pending: number;
  hoursLogged: string;
  weeklyScore: string;
}

interface ProductivityCardsProps {
  taskStats?: TaskStats | null;
}

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_16px_rgba(52,211,153,0.1)]" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_16px_rgba(251,191,36,0.1)]" },
  blue: { bg: "bg-[var(--color-primary-dim)]", text: "text-[var(--color-primary-light)]", glow: "shadow-[0_0_16px_var(--color-primary-glow)]" },
  purple: { bg: "bg-[var(--color-primary-dim)]", text: "text-[var(--color-primary-light)]", glow: "shadow-[0_0_16px_var(--color-primary-glow)]" },
};

const dataFields = [
  { key: "completed", label: "Tasks Completed", icon: CheckCircle, color: "emerald" },
  { key: "pending", label: "Tasks Pending", icon: Circle, color: "amber" },
  { key: "hoursLogged", label: "Hours Logged", icon: Clock, color: "blue" },
  { key: "weeklyScore", label: "Weekly Score", icon: TrendingUp, color: "purple" },
] as const;

export default function ProductivityCards({ taskStats }: ProductivityCardsProps) {
  if (!taskStats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="hrms-glass rounded-[20px] p-5"
    >
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
        Productivity Summary
      </p>

      <div className="grid grid-cols-2 gap-3">
        {dataFields.map((field) => {
          const Icon = field.icon;
          const c = colorMap[field.color];
          const value = taskStats[field.key as keyof TaskStats];
          return (
            <div
              key={field.label}
              className={`rounded-xl ${c.bg} border border-white/5 p-3.5 ${c.glow}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">
                {field.label}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
