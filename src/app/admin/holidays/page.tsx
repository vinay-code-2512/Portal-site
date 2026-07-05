"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import { fetchHolidays, createHoliday, deleteHoliday } from "@/lib/holidays";
import type { Holiday } from "@/lib/holidays";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("public");
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHolidays();
      setHolidays(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const holidaysByDate: Record<string, Holiday[]> = {};
  for (const h of holidays) {
    if (!holidaysByDate[h.date]) holidaysByDate[h.date] = [];
    holidaysByDate[h.date].push(h);
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newDate) return;
    setSubmitting(true);
    try {
      await createHoliday({ date: newDate, name: newName.trim(), type: newType });
      setNewName("");
      setNewDate("");
      setNewType("public");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete holiday");
    }
  };

  const monthHolidays = holidays.filter(h => h.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
          Admin / Holidays
        </p>
        <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
          Holiday Management
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage company holidays across the year.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Add Holiday Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-sm font-extrabold text-[#111827]">Add Holiday</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[var(--border-light)] text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Holiday Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Diwali"
              className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[var(--border-light)] text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all"
            />
          </div>
          <div className="w-[140px]">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Type</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[var(--border-light)] text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all"
            >
              <option value="public">Public</option>
              <option value="company">Company</option>
              <option value="optional">Optional</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newDate || submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {submitting ? "Adding..." : "Add Holiday"}
          </button>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">Holiday Calendar</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{MONTHS[month]} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-white/70 border border-[var(--border-light)]/50 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-white/70 border border-[var(--border-light)]/50 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-[10px] font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Holiday
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
            Today
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-xs">Loading holidays...</p>
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-[9px] text-zinc-400 text-center font-bold py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayHolidays = holidaysByDate[dateStr] || [];
                const isToday = dateStr === today.toISOString().slice(0, 10);

                return (
                  <div
                    key={day}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] transition-all ${
                      isToday
                        ? "bg-[var(--color-primary-dim)] ring-1 ring-[var(--color-primary)]/30"
                        : dayHolidays.length > 0
                          ? "bg-emerald-50 hover:bg-emerald-100"
                          : "hover:bg-white/40"
                    }`}
                  >
                    <span className={`font-bold ${
                      isToday ? "text-[var(--color-primary)]" :
                      dayHolidays.length > 0 ? "text-emerald-600" : "text-zinc-500"
                    }`}>
                      {day}
                    </span>
                    {dayHolidays.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-emerald-500" />
                    )}
                    {dayHolidays.map(h => (
                      <div
                        key={h.id}
                        className="absolute inset-0 rounded-xl cursor-pointer group"
                        title={h.name}
                      >
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); if (h.id) handleDelete(h.id); }}
                            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Holiday list for this month */}
      {!loading && monthHolidays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hrms-glass rounded-[20px] p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#111827]">
              {MONTHS[month]} {year} &middot; {monthHolidays.length} holiday{monthHolidays.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <div className="space-y-2">
            {monthHolidays.map((h) => (
              <div key={h.id || h.date} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-zinc-700">{h.name}</span>
                  <span className="text-xs text-zinc-400">{h.date}</span>
                  {h.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-semibold">
                      {h.type}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => h.id && handleDelete(h.id)}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
