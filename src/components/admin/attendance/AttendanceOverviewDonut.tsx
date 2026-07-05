"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { AttendanceDateStats } from "@/lib/adminAttendance";

interface AttendanceOverviewDonutProps {
  stats: AttendanceDateStats;
}

const PURPLE_COLORS = [
  "#5B4CFF", // Present (Primary)
  "#8C82FF", // Late (Lavender secondary)
  "#B8B2FF", // Leave (Soft Purple)
  "#E4E2FF", // Absent (Light Gray-Purple)
];

export default function AttendanceOverviewDonut({ stats }: AttendanceOverviewDonutProps) {
  const total = stats.total || 1;
  const presentPct = Math.round((stats.present / total) * 100);
  const latePct = Math.round((stats.late / total) * 100);
  const leavePct = Math.round((stats.onLeave / total) * 100);
  const absentPct = Math.round((stats.absent / total) * 100);

  const chartData = [
    { name: "Present", value: stats.present, percent: presentPct },
    { name: "Late", value: stats.late, percent: latePct },
    { name: "Leave", value: stats.onLeave, percent: leavePct },
    { name: "Absent", value: stats.absent, percent: absentPct },
  ].filter(item => item.value > 0);

  // Fallback in case no data is logged for today
  const hasData = chartData.length > 0;
  const displayData = hasData ? chartData : [{ name: "No Data", value: 1, percent: 100 }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full justify-between"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Today&apos;s Attendance Overview
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
          Real-time breakdown of attendance statuses
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-4 flex-1">
        <div className="h-44 w-44 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={hasData ? 3 : 0}
                dataKey="value"
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hasData ? PURPLE_COLORS[index % PURPLE_COLORS.length] : "#E2E8F0"}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
              {hasData && (
                <Tooltip
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(91, 76, 255, 0.2)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#111827",
                    boxShadow: "0 10px 30px rgba(91, 76, 255, 0.08)",
                    backdropFilter: "blur(10px)",
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value} employees (${props.payload.percent}%)`,
                    name,
                  ]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Absolute center text inside the Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-[#111827]">
              {stats.attendancePercent}%
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              Attendance
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Present Today", pct: presentPct, val: stats.present, color: PURPLE_COLORS[0] },
              { label: "Late Today", pct: latePct, val: stats.late, color: PURPLE_COLORS[1] },
              { label: "On Leave", pct: leavePct, val: stats.onLeave, color: PURPLE_COLORS[2] },
              { label: "Absent Today", pct: absentPct, val: stats.absent, color: PURPLE_COLORS[3] },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col p-2.5 rounded-xl border border-[var(--border-light)]/40 bg-white/20"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-bold text-zinc-600 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-extrabold text-[#111827]">
                    {item.pct}%
                  </span>
                  <span className="text-[9px] text-zinc-400 font-semibold">
                    ({item.val})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
