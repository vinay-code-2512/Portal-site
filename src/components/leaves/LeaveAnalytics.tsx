"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Building2 } from "lucide-react";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/leaves";

interface AnalyticsData {
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  byDepartment: Record<string, number>;
}

interface LeaveAnalyticsProps {
  data: AnalyticsData | null;
  loading?: boolean;
}

export default function LeaveAnalytics({ data, loading }: LeaveAnalyticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white/40 rounded-[20px] animate-pulse border border-[var(--border-light)]/30" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center py-10 text-center">
        <BarChart3 className="w-8 h-8 text-zinc-300 mb-2" />
        <p className="text-xs text-zinc-400 font-semibold">No analytics data available</p>
      </div>
    );
  }

  const { byType, byMonth, byDepartment } = data;
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const deptEntries = Object.entries(byDepartment).sort((a, b) => b[1] - a[1]);

  const typeMax = Math.max(...typeEntries.map(([, v]) => v), 1);
  const monthMax = Math.max(...monthEntries.map(([, v]) => v), 1);
  const deptMax = Math.max(...deptEntries.map(([, v]) => v), 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Leave Usage by Type */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xs font-extrabold text-[#111827]">Leave Usage</h3>
        </div>
        <div className="space-y-3">
          {typeEntries.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No data</p>
          ) : (
            typeEntries.map(([type, count]) => {
              const pct = (count / typeMax) * 100;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-semibold">{LEAVE_TYPE_LABELS[type as LeaveType] || type}</span>
                    <span className="text-[#111827] font-extrabold tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Monthly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xs font-extrabold text-[#111827]">Monthly Leave Trends</h3>
        </div>
        <div className="space-y-2">
          {monthEntries.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No data</p>
          ) : (
            monthEntries.map(([month, count]) => {
              const shortMonth = month.slice(5);
              const pct = (count / monthMax) * 100;
              return (
                <div key={month} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold w-8 shrink-0 tabular-nums">
                    {shortMonth}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-[var(--color-primary-light)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold w-5 text-right tabular-nums">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Department Leave Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-xs font-extrabold text-[#111827]">Department Distribution</h3>
        </div>
        <div className="space-y-2.5">
          {deptEntries.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No department data</p>
          ) : (
            deptEntries.map(([dept, count]) => {
              const pct = (count / deptMax) * 100;
              return (
                <div key={dept}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-semibold">{dept}</span>
                    <span className="text-[#111827] font-extrabold tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-violet-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
