"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { Building2, Users, CalendarCheck, TrendingUp } from "lucide-react";
import type { DepartmentAnalyticsRow } from "@/lib/reports";

interface DepartmentAnalyticsProps {
  data: DepartmentAnalyticsRow[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name?: string; value?: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-zinc-800 text-[10px]">{payload[0]?.name}: {payload[0]?.value}%</p>
    </div>
  );
}

const DEPT_COLORS = ["#5B4CFF", "#7A6EFF", "#9B91FF", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899"];

function getProductivityScore(attPct: number, leaveCount: number): number {
  return Math.min(Math.round(attPct * 0.7 + (100 - Math.min(leaveCount * 5, 30)) * 0.3), 100);
}

export default function DepartmentAnalytics({ data, loading }: DepartmentAnalyticsProps) {
  const pieData = useMemo(() => {
    return data.map((d, i) => ({
      name: d.department,
      value: d.employeeCount,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[200px] bg-white/30 rounded-[20px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
          <Building2 className="w-6 h-6 mb-2" />
          <p className="text-xs font-bold">No department data available</p>
        </div>
      </div>
    );
  }

  const totalEmployees = data.reduce((s, d) => s + d.employeeCount, 0);

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Building2 className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Department Analytics</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
            {data.length} departments · {totalEmployees} employees
          </p>
        </div>
      </div>

      {/* Donut Chart + Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut */}
        <div className="flex flex-col items-center justify-center">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={(_entry: unknown) =>
                    `${(((_entry as Record<string, number>)?.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold -mt-2">Employee Distribution</p>
        </div>

        {/* Progress Bars */}
        <div className="lg:col-span-2 space-y-4">
          {data.map((dept, i) => {
            const productivity = getProductivityScore(dept.attendancePercent, dept.leaveCount);
            return (
              <motion.div
                key={dept.department}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }}
                    />
                    <span className="text-xs font-bold text-zinc-800">{dept.department}</span>
                    <span className="text-[9px] text-zinc-400 font-semibold">({dept.employeeCount})</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="text-[var(--color-primary)]">{dept.attendancePercent}% att.</span>
                    <span className="text-emerald-600">{productivity}% prod.</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/30 border border-[var(--border-light)]/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dept.attendancePercent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mini KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {[
          { label: "Total Departments", value: data.length.toString(), icon: Building2, color: "text-[var(--color-primary)]" },
          { label: "Total Employees", value: totalEmployees.toString(), icon: Users, color: "text-emerald-600" },
          { label: "Avg Attendance", value: `${Math.round(data.reduce((s, d) => s + d.attendancePercent, 0) / data.length)}%`, icon: CalendarCheck, color: "text-[var(--color-primary)]" },
          { label: "Avg Productivity", value: `${Math.round(data.reduce((s, d) => s + getProductivityScore(d.attendancePercent, d.leaveCount), 0) / data.length)}%`, icon: TrendingUp, color: "text-emerald-600" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-3.5 rounded-xl bg-white/30 border border-[var(--border-light)]/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-sm font-extrabold tabular-nums ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
