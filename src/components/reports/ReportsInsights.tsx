"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Insight {
  icon: typeof TrendingUp;
  iconColor: string;
  iconBg: string;
  text: string;
  trend: "up" | "down" | "neutral";
}

interface ReportsInsightsProps {
  insights?: Insight[];
}

const DEFAULT_INSIGHTS: Insight[] = [
  {
    icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    text: "Attendance increased by 8% compared to last month.",
    trend: "up",
  },
  {
    icon: TrendingDown,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-500/10",
    text: "Payroll cost reduced by 3% due to optimized resource allocation.",
    trend: "down",
  },
  {
    icon: TrendingUp,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-500/10",
    text: "Leave requests increased by 15% this month — peak season trend.",
    trend: "up",
  },
  {
    icon: Minus,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-500/10",
    text: "Employee productivity score is stable at 87% across departments.",
    trend: "neutral",
  },
];

export default function ReportsInsights({ insights }: ReportsInsightsProps) {
  const items = insights || DEFAULT_INSIGHTS;

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">AI Insights</h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Smart analytics summary</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {items.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/30 border border-[var(--border-light)]/30 hover:bg-white/40 transition-all"
            >
              <div className={`w-7 h-7 rounded-lg ${insight.iconBg} flex items-center justify-center shrink-0 ${insight.iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
