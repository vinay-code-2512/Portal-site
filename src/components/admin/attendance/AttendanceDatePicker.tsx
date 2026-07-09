"use client";

import { ChevronLeft, ChevronRight, CalendarDays, Filter } from "lucide-react";
import { isSunday } from "@/lib/format";

interface AttendanceDatePickerProps {
  selectedDate: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChange: (date: string) => void;
  departments: string[];
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
}

export default function AttendanceDatePicker({
  selectedDate,
  onPrev,
  onNext,
  onToday,
  onChange,
  departments,
  selectedDepartment,
  onDepartmentChange,
}: AttendanceDatePickerProps) {
  const today = new Date().toISOString().split("T")[0];
  const d = new Date(selectedDate + "T12:00:00");
  const display = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const isToday = selectedDate === today;

  return (
    <div className="hrms-glass rounded-[20px] p-4 sm:p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
      {/* Date display info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)]">
          <CalendarDays className="w-4.5 h-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Selected Date</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#111827]">{display}</span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Today
              </span>
            )}
          </div>
          {isSunday(selectedDate) && (
            <span className="text-[10px] text-amber-500 font-semibold mt-0.5">No work on Sundays</span>
          )}
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/35 border border-[var(--border-light)]/50">
          <button
            onClick={onPrev}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 hover:text-[var(--color-primary)] hover:bg-white/50 transition-all cursor-pointer"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1 text-xs font-semibold bg-transparent text-zinc-800 focus:outline-none cursor-pointer [color-scheme:light]"
          />

          <button
            onClick={onNext}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 hover:text-[var(--color-primary)] hover:bg-white/50 transition-all cursor-pointer"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Today Quick Button */}
        {!isToday && (
          <button
            onClick={onToday}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/40 hover:bg-white/60 text-zinc-700 border border-[var(--border-light)]/60 transition-all cursor-pointer shadow-sm"
          >
            Today
          </button>
        )}

        {/* Department Filter */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer appearance-none shadow-sm min-w-[150px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.4c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[position:right_12px_center] bg-no-repeat"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

