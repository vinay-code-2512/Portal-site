"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Medal, Award, Users } from "lucide-react";
import type { EmployeeAnalyticsRow } from "@/lib/reports";

interface EmployeeAnalyticsTableProps {
  data: EmployeeAnalyticsRow[];
  loading: boolean;
}

type SortKey = keyof Pick<EmployeeAnalyticsRow, "name" | "department" | "attendancePercent" | "presentDays" | "lateDays" | "leaveDays">;

function getPerformanceScore(row: EmployeeAnalyticsRow): number {
  return Math.min(
    Math.round(
      row.attendancePercent * 0.5 +
      Math.max(0, 100 - row.lateDays * 3) * 0.2 +
      Math.max(0, 100 - row.leaveDays * 4) * 0.3
    ),
    100
  );
}

function getMedal(index: number) {
  if (index === 0) return <Medal className="w-3.5 h-3.5 text-amber-500" />;
  if (index === 1) return <Medal className="w-3.5 h-3.5 text-zinc-400" />;
  if (index === 2) return <Medal className="w-3.5 h-3.5 text-amber-700" />;
  return null;
}

export default function EmployeeAnalyticsTable({ data, loading }: EmployeeAnalyticsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("attendancePercent");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const withScore = data.map((row) => ({
      ...row,
      performanceScore: getPerformanceScore(row),
    }));

    return withScore.sort((a, b) => {
      if (sortKey === "name" || sortKey === "department") {
        return sortAsc
          ? (a[sortKey] as string).localeCompare(b[sortKey] as string)
          : (b[sortKey] as string).localeCompare(a[sortKey] as string);
      }
      return sortAsc
        ? (a[sortKey] as number) - (b[sortKey] as number)
        : (b[sortKey] as number) - (a[sortKey] as number);
    });
  }, [data, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="h-4 w-40 bg-white/30 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
          <Users className="w-6 h-6 mb-2" />
          <p className="text-xs font-bold">No employee analytics available</p>
        </div>
      </div>
    );
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: "name", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "attendancePercent", label: "Attendance %" },
    { key: "presentDays", label: "Present" },
    { key: "lateDays", label: "Late" },
    { key: "leaveDays", label: "Leaves" },
  ];

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <Award className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Performance Leaderboard</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              {data.length} employees ranked by performance
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold border-b border-[var(--border-light)]/40 text-left">
              <th className="pb-3 pr-3 font-extrabold">#</th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left pb-3 pr-3 font-extrabold cursor-pointer hover:text-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <ArrowUpDown className="w-3 h-3 text-[var(--color-primary)]" />
                    )}
                  </div>
                </th>
              ))}
              <th className="pb-3 text-right font-extrabold">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]/20">
            {sorted.slice(0, 20).map((row, i) => {
              const medal = getMedal(i);
              const score = getPerformanceScore(row);
              const initial = (row.name || "?").charAt(0).toUpperCase();
              return (
                <motion.tr
                  key={row.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="text-xs text-zinc-700 hover:bg-white/20 transition-all duration-200"
                >
                  <td className="py-3 pr-3">
                    <span className="flex items-center justify-center w-5 h-5">
                      {medal || <span className="text-[10px] text-zinc-400 font-bold">{i + 1}</span>}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                        {initial}
                      </div>
                      <span className="font-bold text-zinc-800">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-semibold text-zinc-600">{row.department}</td>
                  <td className="py-3 pr-3">
                    <span className={`font-bold tabular-nums ${
                      row.attendancePercent >= 90 ? "text-emerald-600" :
                      row.attendancePercent >= 75 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {row.attendancePercent}%
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-semibold text-zinc-700 tabular-nums">{row.presentDays}</td>
                  <td className="py-3 pr-3 font-semibold text-amber-600 tabular-nums">{row.lateDays}</td>
                  <td className="py-3 pr-3 font-semibold text-[var(--color-primary)] tabular-nums">{row.leaveDays}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="h-5 w-16 rounded-md bg-white/30 border border-[var(--border-light)]/30 overflow-hidden">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-extrabold text-zinc-700 tabular-nums w-8 text-right">{score}</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
