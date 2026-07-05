"use client";

import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { CalendarClock } from "lucide-react";
import type { LeaveReportData } from "@/lib/reports";

interface LeaveChartProps {
  data: LeaveReportData | null;
  loading: boolean;
}

interface TooltipPayloadEntry {
  color?: string;
  name?: string;
  value?: number | string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-zinc-800 mb-1" style={{ fontSize: "10px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color ?? "#71717a", fontSize: "10px" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function DeptTooltip({ active, payload }: { active?: boolean; payload?: { name?: string; value?: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-zinc-800 text-[10px]">{payload[0]?.name}: {payload[0]?.value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  approved: "#10b981",
  rejected: "#f43f5e",
  pending: "#f59e0b",
};

const DEPT_PALETTE = ["#5B4CFF", "#7A6EFF", "#9B91FF", "#10b981", "#f59e0b", "#f43f5e"];

export default function LeaveChart({ data, loading }: LeaveChartProps) {
  if (loading || !data) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="h-4 w-24 bg-white/30 rounded animate-pulse mb-4" />
        <div className="h-56 bg-white/30 rounded animate-pulse" />
      </div>
    );
  }

  const pieData = data.byDepartment.map((d, i) => ({
    name: d.department,
    value: d.approved + d.rejected + d.pending,
    fill: DEPT_PALETTE[i % DEPT_PALETTE.length],
  }));

  const approvalRate = data.summary.total > 0
    ? Math.round((data.summary.approved / data.summary.total) * 100)
    : 0;

  const leaveUtilization = data.byDepartment.length > 0
    ? Math.round((data.byDepartment.reduce((s, d) => s + d.approved, 0) / Math.max(data.byDepartment.length, 1)) * 10)
    : 0;

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <CalendarClock className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Leave Analytics</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
            {data.summary.total} total requests
          </p>
        </div>
      </div>

      {data.summary.total === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
          <p className="text-xs font-bold">No leave data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Type Breakdown + Approval Rate */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5">Leave Type Breakdown</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byStatus} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,76,255,0.06)" />
                    <XAxis dataKey="status" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {data.byStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#5B4CFF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Approval + Utilization Mini Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Approval Rate</p>
                <p className="text-lg font-extrabold text-emerald-600 tabular-nums mt-0.5">{approvalRate}%</p>
                <div className="h-1.5 rounded-full bg-white/30 overflow-hidden mt-1">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${approvalRate}%` }} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Leave Utilization</p>
                <p className="text-lg font-extrabold text-[var(--color-primary)] tabular-nums mt-0.5">{leaveUtilization}%</p>
                <div className="h-1.5 rounded-full bg-white/30 overflow-hidden mt-1">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${leaveUtilization}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Leave Requests + Department */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5">Department Distribution</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={35}
                      label={(entry: unknown) => {
                        const e = entry as Record<string, unknown>;
                        return `${e.name ?? ""} ${((Number(e.percent) ?? 0) * 100).toFixed(0)}%`;
                      }}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<DeptTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
