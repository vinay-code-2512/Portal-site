"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { Download, UserCheck, X } from "lucide-react";
import { useAdminAttendance } from "@/hooks/useAdminAttendance";
import AttendanceDatePicker from "@/components/admin/attendance/AttendanceDatePicker";
import AttendanceSummaryCards from "@/components/admin/attendance/AttendanceSummaryCards";
import AttendanceTable from "@/components/admin/attendance/AttendanceTable";
import MonthlyCalendarView from "@/components/admin/attendance/MonthlyCalendarView";
import LiveMonitor from "@/components/admin/attendance/LiveMonitor";
import MarkAttendanceModal from "@/components/admin/attendance/MarkAttendanceModal";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

const AttendanceOverviewDonut = dynamic(() => import("@/components/admin/attendance/AttendanceOverviewDonut"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});
const AttendanceAnalytics = dynamic(() => import("@/components/admin/attendance/AttendanceAnalytics"), {
  loading: () => <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />,
});

export default function AdminAttendancePage() {
  const {
    records,
    stats,
    selectedDate,
    loading,
    error,
    goToPrevDay,
    goToNextDay,
    goToToday,
    setSelectedDate,
    refresh,
  } = useAdminAttendance();

  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showGlobalMarkModal, setShowGlobalMarkModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s) setStatusFilter(s);
  }, []);

  // 1. Calculate dynamic department list from live employee records
  const departments = useMemo(() => {
    const depts = new Set<string>();
    records.forEach((r) => {
      if (r.department) depts.add(r.department);
    });
    return Array.from(depts).sort();
  }, [records]);

  // 2. Filter records based on selected department in frontend state
  const filteredRecords = useMemo(() => {
    let list = records;
    if (selectedDepartment !== "all") {
      list = list.filter((r) => r.department === selectedDepartment);
    }
    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  }, [records, selectedDepartment, statusFilter]);

  // 3. Recalculate stats for the selected department
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    if (selectedDepartment === "all") return stats;

    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === "present").length;
    const late = filteredRecords.filter((r) => r.status === "late").length;
    const absent = filteredRecords.filter((r) => r.status === "absent").length;
    const halfDay = filteredRecords.filter((r) => r.status === "half-day").length;
    const onLeave = filteredRecords.filter((r) => r.status === "on-leave").length;
    const checkedOut = filteredRecords.filter((r) => r.status === "checked-out").length;
    const onBreak = filteredRecords.filter((r) => r.breaks?.some((b) => b && !b.end)).length;
    const presentOrLate = present + late + halfDay + checkedOut;
    const attendancePercent = total > 0 ? Math.round((presentOrLate / total) * 100) : 0;

    return {
      total,
      present,
      late,
      absent,
      halfDay,
      onLeave,
      checkedOut,
      onBreak,
      attendancePercent,
    };
  }, [stats, filteredRecords, selectedDepartment]);

  // 4. Identify currently absent workers to feed into global mark attendance dropdown
  const absentEmployees = useMemo(() => {
    return records
      .filter((r) => r.status === "absent")
      .map((r) => ({ uid: r.uid, name: r.name }));
  }, [records]);

  // 5. Download helper for client-side CSV downloads
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ["Employee Name", "Department", "Check In", "Check Out", "Working Hours", "Status"];
    const rows = filteredRecords.map((r) => [
      r.name,
      r.department || "—",
      r.checkIn ? (r.checkIn.toDate ? r.checkIn.toDate() : new Date(r.checkIn)).toLocaleTimeString() : "—",
      r.checkOut ? (r.checkOut.toDate ? r.checkOut.toDate() : new Date(r.checkOut)).toLocaleTimeString() : "—",
      r.netHours || "—",
      r.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedDate}${selectedDepartment !== "all" ? `_${selectedDepartment}` : ""}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Operations / Admin Panel
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Monitor attendance, shifts and workforce presence.
          </p>
        </div>

        {/* Premium Purple Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Attendance
          </button>
          <button
            onClick={() => setShowGlobalMarkModal(true)}
            disabled={absentEmployees.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-md"
          >
            <UserCheck className="w-4 h-4" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Date controls and filters toolbar */}
      <AttendanceDatePicker
        selectedDate={selectedDate}
        onPrev={goToPrevDay}
        onNext={goToNextDay}
        onToday={goToToday}
        onChange={setSelectedDate}
        departments={departments}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
      />

      {/* Main layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-10 gap-6">
        {/* Left main content panels (70% on desktop) */}
        <div className="md:col-span-2 lg:col-span-7 space-y-6">
          {filteredStats && <AttendanceSummaryCards stats={filteredStats} records={filteredRecords} activeFilter={statusFilter} onCardClick={setStatusFilter} />}

          {statusFilter && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/20 text-xs font-semibold text-[var(--color-primary-light)]">
              <span>Showing <span className="uppercase">{statusFilter}</span> employees only</span>
              <button
                onClick={() => setStatusFilter(null)}
                className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Donut Overview Chart & Trend Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStats && <AttendanceOverviewDonut stats={filteredStats} />}
            <AttendanceAnalytics records={filteredRecords} />
          </div>

          {/* Log Table */}
          <AttendanceTable records={filteredRecords} selectedDate={selectedDate} onRefresh={refresh} />

          {/* Calendar heatmap */}
          <MonthlyCalendarView />
        </div>

        {/* Right presence monitor panel (30% on desktop) */}
        <div className="md:col-span-1 lg:col-span-3 h-full">
          <LiveMonitor records={records} />
        </div>
      </div>

      {/* Global Mark Attendance Modal */}
      {showGlobalMarkModal && (
        <MarkAttendanceModal
          selectedDate={selectedDate}
          absentEmployees={absentEmployees}
          onClose={() => setShowGlobalMarkModal(false)}
          onDone={() => {
            setShowGlobalMarkModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
