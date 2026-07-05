"use client";

import { Calendar } from "lucide-react";
import type { DateRangePreset } from "@/hooks/useReports";

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

interface DateFilterProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (val: string) => void;
  onCustomEndChange: (val: string) => void;
}

export default function DateFilter({
  preset, onPresetChange, customStart, customEnd, onCustomStartChange, onCustomEndChange,
}: DateFilterProps) {
  return (
    <div className="hrms-glass rounded-[20px] p-4 sm:p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-1">
        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)]">
          <Calendar className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Date Range</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const isActive = preset === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPresetChange(p.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-white/35 text-zinc-600 border border-[var(--border-light)]/50 hover:bg-white/50"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/35 border border-[var(--border-light)]/50 text-[10px] font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
          <span className="text-[10px] text-zinc-400 font-semibold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/35 border border-[var(--border-light)]/50 text-[10px] font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
      )}
    </div>
  );
}
