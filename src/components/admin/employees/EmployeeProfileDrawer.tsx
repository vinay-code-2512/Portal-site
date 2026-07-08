"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, User, Briefcase, Clock, CalendarOff, IndianRupee, Loader2, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import type { EmployeeData } from "@/lib/employees";

interface EmployeeProfileDrawerProps {
  uid: string;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  inactive: "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
  suspended: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
  "on-leave": "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20 text-[var(--color-primary-light)]",
};

const LEAVE_STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  rejected: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
};

export default function EmployeeProfileDrawer({ uid, onClose }: EmployeeProfileDrawerProps) {
  const { employee, attendanceSummary, leaves, loading, error } = useEmployeeProfile(uid);

  const initials = employee?.fullName
    ? employee.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const statusStyle = employee ? STATUS_STYLES[employee.status] || STATUS_STYLES.inactive : "";

  const basic = employee?.basicSalary || 0;
  const allowances = employee?.allowances || 0;
  const bonuses = employee?.bonuses || 0;
  const deductions = employee?.deductions || 0;
  const netSalary = basic + allowances + bonuses - deductions;

  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg md:max-w-xl h-full bg-[#F4F2FC] dark:bg-[#0c0c14] shadow-2xl border-l border-[var(--border-light)] flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-light)] bg-white/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
              Employee Profile Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/80 border border-[var(--border-light)] flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-light)] mb-2" />
              <p className="text-xs">Loading profile data...</p>
            </div>
          ) : error || !employee ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 text-center p-4">
              <p className="text-sm font-bold">Failed to load profile</p>
              <p className="text-xs mt-1 text-zinc-500">{error || "Employee record not found"}</p>
            </div>
          ) : (
            <>
              {/* Section 1: Profile card */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-lg font-bold text-white shadow-sm overflow-hidden shrink-0">
                  {employee.photoURL ? (
                    <img src={employee.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#111827] truncate">
                      {employee.fullName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${statusStyle}`}
                    >
                      {employee.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium truncate">
                    {employee.email}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 truncate">
                    {employee.phone || "No phone contact"}
                  </p>
                </div>
              </div>

              {/* Section 2: Employment Info */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                  <Briefcase className="w-4 h-4 text-[var(--color-primary-light)]" />
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Employment Info
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Employee ID
                    </span>
                    <span className="text-[#111827] font-semibold tabular-nums mt-0.5 block">
                      {employee.employeeId || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Role Rank
                    </span>
                    <span className="text-[#111827] font-semibold capitalize mt-0.5 block">
                      {employee.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Department
                    </span>
                    <span className="text-[#111827] font-semibold mt-0.5 block">
                      {employee.department || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Designation
                    </span>
                    <span className="text-[#111827] font-semibold mt-0.5 block">
                      {employee.designation || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Attendance Summary */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                  <Clock className="w-4 h-4 text-[var(--color-primary-light)]" />
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Attendance Summary
                  </h4>
                </div>
                {attendanceSummary ? (
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="rounded-xl p-2.5 bg-emerald-500/10 text-center border border-emerald-500/10">
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {attendanceSummary.present}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                        Present
                      </p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-amber-500/10 text-center border border-amber-500/10">
                      <p className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {attendanceSummary.late}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                        Late
                      </p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-red-500/10 text-center border border-red-500/10">
                      <p className="text-base font-bold text-red-500 dark:text-red-400 tabular-nums">
                        {attendanceSummary.absent}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                        Absent
                      </p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-[var(--color-primary-dim)] text-center border border-[var(--color-primary)]/10">
                      <p className="text-base font-bold text-[var(--color-primary-light)] tabular-nums">
                        {attendanceSummary.halfDay}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                        Half Day
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 text-center">No attendance summary available</p>
                )}
              </div>

              {/* Section 4: Leave Summary */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                  <CalendarOff className="w-4 h-4 text-[var(--color-primary-light)]" />
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Leave Summary
                  </h4>
                </div>
                {leaves && leaves.length > 0 ? (
                  <div className="space-y-2.5">
                    {leaves.map((l: any) => {
                      const lStyle = LEAVE_STATUS_STYLES[l.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-500";
                      return (
                        <div
                          key={l.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-[var(--border-light)] text-xs"
                        >
                          <div>
                            <p className="text-[#111827] font-bold">{l.reason || "Personal Leave"}</p>
                            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 tabular-nums">
                              {l.startDate} to {l.endDate}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${lStyle}`}
                          >
                            {l.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-2">No leave requests found</p>
                )}
              </div>

              {/* Section 5: Payroll Summary */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                  <IndianRupee className="w-4 h-4 text-[var(--color-primary-light)]" />
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Payroll Summary
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-semibold">Basic Salary</span>
                    <span className="text-[#111827] font-bold tabular-nums">
                      {basic ? `$${basic.toLocaleString()}` : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-semibold">Allowances</span>
                    <span className="text-emerald-600 font-bold tabular-nums">
                      {allowances ? `+$${allowances.toLocaleString()}` : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-semibold">Bonuses</span>
                    <span className="text-emerald-600 font-bold tabular-nums">
                      {bonuses ? `+$${bonuses.toLocaleString()}` : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-semibold">Deductions</span>
                    <span className="text-red-500 font-bold tabular-nums">
                      {deductions ? `-$${deductions.toLocaleString()}` : "$0.00"}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--border-light)] flex justify-between">
                    <span className="text-[#111827] font-bold uppercase tracking-wider text-[10px]">
                      Estimated Net Salary
                    </span>
                    <span className="text-[var(--color-primary)] font-extrabold text-sm tabular-nums">
                      ${netSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 6: Activity Sheet */}
              <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Activity Sheet
                  </h4>
                </div>

                {sheetError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{sheetError}</p>
                )}
                {sheetSuccess && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{sheetSuccess}</p>
                )}

                {employee.googleSheetId ? (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${employee.googleSheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 group hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">Open Sheet</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">View {employee.fullName}&apos;s activity log</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-3">
                    Sheet auto-created when employee confirms first activity.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
