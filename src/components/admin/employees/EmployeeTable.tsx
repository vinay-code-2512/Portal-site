"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, Edit3, Trash2, FileSpreadsheet, ExternalLink } from "lucide-react";
import type { EmployeeData } from "@/lib/employees";

interface EmployeeTableProps {
  employees: EmployeeData[];
  onDelete: (uid: string) => void;
}

export default function EmployeeTable({ employees, onDelete }: EmployeeTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[10px] text-black uppercase tracking-widest font-extrabold border-b border-[var(--border-light)]">
            <th className="text-left pb-4 pr-3 pl-2">Avatar</th>
            <th className="text-left pb-4 pr-3">Name</th>
            <th className="text-left pb-4 pr-3">Email</th>
            <th className="text-left pb-4 pr-3">Department</th>
            <th className="text-left pb-4 pr-3">Role</th>
            <th className="text-left pb-4 pr-3">Profile Image</th>
            <th className="text-center pb-4 px-2">Sheet</th>
            <th className="text-right pb-4 pl-2 pr-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const initial = (emp.fullName || "?").charAt(0).toUpperCase();
            return (
              <tr
                key={emp.uid}
                className="group border-b border-[var(--border-light)]/50 hover:bg-white/20 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Avatar */}
                <td className="py-3.5 pr-3 pl-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden shrink-0">
                    {emp.photoURL ? (
                      <img src={emp.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                </td>
                {/* Name */}
                <td className="py-3.5 pr-3 font-semibold text-black">
                  <Link
                    href={`/admin/employees/details?id=${emp.uid}&tab=profile`}
                    className="hover:text-[var(--color-primary-light)] font-bold transition-colors"
                  >
                    {emp.fullName}
                  </Link>
                </td>
                {/* Email */}
                <td className="py-3.5 pr-3 text-black text-[11px] max-w-[180px] truncate">
                  {emp.email || "—"}
                </td>
                {/* Department */}
                <td className="py-3.5 pr-3 text-black font-medium">
                  {emp.department || "—"}
                </td>
                {/* Role */}
                <td className="py-3.5 pr-3 text-black font-medium capitalize">
                  {emp.role || "—"}
                </td>
                {/* Profile Image */}
                <td className="py-3.5 pr-3 text-left">
                    {emp.photoURL ? (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[12px] font-bold text-white shadow-md overflow-hidden ring-2 ring-white/50">
                      <img src={emp.photoURL} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      No profile image
                    </div>
                  )}
                </td>
                {/* Sheet Status */}
                <td className="py-3.5 text-center px-2">
                  {emp.googleSheetId ? (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${emp.googleSheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-gray-50 transition-all"
                      title="Open employee sheet"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span className="hidden lg:inline">Open</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 text-[10px] font-medium">
                      <FileSpreadsheet className="w-3 h-3" />
                      —
                    </span>
                  )}
                </td>
                {/* Actions */}
                <td className="py-3.5 text-right pl-2 pr-2">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Profile */}
                    <Link
                      href={`/admin/employees/view?id=${emp.uid}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-dim)] hover:shadow-[0_0_8px_rgba(91,76,255,0.2)] transition-all cursor-pointer"
                      title="View Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {/* Edit Profile */}
                    <Link
                      href={`/admin/employees/edit?id=${emp.uid}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.2)] transition-all cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                    {/* Delete Profile */}
                    <button
                      onClick={() => onDelete(emp.uid)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)] transition-all cursor-pointer"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#dc2626" }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
