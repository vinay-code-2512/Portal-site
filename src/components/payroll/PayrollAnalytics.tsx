"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { IndianRupee, TrendingUp, Building2, Layers, PieChart as PieChartIcon } from "lucide-react";
import type { PayrollRecord } from "@/lib/payroll";

type TabKey = "department" | "salary" | "status" | "composition";

const TABS: { key: TabKey; label: string; icon: typeof IndianRupee }[] = [
  { key: "department", label: "Department", icon: Building2 },
  { key: "salary", label: "Salary Dist.", icon: TrendingUp },
  { key: "composition", label: "Composition", icon: Layers },
  { key: "status", label: "Status", icon: PieChartIcon },
];

function formatCurrency(val: number) {
  return `₹${val.toLocaleString("en-IN")}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold text-zinc-800 mb-1" style={{ fontSize: "10px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color, fontSize: "10px" }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

interface PayrollAnalyticsProps {
  records: PayrollRecord[];
}

export default function PayrollAnalytics({ records }: PayrollAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("department");

  const departmentData = useMemo(() => {
    const map = new Map<string, number>();
    const empMap = new Map<string, Set<string>>();
    records.forEach((r) => {
      const dept = r.department || "Unassigned";
      map.set(dept, (map.get(dept) || 0) + r.netSalary);
      if (!empMap.has(dept)) empMap.set(dept, new Set());
      empMap.get(dept)!.add(r.employeeId);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, count: empMap.get(name)?.size || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const salaryDistData = useMemo(() => {
    if (records.length === 0) return [];
    const salaries = records.map((r) => r.netSalary).sort((a, b) => a - b);
    const min = salaries[0];
    const max = salaries[salaries.length - 1];
    const avg = Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length);
    return [
      { name: "Minimum", value: min },
      { name: "Average", value: avg },
      { name: "Maximum", value: max },
    ];
  }, [records]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => map.set(r.status, (map.get(r.status) || 0) + r.netSalary));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [records]);

  const compositionData = useMemo(() => {
    const totalBasic = records.reduce((s, r) => s + r.basicSalary, 0);
    const totalAllowances = records.reduce((s, r) => s + r.allowances, 0);
    const totalBonuses = records.reduce((s, r) => s + r.bonuses, 0);
    const totalDeductions = records.reduce((s, r) => s + r.deductions, 0);
    return [
      { name: "Basic Pay", value: totalBasic, fill: "var(--color-primary)" },
      { name: "Allowances", value: totalAllowances, fill: "var(--color-primary-light)" },
      { name: "Bonuses", value: totalBonuses, fill: "#10b981" },
      { name: "Deductions", value: -totalDeductions, fill: "#f43f5e" },
    ];
  }, [records]);

  const STATUS_COLORS: Record<string, string> = {
    paid: "#10b981",
    generated: "var(--color-primary)",
    pending: "#f59e0b",
  };

  const totalPayroll = records.reduce((s, r) => s + r.netSalary, 0);

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <IndianRupee className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Payroll Analytics</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              {formatCurrency(totalPayroll)} total · {records.length} record{records.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/35 p-1 rounded-xl border border-[var(--border-light)]/50 w-fit mb-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800 hover:bg-white/40"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Department Cost */}
      {activeTab === "department" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {departmentData.length > 0 ? (
            <div className="space-y-3">
              {departmentData.map((d, i) => {
                const pct = (d.value / totalPayroll) * 100;
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">{d.name}</span>
                        <span className="text-[9px] text-zinc-400 font-semibold">({d.count} emp{d.count !== 1 ? "s" : ""})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-zinc-700 tabular-nums">{formatCurrency(d.value)}</span>
                        <span className="text-[9px] text-zinc-400 ml-1.5 font-semibold">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/30 border border-[var(--border-light)]/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic text-center py-8">No department data available</p>
          )}
        </motion.div>
      )}

      {/* Salary Distribution */}
      {activeTab === "salary" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {salaryDistData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryDistData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 600, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontWeight: 600, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {salaryDistData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 1 ? "var(--color-primary)" : i === 0 ? "#a78bfa" : "#7c3aed"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic text-center py-8">No salary data available</p>
          )}
        </motion.div>
      )}

      {/* Composition */}
      {activeTab === "composition" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {compositionData.map((item) => {
            const absVal = Math.abs(item.value);
            const pct = totalPayroll > 0 ? (absVal / (totalPayroll + Math.abs(compositionData.find(c => c.name === "Deductions")?.value || 0))) * 100 : 0;
            const isNeg = item.value < 0;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill as string }} />
                    <span className="text-zinc-500 font-semibold">{item.name}</span>
                  </div>
                  <span className={`font-bold tabular-nums ${isNeg ? "text-rose-600" : "text-[#111827]"}`}>
                    {isNeg ? "–" : "+"} {formatCurrency(absVal)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/30 border border-[var(--border-light)]/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full rounded-full ${isNeg ? "bg-rose-500" : ""}`}
                    style={{ backgroundColor: isNeg ? undefined : item.fill as string }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Status Breakdown */}
      {activeTab === "status" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || "#a1a1aa"}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {statusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] || "#a1a1aa" }}
                    />
                    <span className="text-[10px] font-bold text-zinc-600 capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic text-center py-8">No status data available</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
