"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Briefcase, Clock, CalendarOff, IndianRupee, FileSpreadsheet, ExternalLink, Loader2, Video } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { createWorkSheet } from "@/lib/googleSheets";
import { fetchAdminEmails } from "@/lib/adminHelpers";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

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

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("id");
  const { employee, attendanceSummary, leaves, loading, error } = useEmployeeProfile(uid || undefined);

  const initials = employee?.fullName
    ? employee.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const statusStyle = employee ? STATUS_STYLES[employee.status] || STATUS_STYLES.inactive : "";

  const basic = employee?.basicSalary || 0;
  const allowances = employee?.allowances || 0;
  const bonuses = employee?.bonuses || 0;
  const deductions = employee?.deductions || 0;
  const netSalary = basic + allowances + bonuses - deductions;

  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [classManagerEnabled, setClassManagerEnabled] = useState(!!(employee as any)?.canManageClasses);
  const [classManagerSaving, setClassManagerSaving] = useState(false);

  const handleToggleClassManager = async () => {
    if (!employee) return;
    const newVal = !classManagerEnabled;
    setClassManagerSaving(true);
    try {
      await updateDoc(doc(db, "users", employee.uid), { canManageClasses: newVal, updatedAt: serverTimestamp() });
      setClassManagerEnabled(newVal);
    } catch (err: any) {
      console.error("Failed to toggle class manager:", err);
    } finally {
      setClassManagerSaving(false);
    }
  };

  const handleCreateWorkSheet = async () => {
    if (!employee) return;
    setSheetLoading(true);
    setSheetError(null);
    setSheetSuccess(null);
    try {
      const adminEmails = await fetchAdminEmails();
      const result = await createWorkSheet(employee.fullName, employee.email, adminEmails);
      if (result) {
        await updateDoc(doc(db, "users", employee.uid), {
          googleWorkSheetId: result.sheetId,
          updatedAt: serverTimestamp(),
        });
        (employee as any).googleWorkSheetId = result.sheetId;
        setSheetSuccess("Work sheet created successfully!");
      } else {
        setSheetError("Failed to create sheet. Check the Apps Script deployment.");
      }
    } catch (err: any) {
      setSheetError(err?.message || "Error creating sheet");
    } finally {
      setSheetLoading(false);
    }
  };

  if (loading) return <LoadingState variant="page" />;
  if (error) return <ErrorState message={error} />;
  if (!employee) return <ErrorState message="Employee not found" />;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Back button */}
        <button
          onClick={() => router.push("/admin/employees")}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Employees
        </button>

        {/* Section 1: Profile card */}
        <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-lg font-bold text-white shadow-sm overflow-hidden shrink-0">
            {employee.photoURL ? (
              <img src={employee.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#111827] truncate">
                {employee.fullName}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${statusStyle}`}>
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
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Employment Info</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Employee ID</span>
              <span className="text-[#111827] font-semibold tabular-nums mt-0.5 block">{employee.employeeId || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Role Rank</span>
              <span className="text-[#111827] font-semibold capitalize mt-0.5 block">{employee.role}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Department</span>
              <span className="text-[#111827] font-semibold mt-0.5 block">{employee.department || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Designation</span>
              <span className="text-[#111827] font-semibold mt-0.5 block">{employee.designation || "—"}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Attendance Summary */}
        <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
            <Clock className="w-4 h-4 text-[var(--color-primary-light)]" />
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Attendance Summary</h4>
          </div>
          {attendanceSummary ? (
            <div className="grid grid-cols-4 gap-2.5">
              <div className="rounded-xl p-2.5 bg-white text-center border border-emerald-200">
                <p className="text-base font-bold text-emerald-600 tabular-nums">{attendanceSummary.present}</p>
                <p className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider mt-0.5">Present</p>
              </div>
              <div className="rounded-xl p-2.5 bg-white text-center border border-amber-200">
                <p className="text-base font-bold text-amber-600 tabular-nums">{attendanceSummary.late}</p>
                <p className="text-[9px] text-amber-500 font-semibold uppercase tracking-wider mt-0.5">Late</p>
              </div>
              <div className="rounded-xl p-2.5 bg-white text-center border border-red-200">
                <p className="text-base font-bold text-red-500 tabular-nums">{attendanceSummary.absent}</p>
                <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wider mt-0.5">Absent</p>
              </div>
              <div className="rounded-xl p-2.5 bg-white text-center border border-zinc-200">
                <p className="text-base font-bold text-zinc-500 tabular-nums">{attendanceSummary.halfDay}</p>
                <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Half Day</p>
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
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Leave Summary</h4>
          </div>
          {leaves && leaves.length > 0 ? (
            <div className="space-y-2.5">
              {leaves.map((l: any) => {
                const lStyle = LEAVE_STATUS_STYLES[l.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-500";
                return (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-[var(--border-light)] text-xs">
                    <div>
                      <p className="text-[#111827] font-bold">{l.reason || "Personal Leave"}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 tabular-nums">{l.startDate} to {l.endDate}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${lStyle}`}>
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
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Payroll Summary</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400 font-semibold">Basic Salary</span>
               <span className="text-[#111827] font-bold tabular-nums">{basic ? `₹${basic.toLocaleString()}` : "₹0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 font-semibold">Allowances</span>
               <span className="text-emerald-600 font-bold tabular-nums">{allowances ? `+₹${allowances.toLocaleString()}` : "₹0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 font-semibold">Bonuses</span>
               <span className="text-emerald-600 font-bold tabular-nums">{bonuses ? `+₹${bonuses.toLocaleString()}` : "₹0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 font-semibold">Deductions</span>
               <span className="text-red-500 font-bold tabular-nums">{deductions ? `-₹${deductions.toLocaleString()}` : "₹0.00"}</span>
            </div>
            <div className="pt-2.5 border-t border-[var(--border-light)] flex justify-between">
              <span className="text-[#111827] font-bold uppercase tracking-wider text-[10px]">Estimated Net Salary</span>
               <span className="text-[var(--color-primary)] font-extrabold text-sm tabular-nums">₹{netSalary.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Section 6: Work Sheet */}
        <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Work Sheet</h4>
          </div>

          {sheetError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{sheetError}</p>
          )}
          {sheetSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{sheetSuccess}</p>
          )}

          {(employee as any).googleWorkSheetId ? (
            <a
              href={`https://docs.google.com/spreadsheets/d/${(employee as any).googleWorkSheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 group hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Open Sheet</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">View {employee.fullName}&apos;s work log</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
            </a>
          ) : (
            <button
              onClick={handleCreateWorkSheet}
              disabled={sheetLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold shadow-[0_4px_12px_rgba(52,211,153,0.2)] hover:shadow-[0_6px_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {sheetLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {sheetLoading ? "Creating Work Sheet..." : "Create Work Sheet"}
            </button>
          )}
        </div>

        {/* Section 7: Class Manager Access */}
        <div className="hrms-glass bg-white/55 rounded-[20px] p-5 border border-[var(--border-light)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
            <Video className="w-4 h-4 text-violet-500" />
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Class Manager Access</h4>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <div>
              <p className="text-xs font-bold text-[#111827]">Allow this employee to manage student classes</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Employee can add, edit & delete recorded video classes for paid users from their portal</p>
            </div>
            <button
              onClick={handleToggleClassManager}
              disabled={classManagerSaving}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ml-4 ${
                classManagerEnabled ? "bg-violet-500" : "bg-zinc-300"
              } ${classManagerSaving ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  classManagerEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeViewPage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <ProfileContent />
    </Suspense>
  );
}
