"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, orderBy, Timestamp, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  IndianRupee,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  CalendarDays,
  Percent,
  Hash,
  AlertTriangle,
  Shield,
  ChevronRight,
  Play,
  Coffee,
  Timer,
  Target,
  AlertCircle,
  Video,
} from "lucide-react";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { getTodayRecord } from "@/lib/attendance";
import { getLocalDateString } from "@/lib/format";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

const BADGE_VARIANTS: Record<string, string> = {
  present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  late: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  absent: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
  approved: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  rejected: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
  paid: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-red-500",
};

export default function DetailsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DetailsContent />
    </Suspense>
  );
}

function DetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const tab = searchParams.get("tab") || "profile";

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm">No employee selected.</p>
      </div>
    );
  }

  return <EmployeeDetails employeeId={id} activeTab={tab} />;
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim().toUpperCase();
  const isPM = trimmed.includes("PM");
  const isAM = trimmed.includes("AM");
  const clean = trimmed.replace(/(AM|PM)/, "").trim();
  const parts = clean.split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  let h = parts[0];
  const m = parts[1];
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  return { hours: h, minutes: m };
}

function computeHours(checkIn: string, checkOut: string): string {
  const ci = parseTime(checkIn);
  const co = parseTime(checkOut);
  if (!ci || !co) return "—";
  const startMin = ci.hours * 60 + ci.minutes;
  const endMin = co.hours * 60 + co.minutes;
  let diff = endMin - startMin;
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}






function EmployeeDetails({ employeeId, activeTab }: { employeeId: string; activeTab: string }) {
  const { employee, loading, error } = useEmployeeProfile(employeeId);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pageLoading, setPageLoading] = useState(true);
  const [classManagerEnabled, setClassManagerEnabled] = useState(false);
  const [classManagerSaving, setClassManagerSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setClassManagerEnabled(!!(employee as any).canManageClasses);
    }
  }, [employee]);

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

  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        const [attSnap, today] = await Promise.all([
          getDocs(query(collection(db, "attendance"), where("employeeId", "==", employeeId))),
          getTodayRecord(employeeId),
        ]);

        setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)));
        setTodayRecord(today);
      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading || pageLoading) return <LoadingState />;
  if (error || !employee) return <ErrorState message={error || "Employee not found"} />;

  const emp = employee as any;
  const initials = emp.fullName
    ? emp.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span>Employees</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white font-medium">{emp.fullName}</span>
      </div>

      {/* Header Card */}
      <div className="hrms-glass rounded-[20px] p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0 overflow-hidden">
            {emp.photoURL ? (
              <img src={emp.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white truncate">{emp.fullName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${BADGE_VARIANTS[emp.status] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
                {emp.role}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-3">{emp.designation} &middot; {emp.department}</p>
            <div className="flex flex-wrap gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {emp.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {emp.phone || "—"}</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Emp ID: {emp.employeeId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {activeTab === "profile" && (
          <>
            <SectionCard icon={<Briefcase className="w-4 h-4" />} title="Employment Info">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem icon={<Hash className="w-3.5 h-3.5" />} label="Employee ID" value={emp.employeeId} />
                <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="Department" value={emp.department} />
                <InfoItem icon={<Briefcase className="w-3.5 h-3.5" />} label="Designation" value={emp.designation} />
                <InfoItem icon={<CalendarDays className="w-3.5 h-3.5" />} label="Joining Date" value={emp.joiningDate} />
                <InfoItem icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={`${emp.city || ""}, ${emp.state || ""}`.replace(/^, /, "") || "—"} />
                <InfoItem icon={<Shield className="w-3.5 h-3.5" />} label="Role" value={emp.role} className="capitalize" />
              </div>
            </SectionCard>

            <SectionCard icon={<User className="w-4 h-4" />} title="Personal Info">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={emp.email} />
                <InfoItem icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={emp.phone || "—"} />
                <InfoItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date of Birth" value={emp.dateOfBirth || "—"} />
                <InfoItem icon={<User className="w-3.5 h-3.5" />} label="Gender" value={emp.gender || "—"} />
                <InfoItem icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={emp.address || "—"} className="col-span-2" />
              </div>
            </SectionCard>

            <SectionCard icon={<CreditCard className="w-4 h-4" />} title="Payroll Info">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem icon={<IndianRupee className="w-3.5 h-3.5" />} label="Salary" value={emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}` : "—"} />
                <InfoItem icon={<CreditCard className="w-3.5 h-3.5" />} label="Bank Account" value={emp.bankAccountNumber ? `****${String(emp.bankAccountNumber).slice(-4)}` : "—"} />
                <InfoItem icon={<Hash className="w-3.5 h-3.5" />} label="IFSC Code" value={emp.ifscCode || "—"} />
                <InfoItem icon={<FileText className="w-3.5 h-3.5" />} label="PAN Number" value={emp.panNumber || "—"} />
                <InfoItem icon={<Percent className="w-3.5 h-3.5" />} label="UAN Number" value={emp.uanNumber || "—"} />
                <InfoItem icon={<Shield className="w-3.5 h-3.5" />} label="PF Number" value={emp.pfNumber || "—"} />
                <InfoItem icon={<AlertTriangle className="w-3.5 h-3.5" />} label="ESI Number" value={emp.esiNumber || "—"} />
              </div>
            </SectionCard>

            <SectionCard icon={<Video className="w-4 h-4" />} title="Class Manager Access">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">Allow this employee to manage student classes</p>
                  <p className="text-xs text-zinc-400 mt-1">Employee can add, edit & delete recorded video classes for paid users from their portal</p>
                </div>
                <button
                  onClick={handleToggleClassManager}
                  disabled={classManagerSaving}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ml-4 border ${
                    classManagerEnabled ? "bg-[var(--color-primary)] border-[var(--color-primary-light)]" : "bg-zinc-800 border-zinc-700"
                  } ${classManagerSaving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      classManagerEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === "attendance" && (
          <TodayAttendanceContent todayRecord={todayRecord} currentTime={currentTime} emp={emp} />
        )}
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="hrms-glass rounded-[20px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--color-primary-light)]">{icon}</span>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="hrms-glass rounded-[20px] p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
          <span className="text-[var(--color-primary-light)]">{icon}</span>
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function InfoItem({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="w-7 h-7 rounded-md bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[var(--color-primary-light)]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-xs text-zinc-200 font-medium truncate ${className}`}>{value}</p>
      </div>
    </div>
  );
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime12(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateNice(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toDate(val: any): Date {
  if (!val) return new Date();
  if (val.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
}

function TodayAttendanceContent({ todayRecord, currentTime, emp }: { todayRecord: any; currentTime: Date; emp: any }) {
  const checkedIn = todayRecord?.checkIn;
  const checkedOut = todayRecord?.checkOut;
  const breaks: any[] = todayRecord?.breaks || [];
  const hasOpenBreak = breaks.some((b: any) => !b.end);
  const todayStatus = todayRecord?.status || "absent";

  let grossMs = 0;
  let completedBreakMs = 0;
  let currentWorkMs = 0;

  if (checkedIn) {
    const checkInDate = toDate(checkedIn);
    const endDate = checkedOut ? toDate(checkedOut) : currentTime;
    grossMs = endDate.getTime() - checkInDate.getTime();

    completedBreakMs = breaks.reduce((sum: number, b: any) => {
      if (b.end) return sum + (toDate(b.end).getTime() - toDate(b.start).getTime());
      return sum;
    }, 0);

    const openBreakMs = hasOpenBreak
      ? currentTime.getTime() - toDate(breaks.find((b: any) => !b.end).start).getTime()
      : 0;

    const totalBreakMs = completedBreakMs + openBreakMs;
    currentWorkMs = Math.max(0, grossMs - totalBreakMs);
  }

  const STATUS_STYLES: Record<string, string> = {
    present: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    late: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    absent: "bg-red-500/10 border-red-500/20 text-red-400",
    "half-day": "bg-orange-500/10 border-orange-500/20 text-orange-400",
  };

  const STATUS_DOTS: Record<string, string> = {
    present: "bg-emerald-400",
    late: "bg-amber-400",
    absent: "bg-red-400",
    "half-day": "bg-orange-400",
  };

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    present: <Play className="w-4 h-4" />,
    late: <AlertCircle className="w-4 h-4" />,
    absent: <AlertCircle className="w-4 h-4" />,
    "half-day": <AlertCircle className="w-4 h-4" />,
  };

  const statusText = todayRecord
    ? todayStatus === "present"
      ? checkedOut
        ? "Completed"
        : hasOpenBreak
          ? "On Break"
          : "Working"
      : todayStatus.charAt(0).toUpperCase() + todayStatus.slice(1)
    : "Not Checked In";

  const shiftDuration = emp?.shiftDurationHours || 8;
  const shiftProgress = Math.min(100, Math.round((currentWorkMs / (shiftDuration * 3600000)) * 100));

  const timelineItems: { time: string; label: string; icon: React.ReactNode; active: boolean }[] = [];

  if (checkedIn) {
    timelineItems.push({
      time: formatTime12(toDate(checkedIn)),
      label: "Check In",
      icon: <Play className="w-3 h-3" />,
      active: true,
    });

    breaks.forEach((b: any) => {
      timelineItems.push({
        time: formatTime12(toDate(b.start)),
        label: "Break Start",
        icon: <Coffee className="w-3 h-3" />,
        active: true,
      });
      if (b.end) {
        timelineItems.push({
          time: formatTime12(toDate(b.end)),
          label: "Break End",
          icon: <Coffee className="w-3 h-3" />,
          active: true,
        });
      } else {
        timelineItems.push({
          time: "—",
          label: "Break (Ongoing)",
          icon: <Coffee className="w-3 h-3" />,
          active: false,
        });
      }
    });

    timelineItems.push({
      time: checkedOut ? formatTime12(toDate(checkedOut)) : formatTime12(currentTime),
      label: checkedOut ? "Check Out" : "Active",
      icon: <Clock className="w-3 h-3" />,
      active: !!checkedOut,
    });
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">{formatDateNice(currentTime)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {formatTime12(currentTime)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${hasOpenBreak ? "animate-pulse" : ""} ${STATUS_DOTS[todayStatus] || "bg-zinc-500"}`} />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${STATUS_STYLES[todayStatus] || "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"}`}>
              {STATUS_ICONS[todayStatus] || null}
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {!todayRecord ? (
        <div className="hrms-glass rounded-[20px] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 font-medium">No attendance recorded for today</p>
          <p className="text-xs text-zinc-600 mt-1">The employee has not checked in yet today.</p>
        </div>
      ) : (
        <>
          {/* Today's Breakdown */}
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Today's Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-[var(--color-primary-light)]">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(grossMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Gross Hours</p>
              </div>
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-amber-400">
                  <Coffee className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(completedBreakMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Break Time</p>
              </div>
              <div className="hrms-glass rounded-[16px] p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] mb-2 text-emerald-400">
                  <Timer className="w-4 h-4" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums">{formatMs(currentWorkMs)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">Net Hours</p>
              </div>
            </div>
          </div>

          {/* Shift Progress */}
          <div>
            <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Shift Progress</h3>
            <div className="hrms-glass rounded-[20px] p-5 flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--color-primary-light)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(shiftProgress / 100) * 213.6} 213.6`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[var(--color-primary-light)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white">{shiftProgress}%</p>
                <p className="text-xs text-zinc-500">of {shiftDuration}-hour shift completed</p>
                <div className="mt-2 w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500"
                    style={{ width: `${shiftProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {timelineItems.length > 0 && (
            <div>
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Session Timeline</h3>
              <div className="hrms-glass rounded-[20px] p-5">
                <div className="space-y-0">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pb-4 last:pb-0">
                      {idx < timelineItems.length - 1 && (
                        <div className="absolute left-[15px] top-7 bottom-0 w-px bg-white/[0.06]" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.active ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]" : "bg-white/[0.04] text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0 pt-1">
                        <p className="text-xs text-zinc-300 font-medium">{item.label}</p>
                        <p className="text-[11px] text-zinc-500 tabular-nums">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
