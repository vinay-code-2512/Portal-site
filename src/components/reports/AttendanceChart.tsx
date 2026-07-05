"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import type { AttendanceReportData } from "@/lib/reports";

interface AttendanceChartProps {
  data: AttendanceReportData | null;
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

export default function AttendanceChart({ data, loading }: AttendanceChartProps) {
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");

  const chartData = useMemo(() => {
    if (!data) return [];
    if (chartMode === "weekly") {
      return data.weekly.map((d) => ({
        label: d.week.slice(5),
        Present: d.present,
        Absent: d.absent,
        Late: d.late,
        "On Leave": d.onLeave,
        rate: d.present + d.late > 0
          ? Math.round(((d.present + d.late) / (d.present + d.absent + d.late + d.onLeave)) * 100)
          : 0,
      }));
    }
    return data.monthly.map((d) => ({
      label: d.month,
      Present: d.present,
      Absent: d.absent,
      Late: d.late,
      "On Leave": d.onLeave,
      rate: d.present + d.late > 0
        ? Math.round(((d.present + d.late) / (d.present + d.absent + d.late + d.onLeave)) * 100)
        : 0,
    }));
  }, [data, chartMode]);

  const growthData = useMemo(() => {
    if (!data) return [];
    return data.weekly.slice(-4).map((d, i) => ({
      label: `W${i + 1}`,
      rate: d.present + d.late > 0
        ? Math.round(((d.present + d.late) / (d.present + d.absent + d.late + d.onLeave)) * 100)
        : 0,
    }));
  }, [data]);

  if (loading || !data) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="h-4 w-36 bg-white/30 rounded animate-pulse mb-4" />
        <div className="h-56 bg-white/30 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Attendance Analytics</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              {data.summary.total} total records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/35 p-0.5 rounded-xl border border-[var(--border-light)]/50">
          {(["weekly", "monthly"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setChartMode(m)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                chartMode === m
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800 hover:bg-white/40"
              }`}
            >
              {m === "weekly" ? "Weekly Trend" : "Monthly Trend"}
            </button>
          ))}
        </div>
      </div>

      {data.summary.total === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-zinc-400">
          <p className="text-xs font-bold">No attendance data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Trend Chart */}
          <div className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,76,255,0.06)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Present" fill="#5B4CFF" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="On Leave" fill="#7A6EFF" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth & Summary */}
          <div className="space-y-4">
            {/* Attendance Growth */}
            <div className="p-4 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-extrabold text-zinc-600 uppercase tracking-wider">Attendance Growth</span>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: -4 }}>
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B4CFF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5B4CFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 8 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Area type="monotone" dataKey="rate" stroke="#5B4CFF" strokeWidth={2} fill="url(#growthGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Mini Cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Present", value: data.summary.present, color: "text-emerald-600" },
                { label: "Absent", value: data.summary.absent, color: "text-rose-600" },
                { label: "Late", value: data.summary.late, color: "text-amber-600" },
                { label: "On Leave", value: data.summary.onLeave, color: "text-[var(--color-primary)]" },
              ].map((s) => (
                <div key={s.label} className="p-2.5 rounded-lg bg-white/20 border border-[var(--border-light)]/20">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
                  <p className={`text-sm font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
