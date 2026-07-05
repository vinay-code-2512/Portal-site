"use client";

import { motion } from "framer-motion";
import { ArrowLeft, IndianRupee, User, Building2, Hash, Calendar } from "lucide-react";
import { getMonthName, type PayrollRecord } from "@/lib/payroll";
import SalaryBreakdown from "./SalaryBreakdown";

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

interface PayrollDetailsProps {
  record: PayrollRecord;
  onBack: () => void;
}

export default function PayrollDetails({ record, onBack }: PayrollDetailsProps) {
  const statusStyle = STATUS_STYLES[record.status] || STATUS_STYLES.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Records
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Payroll Details
          </p>
          <h2 className="text-xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            {getMonthName(record.month)} {record.year}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">{record.employeeName}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {record.status}
        </span>
      </div>

      <SalaryBreakdown
        basicSalary={record.basicSalary}
        allowances={record.allowances}
        bonuses={record.bonuses}
        deductions={record.deductions}
        netSalary={record.netSalary}
      />

      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md">
        <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <User className="w-3.5 h-3.5" />
          Employee Information
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-semibold">Name</span>
            <span className="font-bold text-[#111827]">{record.employeeName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-semibold">ID</span>
            <span className="font-bold text-[#111827] tabular-nums">{record.employeeId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-semibold">Department</span>
            <span className="font-bold text-[#111827]">{record.department}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-semibold">Period</span>
            <span className="font-bold text-[#111827]">{getMonthName(record.month)} {record.year}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
