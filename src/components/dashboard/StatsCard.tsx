import { memo, type ReactNode } from "react";
import GlassCard from "./GlassCard";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export default memo(function StatsCard({ icon, label, value, trend, className = "" }: StatsCardProps) {
  return (
    <GlassCard className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary-light)]">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-1">{label}</p>
    </GlassCard>
  );
});
