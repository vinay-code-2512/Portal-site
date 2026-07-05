"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { DepartmentInfo } from "@/hooks/useAdminDashboard";
import EmptyState from "@/components/shared/EmptyState";

const COLORS = [
  "var(--color-primary)",
  "var(--color-primary-light)",
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
];

interface DepartmentSummaryProps {
  departments: DepartmentInfo[];
}

export default function DepartmentSummary({ departments }: DepartmentSummaryProps) {
  if (!departments.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md"
      >
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4">
          Department Distribution
        </h3>
        <EmptyState icon={<Building2 className="w-6 h-6" />} title="No department data available" />
      </motion.div>
    );
  }

  const chartData = departments.map((dept) => ({
    name: dept.name,
    value: dept.count,
  }));

  const totalEmployees = departments.reduce((acc, d) => acc + d.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Department Distribution
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-4">
          Breakdown of staff across departments
        </p>
      </div>

      <div className="flex flex-col items-center justify-center relative my-2">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(91, 76, 255, 0.2)",
                  borderRadius: 12,
                  fontSize: 11,
                  color: "#111827",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-2xl font-bold text-[#111827] tabular-nums">
              {totalEmployees}
            </span>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-[var(--text-secondary)]">
        {chartData.map((d, index) => (
          <div key={d.name} className="flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="truncate font-semibold">{d.name}</span>
            <span className="text-zinc-400 font-bold ml-auto tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
