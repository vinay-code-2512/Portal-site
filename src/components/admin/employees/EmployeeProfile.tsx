"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Edit3, Clock, CalendarOff, Activity, FileText, Briefcase } from "lucide-react";
import type { EmployeeData } from "@/lib/employees";
import type { ProfileAttendanceSummary } from "@/hooks/useEmployeeProfile";
import { formatFirebaseDate, formatTime } from "@/lib/format";
import EmptyState from "@/components/shared/EmptyState";

interface EmployeeProfileProps {
  employee: EmployeeData;
  attendanceSummary: ProfileAttendanceSummary;
  attendance: any[];
  leaves: any[];
  activityLog: any[];
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  inactive: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
  suspended: "bg-red-500/10 border-red-500/20 text-red-400",
  "on-leave": "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20 text-[var(--color-primary-light)]",
};

const LEAVES_STATUS: Record<string, string> = {
  approved: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  rejected: "bg-red-500/10 border-red-500/20 text-red-400",
};

export default function EmployeeProfile({ employee, attendanceSummary, attendance, leaves, activityLog }: EmployeeProfileProps) {
  const statusStyle = STATUS_STYLES[employee.status] || STATUS_STYLES.inactive;
  const initial = (employee.fullName || "?").charAt(0).toUpperCase();

  const attItems = [
    { label: "Present", value: attendanceSummary.present, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Late", value: attendanceSummary.late, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Absent", value: attendanceSummary.absent, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Half Day", value: attendanceSummary.halfDay, color: "text-[var(--color-primary-light)]", bg: "bg-[var(--color-primary-dim)]" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-purple-400 uppercase tracking-wider font-semibold">Admin / Employees / Profile</p>
          <h1 className="text-xl font-bold text-white mt-1">{employee.fullName}</h1>
        </div>
        <Link
          href={`/admin/employees/edit?id=${employee.uid}`}
          className="min-h-[40px] px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center text-lg text-purple-400 font-bold shrink-0 overflow-hidden">
            {employee.photoURL ? (
              <img src={employee.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white">{employee.fullName}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusStyle}`}>
                {employee.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{employee.email} &middot; {employee.phone || "—"}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{employee.employeeId} &middot; {employee.department} &middot; {employee.designation}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hrms-glass rounded-[20px] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Employment Info</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Department</span><span className="text-zinc-300">{employee.department || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Designation</span><span className="text-zinc-300">{employee.designation || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="text-zinc-300 capitalize">{employee.role}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Employee ID</span><span className="text-zinc-300">{employee.employeeId}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className={`text-zinc-300 capitalize`}>{employee.status}</span></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hrms-glass rounded-[20px] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Attendance Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {attItems.map((item) => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${item.bg}`}>
                <p className={`text-lg font-bold ${item.color} tabular-nums`}>{item.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {attendance.length > 0 && (
            <div className="mt-3 text-[10px] text-zinc-600 text-center">This month: {attendanceSummary.total} days</div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 mb-4">
          <CalendarOff className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Leave Summary</h3>
        </div>
        {leaves.length === 0 ? (
          <EmptyState icon={<CalendarOff className="w-5 h-5" />} title="No leave requests" />
        ) : (
          <div className="space-y-2">
            {leaves.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div>
                  <p className="text-zinc-300">{l.reason || "Leave request"}</p>
                  <p className="text-[10px] text-zinc-500">{l.startDate} → {l.endDate}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${LEAVES_STATUS[l.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Documents</h3>
        </div>
        <EmptyState icon={<FileText className="w-5 h-5" />} title="No documents uploaded" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Activity Timeline</h3>
        </div>
        {activityLog.length === 0 ? (
          <EmptyState icon={<Activity className="w-5 h-5" />} title="No recent activity" />
        ) : (
          <div className="space-y-1">
            {activityLog.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-white/[0.03] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300">{a.description}</p>
                  <p className="text-[10px] text-zinc-500">{formatTime(a.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
