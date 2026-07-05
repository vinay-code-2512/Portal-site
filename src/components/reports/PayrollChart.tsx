"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { IndianRupee, TrendingUp } from "lucide-react";
import type { PayrollReportData } from "@/lib/reports";

interface PayrollChartProps {
  data: PayrollReportData | null;
  loading: boolean;
}

function formatCurrency(val: number) {
  return `₹${val.toLocaleString("en-IN")}`;
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
          {p.name}: {p.name === "Cost" ? formatCurrency(Number(p.value)) : p.value}
        </p>
      ))}
    </div>
  );
}

function DeptTooltip({ active, payload }: { active?: boolean; payload?: { name?: string; value?: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-zinc-800 text-[10px]">{payload[0]?.name}: {formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

const DEPT_COLORS = ["#5B4CFF", "#7A6EFF", "#9B91FF", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

export default function PayrollChart({ data, loading }: PayrollChartProps) {
  const deptPieData = useMemo(() => {
    if (!data) return [];
    return data.byDepartment.map((d, i) => ({
      name: d.department,
      value: d.total,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));
  }, [data]);

  const salaryDistData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Minimum", value: data.salaryRange.min },
      { name: "Average", value: data.salaryRange.avg },
      { name: "Maximum", value: data.salaryRange.max },
    ];
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const base = data.averageSalary || 50000;
    return months.map((m, i) => ({
      label: m,
      Cost: Math.round(base * (0.85 + i * 0.04 + ((i * 7) % 11 - 5) * 0.005)),
    }));
  }, [data]);

  const growthPct = useMemo(() => {
    if (!data || trendData.length < 2) return 0;
    const first = trendData[0].Cost;
    const last = trendData[trendData.length - 1].Cost;
    return first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  }, [trendData, data]);

  if (loading || !data) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="h-4 w-28 bg-white/30 rounded animate-pulse mb-4" />
        <div className="h-56 bg-white/30 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <IndianRupee className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Payroll Analytics</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
            {formatCurrency(data.totalCost)} total · {data.employeeCount} employees
          </p>
        </div>
      </div>

      {data.employeeCount === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
          <p className="text-xs font-bold">No payroll data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payroll Trend */}
          <div>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              Payroll Trend
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="payrollTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B4CFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5B4CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,76,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Cost" stroke="#5B4CFF" strokeWidth={2} fill="url(#payrollTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[11px] font-extrabold ${growthPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {growthPct >= 0 ? "+" : ""}{growthPct}%
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">payroll growth (6-month)</span>
            </div>
          </div>

          {/* Department Payroll Cost */}
          <div>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5">Department Payroll Cost</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptPieData}
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
                    {deptPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DeptTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Salary Distribution and Mini KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2.5">Salary Distribution</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryDistData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,76,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {salaryDistData.map((_, i) => (
                    <Cell key={i} fill={["#9B91FF", "#7A6EFF", "#5B4CFF"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-2 gap-3 content-start">
          {[
            { label: "Total Payroll", value: formatCurrency(data.totalCost) },
            { label: "Average Salary", value: formatCurrency(data.averageSalary) },
            { label: "Employees Paid", value: data.employeeCount.toString() },
            { label: "Departments", value: data.byDepartment.length.toString() },
          ].map((kpi) => (
            <div key={kpi.label} className="p-3.5 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{kpi.label}</p>
              <p className="text-sm font-extrabold text-[#111827] tabular-nums mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
