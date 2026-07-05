"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { useEmployeeLeaves } from "@/hooks/useEmployeeLeaves";
import ProfileSidebar, { type ProfileTab } from "@/components/employee/ProfileSidebar";
import { formatFirebaseDate } from "@/lib/format";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/leaves";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  Edit3, Download, Mail, Phone, Calendar, MapPin, Shield,
  CheckCircle, XCircle, Clock, ArrowRight, ChevronRight,
  Eye, Download as DownloadIcon, Key, Camera, Bell,
  FileText, Image, FileSpreadsheet, File,
  Sun, Moon, Globe, Lock, Users,
  Settings2, ExternalLink, Briefcase, Building,
  User, CalendarDays, Wallet, CalendarCheck,
} from "lucide-react";

export default function EmployeeProfile() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const { employee, attendanceSummary, leaves, activityLog, loading, error } = useEmployeeProfile(uid);
  const { balances } = useEmployeeLeaves();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) return <LoadingState variant="page" />;
  if (error) return <ErrorState message={error} />;
  if (!employee) return <ErrorState message="Employee profile not found" />;

  const attendancePct = attendanceSummary.total > 0
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
    : 0;

  const totalLeaveBalance = balances
    ? Object.values(balances).reduce((s, b) => s + b.remaining, 0)
    : 0;

  const yearsOfService = employee.createdAt
    ? Math.floor(
        (Date.now() - (employee.createdAt?.toDate?.()?.getTime() || Date.now())) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : 0;

  const avatarLetter = (employee.fullName || "U").charAt(0).toUpperCase();

  function formatSalary(val?: number) {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Employee / Profile
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">My Profile</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage your personal information, employment details and account settings.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-md">
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Download Profile
          </button>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/35 border border-[var(--border-light)]/50 text-zinc-700"
      >
        <Settings2 className="w-3.5 h-3.5" />
        {sidebarOpen ? "Hide Navigation" : "Show Navigation"}
      </button>

      {/* Sidebar + Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-48 shrink-0`}>
          <div className="hrms-glass rounded-[20px] p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm sticky top-6">
            <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <>
              {/* Profile Hero */}
              <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Left: Avatar + Basic Info */}
                  <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:text-center sm:min-w-[180px]">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-3xl sm:text-4xl text-white font-extrabold shadow-lg shrink-0">
                      {employee.photoURL ? (
                        <img src={employee.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        avatarLetter
                      )}
                    </div>
                    <div className="sm:mt-1">
                      <h2 className="text-xl font-extrabold text-[#111827]">{employee.fullName}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5 font-mono">#{employee.employeeId}</p>
                      <div className="flex flex-wrap sm:justify-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-primary-dim)] text-[10px] font-bold text-[var(--color-primary)]">
                          <Briefcase className="w-3 h-3" />
                          {employee.designation || "—"}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-primary-dim)] text-[10px] font-bold text-[var(--color-primary)]">
                          <Building className="w-3 h-3" />
                          {employee.department || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Stats */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/60 rounded-2xl p-3.5 border border-[var(--border-light)]/50 text-center hover:shadow-sm transition-shadow">
                      <p className="text-lg font-extrabold text-[var(--color-primary)] tabular-nums">{attendancePct}%</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Attendance</p>
                    </div>
                    <div className="bg-white/60 rounded-2xl p-3.5 border border-[var(--border-light)]/50 text-center hover:shadow-sm transition-shadow">
                      <p className="text-lg font-extrabold text-emerald-500 tabular-nums">{totalLeaveBalance}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Leave Balance</p>
                    </div>
                    <div className="bg-white/60 rounded-2xl p-3.5 border border-[var(--border-light)]/50 text-center hover:shadow-sm transition-shadow">
                      <p className="text-lg font-extrabold text-amber-500 tabular-nums">{leaves.length}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Leaves Taken</p>
                    </div>
                    <div className="bg-white/60 rounded-2xl p-3.5 border border-[var(--border-light)]/50 text-center hover:shadow-sm transition-shadow">
                      <p className="text-lg font-extrabold text-violet-500 tabular-nums">{yearsOfService}y</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Years of Service</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#111827]">Recent Activity</h3>
                  </div>
                </div>

                {activityLog.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-semibold">No recent activity</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--color-primary)]/30 via-[var(--color-primary-light)]/20 to-transparent rounded-full" />
                    <div className="space-y-0">
                      {activityLog.slice(0, 8).map((log: any, i: number) => {
                        const typeColor =
                          log.type === "attendance" ? "bg-emerald-500" :
                          log.type === "leave" ? "bg-amber-500" :
                          log.type === "payroll" ? "bg-[var(--color-primary)]" :
                          "bg-zinc-400";
                        const typeIcon =
                          log.type === "attendance" ? "▶" :
                          log.type === "leave" ? "✈" :
                          log.type === "payroll" ? "$" : "•";
                        return (
                          <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                            <div className={`relative z-10 w-2.5 h-2.5 rounded-full ${typeColor} ring-4 ring-white/80 mt-1.5 shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#111827]">{log.description || log.action || "Activity"}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{formatFirebaseDate(log.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== PERSONAL INFO ===== */}
          {activeTab === "personal" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: employee.fullName, icon: User },
                  { label: "Email", value: employee.email, icon: Mail },
                  { label: "Mobile", value: employee.phone || "—", icon: Phone },
                  { label: "Date of Birth", value: "—", icon: Calendar },
                  { label: "Gender", value: "—", icon: Users },
                ].map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.label} className="bg-white/60 rounded-2xl px-4 py-3 border border-[var(--border-light)]/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{field.label}</p>
                        <p className="text-sm font-bold text-[#111827]">{field.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== EMPLOYMENT ===== */}
          {activeTab === "employment" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Employment Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Employee ID", value: employee.employeeId, icon: Shield },
                  { label: "Department", value: employee.department || "—", icon: Building },
                  { label: "Designation", value: employee.designation || "—", icon: Briefcase },
                  { label: "Reporting Manager", value: "—", icon: Users },
                  { label: "Joining Date", value: employee.createdAt ? formatFirebaseDate(employee.createdAt) : "—", icon: Calendar },
                  { label: "Status", value: employee.status || "active", icon: CheckCircle },
                ].map((field) => {
                  const Icon = field.icon;
                  const isStatus = field.label === "Status";
                  return (
                    <div key={field.label} className="bg-white/60 rounded-2xl px-4 py-3 border border-[var(--border-light)]/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{field.label}</p>
                        <p className={`text-sm font-bold ${isStatus ? "text-emerald-500 capitalize" : "text-[#111827]"}`}>
                          {isStatus ? (field.value as string).replace("-", " ") : field.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== ATTENDANCE ===== */}
          {activeTab === "attendance" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <CalendarCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Attendance Summary</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut chart */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                    {attendanceSummary.present > 0 && (
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(attendanceSummary.present / Math.max(attendanceSummary.total, 1)) * 201} 201`}
                        transform="rotate(-90, 40, 40)" />
                    )}
                    {attendanceSummary.late > 0 && (
                      <circle cx="40" cy="40" r="24" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(attendanceSummary.late / Math.max(attendanceSummary.total, 1)) * 151} 151`}
                        transform="rotate(-90, 40, 40)" />
                    )}
                    {attendanceSummary.absent > 0 && (
                      <circle cx="40" cy="40" r="16" fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(attendanceSummary.absent / Math.max(attendanceSummary.total, 1)) * 100} 100`}
                        transform="rotate(-90, 40, 40)" />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-[#111827] tabular-nums">{attendancePct}%</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Attendance</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                  <div className="bg-white/60 rounded-2xl px-4 py-3.5 border border-[var(--border-light)]/50 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-lg font-extrabold text-[#111827] tabular-nums">{attendanceSummary.present}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Present</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-2xl px-4 py-3.5 border border-[var(--border-light)]/50 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-lg font-extrabold text-[#111827] tabular-nums">{attendanceSummary.late}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Late</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-2xl px-4 py-3.5 border border-[var(--border-light)]/50 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <p className="text-lg font-extrabold text-[#111827] tabular-nums">{attendanceSummary.absent}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Absent</p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-2xl px-4 py-3.5 border border-[var(--border-light)]/50 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-zinc-300 shrink-0" />
                    <div>
                      <p className="text-lg font-extrabold text-[#111827] tabular-nums">{attendanceSummary.halfDay}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Half Day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== LEAVES ===== */}
          {activeTab === "leaves" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Leave Summary</h3>
              </div>
              {balances ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.entries(balances) as [string, { available: number; used: number; remaining: number }][]).map(([type, b]) => {
                    const pct = b.available > 0 ? (b.used / b.available) * 100 : 0;
                    const radius = 30;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (pct / 100) * circumference;
                    const typeColors: Record<string, { stroke: string; text: string }> = {
                      casual: { stroke: "#10B981", text: "text-emerald-500" },
                      sick: { stroke: "#F59E0B", text: "text-amber-500" },
                      paid: { stroke: "#5B4CFF", text: "text-[var(--color-primary)]" },
                      emergency: { stroke: "#EF4444", text: "text-red-500" },
                    };
                    const colors = typeColors[type] || { stroke: "#5B4CFF", text: "text-[var(--color-primary)]" };
                    return (
                      <div key={type} className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-2.5 mb-3">
                          <p className="text-sm font-extrabold text-[#111827]">{LEAVE_TYPE_LABELS[type as LeaveType] || type}</p>
                        </div>
                        <div className="flex items-center justify-center py-2">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                              <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
                              <circle cx="36" cy="36" r={radius} fill="none" stroke={colors.stroke} strokeWidth="5" strokeLinecap="round"
                                strokeDasharray={circumference} strokeDashoffset={offset}
                                className="transition-all duration-700" style={{ opacity: pct > 0 ? 1 : 0.3 }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-extrabold text-[#111827] tabular-nums">{b.remaining}</span>
                              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Left</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-[var(--border-light)]/50">
                          <div className="text-center">
                            <p className="text-base font-extrabold text-[#111827] tabular-nums">{b.used}</p>
                            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Used</p>
                          </div>
                          <div className="w-px h-6 bg-[var(--border-light)]/50" />
                          <div className="text-center">
                            <p className="text-base font-extrabold text-[#111827] tabular-nums">{b.available}</p>
                            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Total</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-8">
                  <CalendarDays className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-semibold">Leave balances loading...</p>
                </div>
              )}
            </div>
          )}

          {/* ===== PAYROLL ===== */}
          {activeTab === "payroll" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Payroll Summary</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-white/60 rounded-2xl p-4 border border-[var(--border-light)]/50 text-center">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Current Salary</p>
                  <p className="text-2xl font-extrabold text-[var(--color-primary)] tabular-nums">
                    {formatSalary(employee.basicSalary)}
                  </p>
                  {employee.allowances != null && employee.deductions != null && (
                    <div className="flex justify-center gap-4 mt-2 text-[10px]">
                      <span className="text-emerald-500 font-bold">+{formatSalary(employee.allowances)}</span>
                      <span className="text-red-500 font-bold">-{formatSalary(employee.deductions)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white/60 rounded-2xl p-4 border border-[var(--border-light)]/50 text-center">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Last Payslip</p>
                  <p className="text-sm font-bold text-[#111827]">—</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">No payslip data</p>
                </div>
                <div className="bg-white/60 rounded-2xl p-4 border border-[var(--border-light)]/50 text-center">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Last Payment</p>
                  <p className="text-sm font-bold text-[#111827]">—</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">No payment data</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-sm">
                  <Eye className="w-3.5 h-3.5" />
                  View Payslip
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer">
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Download Payslip
                </button>
              </div>
            </div>
          )}

          {/* ===== DOCUMENTS ===== */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Employee Documents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "ID Proof", icon: Image, desc: "Aadhar Card / PAN Card" },
                  { name: "Offer Letter", icon: FileText, desc: "Employment offer document" },
                  { name: "Joining Letter", icon: FileSpreadsheet, desc: "Letter of appointment" },
                  { name: "Payslips", icon: File, desc: "Monthly salary slips" },
                ].map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <div key={doc.name} className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-[#111827]">{doc.name}</p>
                        <p className="text-[10px] text-zinc-400">{doc.desc}</p>
                      </div>
                      <DownloadIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <Settings2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-sm font-extrabold text-[#111827]">Account Settings</h3>
              </div>

              {/* Change Password */}
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">Change Password</p>
                    <p className="text-[10px] text-zinc-400">Update your account password</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-sm shrink-0">
                  <Key className="w-3 h-3" />
                  Update
                </button>
              </div>

              {/* Change Profile Picture */}
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">Change Profile Picture</p>
                    <p className="text-[10px] text-zinc-400">Upload a new photo</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer shrink-0">
                  <Camera className="w-3 h-3" />
                  Upload
                </button>
              </div>

              {/* Update Contact Information */}
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">Update Contact Information</p>
                    <p className="text-[10px] text-zinc-400">Email, phone and address</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer shrink-0">
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {/* Notification Preferences */}
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">Notification Preferences</p>
                    <p className="text-[10px] text-zinc-400">Manage your alert settings</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Email Notifications", desc: "Receive updates via email", defaultOn: true },
                    { label: "SMS Alerts", desc: "Get SMS for attendance and payroll", defaultOn: false },
                    { label: "Leave Approvals", desc: "Get notified when leaves are approved", defaultOn: true },
                    { label: "Payroll Updates", desc: "Monthly payslip notifications", defaultOn: true },
                  ].map((pref) => (
                    <label key={pref.label} className="flex items-center justify-between gap-3 bg-white/60 rounded-xl px-4 py-3 border border-[var(--border-light)]/50 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-[#111827]">{pref.label}</p>
                        <p className="text-[10px] text-zinc-400">{pref.desc}</p>
                      </div>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${pref.defaultOn ? "bg-[var(--color-primary)]" : "bg-zinc-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${pref.defaultOn ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
