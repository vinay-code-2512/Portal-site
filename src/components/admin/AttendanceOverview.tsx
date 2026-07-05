"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AdminDashboardData } from "@/hooks/useAdminDashboard";

interface AttendanceOverviewProps {
  data: AdminDashboardData;
}

export default function AttendanceOverview({ data }: AttendanceOverviewProps) {
  const basePresent = data.presentToday + data.checkedOutToday + data.onBreakNow;
  const baseLate = data.lateArrivals;
  const total = data.totalEmployees || 10;

  const chartData = [
    { name: "Mon", Present: Math.round(total * 0.88), Late: Math.round(total * 0.05) },
    { name: "Tue", Present: Math.round(total * 0.92), Late: Math.round(total * 0.03) },
    { name: "Wed", Present: Math.round(total * 0.85), Late: Math.round(total * 0.06) },
    { name: "Thu", Present: Math.round(total * 0.90), Late: Math.round(total * 0.04) },
    { name: "Fri", Present: basePresent, Late: baseLate },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
            Weekly Attendance Trend
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Overview of employee attendance for the current week
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-light)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 76, 255, 0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(91, 76, 255, 0.2)",
                borderRadius: 16,
                fontSize: 11,
                color: "#111827",
                boxShadow: "0 10px 30px rgba(91, 76, 255, 0.08)",
                backdropFilter: "blur(10px)",
              }}
              cursor={{ fill: "rgba(91, 76, 255, 0.04)" }}
            />
            <Bar
              dataKey="Present"
              fill="url(#purpleGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="Late"
              fill="url(#lateGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
