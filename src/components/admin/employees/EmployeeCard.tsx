"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, Edit3, Trash2, FileSpreadsheet, ExternalLink } from "lucide-react";
import type { EmployeeData } from "@/lib/employees";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  inactive: "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
  suspended: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
  "on-leave": "bg-[var(--color-primary-dim)] border-[var(--color-primary)]/20 text-[var(--color-primary-light)]",
};

interface EmployeeCardProps {
  employee: EmployeeData;
  onDelete: (uid: string) => void;
}

export default function EmployeeCard({ employee, onDelete }: EmployeeCardProps) {
  const statusStyle = STATUS_STYLES[employee.status] || STATUS_STYLES.inactive;
  const initial = (employee.fullName || "?").charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden shadow-sm">
          {employee.photoURL ? (
            <img src={employee.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#111827] truncate">{employee.fullName}</p>
          <p className="text-[10px] text-zinc-400 tabular-nums">
            {employee.employeeId || employee.uid.slice(0, 8)}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${statusStyle}`}
        >
          {employee.status}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-light)]/50">
        <div className="text-[10px] text-zinc-500 font-medium">
          <span>{employee.department || "—"}</span>
          <span className="mx-1.5 opacity-30">|</span>
          <span>{employee.designation || "—"}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {/* View Details */}
          <Link
            href={`/admin/employees/rating?id=${employee.uid}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-dim)] hover:shadow-[0_0_8px_rgba(91,76,255,0.2)] transition-all cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          {/* Edit Profile */}
          <Link
            href={`/admin/employees/edit?id=${employee.uid}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.2)] transition-all cursor-pointer"
            title="Edit Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          {/* Sheet */}
          {employee.googleSheetId ? (
            <a
              href={`https://docs.google.com/spreadsheets/d/${employee.googleSheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 bg-white border border-emerald-200 hover:bg-gray-50 hover:shadow-[0_0_8px_rgba(52,211,153,0.2)] transition-all cursor-pointer"
              title="Open Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300"
              title="No sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </span>
          )}
          {/* Delete Profile */}
          <button
            onClick={() => onDelete(employee.uid)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)] transition-all cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
