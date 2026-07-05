"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Edit3, IndianRupee, FileText } from "lucide-react";
import { getMonthName, type PayrollRecord } from "@/lib/payroll";
import PayslipViewer from "./PayslipViewer";

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string }> = {
  paid: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  generated: {
    bg: "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20",
    dot: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
  },
  pending: {
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
};

interface PayrollTableProps {
  records: PayrollRecord[];
  loading?: boolean;
  onView: (record: PayrollRecord) => void;
  onEditStatus: (id: string, status: "paid" | "generated" | "pending") => void;
}

function formatCurrency(val: number) {
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function PayrollTable({ records, loading, onView, onEditStatus }: PayrollTableProps) {
  const [viewingPayslip, setViewingPayslip] = useState<PayrollRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center mb-3">
          <IndianRupee className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <p className="text-xs font-bold text-zinc-500">No payroll records for this period</p>
        <p className="text-[10px] text-zinc-400 mt-1">Select a different month or generate payroll</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold border-b border-[var(--border-light)]/40 text-left">
              <th className="pb-3.5 pr-4 font-extrabold">Employee</th>
              <th className="pb-3.5 pr-4 font-extrabold">Department</th>
              <th className="pb-3.5 pr-4 font-extrabold text-right">Basic</th>
              <th className="pb-3.5 pr-4 font-extrabold text-right">Allowances</th>
              <th className="pb-3.5 pr-4 font-extrabold text-right">Deductions</th>
              <th className="pb-3.5 pr-4 font-extrabold text-right">Net Salary</th>
              <th className="pb-3.5 pr-4 font-extrabold">Status</th>
              <th className="pb-3.5 text-right font-extrabold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]/20">
            {records.map((r, i) => {
              const style = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
              const initial = (r.employeeName || "?").charAt(0).toUpperCase();
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="text-xs text-zinc-700 hover:bg-white/20 transition-all duration-200"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-800">{r.employeeName}</span>
                        <span className="text-[9px] text-zinc-400 font-bold tabular-nums">
                          {r.employeeId}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-zinc-600">
                    {r.department || "—"}
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-zinc-700 tabular-nums text-right">
                    {formatCurrency(r.basicSalary)}
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-emerald-600 tabular-nums text-right">
                    +{formatCurrency(r.allowances)}
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-rose-600 tabular-nums text-right">
                    –{formatCurrency(r.deductions)}
                  </td>
                  <td className="py-3.5 pr-4 font-extrabold text-[#111827] tabular-nums text-right">
                    {formatCurrency(r.netSalary)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(r)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--color-primary-dim)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all cursor-pointer border border-[var(--color-primary-light)]/20"
                      >
                        <Eye className="w-3 h-3 inline-block mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setViewingPayslip(r);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/40 hover:bg-white/60 text-zinc-700 border border-[var(--border-light)]/60 transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3 inline-block mr-1" />
                        Payslip
                      </button>
                      <select
                        value={r.status}
                        onChange={(e) => r.id && onEditStatus(r.id, e.target.value as any)}
                        className="px-2 py-1.5 rounded-lg bg-white/40 border border-[var(--border-light)]/50 text-[10px] font-semibold text-zinc-600 focus:outline-none focus:border-[var(--color-primary)]/40 cursor-pointer appearance-none"
                      >
                        <option value="generated">Generated</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {records.map((r, i) => {
          const style = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              className="p-4 rounded-xl bg-white/20 border border-[var(--border-light)]/40 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                    {(r.employeeName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-800 text-xs">{r.employeeName}</span>
                    <span className="text-[9px] text-zinc-400 font-bold">{r.department || "—"}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {r.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white/25 p-2.5 rounded-lg text-[10px]">
                <div className="flex flex-col">
                  <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Basic</span>
                  <span className="font-bold text-zinc-700 mt-0.5 tabular-nums">{formatCurrency(r.basicSalary)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Allowances</span>
                  <span className="font-bold text-emerald-600 mt-0.5 tabular-nums">+{formatCurrency(r.allowances)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Deductions</span>
                  <span className="font-bold text-rose-600 mt-0.5 tabular-nums">–{formatCurrency(r.deductions)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Net Salary</span>
                  <span className="font-extrabold text-[#111827] mt-0.5 tabular-nums">{formatCurrency(r.netSalary)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(r)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-[var(--color-primary-dim)] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all cursor-pointer border border-[var(--color-primary-light)]/20 text-center"
                >
                  View Details
                </button>
                <button
                  onClick={() => setViewingPayslip(r)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-white/40 hover:bg-white/60 text-zinc-700 border border-[var(--border-light)]/60 transition-all cursor-pointer text-center"
                >
                  Payslip
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Payslip Viewer */}
      <PayslipViewer
        record={viewingPayslip}
        onClose={() => setViewingPayslip(null)}
        onDownload={(rec) => {
          setDownloading(true);
          setTimeout(() => setDownloading(false), 2000);
        }}
        downloading={downloading}
      />
    </>
  );
}
