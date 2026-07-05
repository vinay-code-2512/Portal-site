"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, IndianRupee, Users, Calendar, FileText } from "lucide-react";
import { getMonthName, type PayrollStatus } from "@/lib/payroll";
import type { EmployeeData } from "@/lib/employees";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface GeneratePayrollModalProps {
  open: boolean;
  onClose: () => void;
  employees: EmployeeData[];
  onGenerate: (selectedUids: string[]) => Promise<void>;
  generating: boolean;
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

export default function GeneratePayrollModal({
  open, onClose, employees, onGenerate, generating,
  month, year, onMonthChange, onYearChange,
}: GeneratePayrollModalProps) {
  const [selectAll, setSelectAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setSelectAll(true);
      setSelected(new Set(employees.map((e) => e.uid)));
      setError("");
      setNotes("");
    }
  }, [open, employees]);

  function toggleAll() {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(employees.map((e) => e.uid)));
      setSelectAll(true);
    }
  }

  function toggleEmployee(uid: string) {
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelected(next);
    setSelectAll(next.size === employees.length);
  }

  async function handleGenerate() {
    if (selected.size === 0) { setError("Select at least one employee"); return; }
    setError("");
    await onGenerate(Array.from(selected));
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 overflow-y-auto hrms-glass rounded-[24px] border border-[var(--border-light)] shadow-2xl bg-white/55 backdrop-blur-md max-h-[85vh]"
          >
            {/* Purple Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] px-6 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-[24px]">
              <div>
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Payroll Processing
                </span>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Generate Payroll
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glass Body */}
            <div className="p-6 space-y-4">
              {/* Month / Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Month
                    </span>
                  </label>
                  <select
                    value={month}
                    onChange={(e) => onMonthChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer appearance-none"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Year
                    </span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer appearance-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Employees ({selected.size}/{employees.length})
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors cursor-pointer"
                  >
                    {selectAll ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[var(--border-light)]/30 p-1">
                  {employees.map((emp) => (
                    <label
                      key={emp.uid}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selected.has(emp.uid)
                          ? "bg-[var(--color-primary-dim)] border border-[var(--color-primary-light)]/20"
                          : "bg-white/20 border border-transparent hover:bg-white/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(emp.uid)}
                        onChange={() => toggleEmployee(emp.uid)}
                        className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer"
                      />
                      <span className="font-bold text-zinc-800">{emp.fullName}</span>
                      <span className="text-[10px] text-zinc-500 ml-auto font-semibold">{emp.department || "—"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this payroll run (optional)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)] resize-none"
                />
              </div>

              {error && (
                <p className="text-[10px] font-bold text-rose-600 bg-rose-500/10 rounded-xl px-3 py-2 border border-rose-500/25">
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || selected.size === 0}
                className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IndianRupee className="w-4 h-4" />
                )}
                {generating ? "Generating..." : `Generate Payslips (${selected.size})`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
