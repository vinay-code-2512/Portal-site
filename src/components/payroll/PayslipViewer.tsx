"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, IndianRupee, User, Building2, Hash } from "lucide-react";
import { getMonthName, type PayrollRecord } from "@/lib/payroll";

interface PayslipViewerProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onDownload: (record: PayrollRecord) => void;
  downloading: boolean;
}

export default function PayslipViewer({ record, onClose, onDownload, downloading }: PayslipViewerProps) {
  useEffect(() => {
    if (record) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [record]);

  return (
    <AnimatePresence>
      {record && (
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
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 overflow-y-auto hrms-glass rounded-[24px] border border-[var(--border-light)] shadow-2xl bg-white/55 backdrop-blur-md max-h-[85vh]"
          >
            {/* Purple Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] px-6 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-[24px]">
              <div>
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Payslip
                </span>
                <h2 className="text-base font-extrabold text-white">
                  {getMonthName(record.month)} {record.year}
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
            <div className="p-6 space-y-5">
              {/* Employee Information */}
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Status</span>
                    <span className={`font-bold capitalize ${record.status === "paid" ? "text-emerald-600" : record.status === "generated" ? "text-[var(--color-primary)]" : "text-amber-600"}`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md">
                <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <IndianRupee className="w-3.5 h-3.5" />
                  Salary Breakdown
                </h3>
                <div className="space-y-2.5">
                  {([
                    ["Basic Salary", record.basicSalary, false],
                    ["Allowances", record.allowances, false],
                    ["Bonuses", record.bonuses, false],
                    ["Deductions", record.deductions, true],
                  ] as const).map(([label, amount, isNeg]) => (
                    <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-light)]/20 last:border-b-0">
                      <span className="text-zinc-500 font-semibold">{label}</span>
                      <span className={`tabular-nums font-bold ${isNeg ? "text-rose-600" : "text-[#111827]"}`}>
                        {isNeg ? "–" : "+"} ₹{Math.abs(amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border-light)]/40">
                    <span className="text-sm font-extrabold text-[#111827]">Net Salary</span>
                    <span className="text-xl font-extrabold text-[var(--color-primary)] tabular-nums">
                      ₹{record.netSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => onDownload(record)}
                disabled={downloading}
                className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Downloading..." : "Download Payslip PDF"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
