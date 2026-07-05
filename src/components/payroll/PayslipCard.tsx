"use client";

import { motion } from "framer-motion";
import { Download, IndianRupee, FileText } from "lucide-react";
import { getMonthName, type PayrollRecord } from "@/lib/payroll";

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

interface PayslipCardProps {
  record: PayrollRecord;
  onDownload: (record: PayrollRecord) => void;
  downloading: boolean;
}

export default function PayslipCard({ record, onDownload, downloading }: PayslipCardProps) {
  const statusStyle = STATUS_STYLES[record.status] || STATUS_STYLES.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#111827]">{getMonthName(record.month)} {record.year}</p>
            <p className="text-[9px] text-zinc-400 font-bold">{record.employeeId}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {record.status}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border-light)]/30">
        <span className="text-[11px] text-zinc-500 font-semibold">Net Salary</span>
        <span className="text-lg font-extrabold text-[#111827] tabular-nums">
          ₹{record.netSalary.toLocaleString("en-IN")}
        </span>
      </div>

      {record.status !== "pending" && (
        <button
          onClick={() => onDownload(record)}
          disabled={downloading}
          className="w-full py-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Downloading..." : "Download Payslip"}
        </button>
      )}
    </motion.div>
  );
}
