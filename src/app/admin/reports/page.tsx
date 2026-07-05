"use client";

import dynamic from "next/dynamic";
import { useMemo, useCallback } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useReports } from "@/hooks/useReports";
import ReportsHeader from "@/components/reports/ReportsHeader";
import DateFilter from "@/components/reports/DateFilter";
import AnalyticsCards from "@/components/reports/AnalyticsCards";
import EmployeeAnalyticsTable from "@/components/reports/EmployeeAnalyticsTable";
import ReportsInsights from "@/components/reports/ReportsInsights";
import ExportCenter from "@/components/reports/ExportCenter";
import { AlertTriangle } from "lucide-react";

const AttendanceChart = dynamic(() => import("@/components/reports/AttendanceChart"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});
const DepartmentAnalytics = dynamic(() => import("@/components/reports/DepartmentAnalytics"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});
const PayrollChart = dynamic(() => import("@/components/reports/PayrollChart"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});
const LeaveChart = dynamic(() => import("@/components/reports/LeaveChart"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});

export default function AdminReports() {
  const { canViewReports, loading: permLoading } = usePermissions();
  const {
    activeTab, setActiveTab,
    preset, setPreset,
    customStart, customEnd, setCustomStart, setCustomEnd,
    overview, attendanceData, leaveData, payrollData,
    employeeAnalytics, departmentData, loading, error, canExport,
  } = useReports();

  const exportData = useMemo(() => {
    if (!canExport || !attendanceData || !leaveData || !payrollData) return null;

    return {
      attendanceSummary: attendanceData.daily.slice(-30).map((d) => ({
        date: d.date, present: d.present, absent: d.absent, late: d.late, onLeave: d.onLeave,
      })),
      leaveSummary: leaveData.byStatus.map((s) => ({ status: s.status, count: s.count })),
      payrollSummary: payrollData.byDepartment.map((d) => ({
        department: d.department, total: d.total, employees: d.count,
        average: d.count > 0 ? Math.round(d.total / d.count) : 0,
      })),
      departmentSummary: departmentData.map((d) => ({
        department: d.department, employees: d.employeeCount,
        attendancePercent: d.attendancePercent, leavesTaken: d.leaveCount,
      })),
      employeeAnalytics: employeeAnalytics.slice(0, 20).map((e) => ({
        name: e.name, department: e.department, attendancePercent: e.attendancePercent,
        presentDays: e.presentDays, lateDays: e.lateDays, leaveDays: e.leaveDays,
      })),
    };
  }, [canExport, attendanceData, leaveData, payrollData, departmentData, employeeAnalytics]);

  const handleExportPdf = useCallback(() => {
    if (!exportData) return;
    const sections: { heading: string; rows: [string, string][] }[] = [
      {
        heading: "Attendance Summary",
        rows: exportData.attendanceSummary.slice(0, 15).map((r): [string, string] => [String(r.date), String(r.present)]),
      },
      {
        heading: "Leave Summary",
        rows: exportData.leaveSummary.map((r): [string, string] => [String(r.status), String(r.count)]),
      },
      {
        heading: "Payroll Summary",
        rows: exportData.payrollSummary.map((r): [string, string] => [String(r.department), `₹${Number(r.total).toLocaleString("en-IN")}`]),
      },
    ];
    import("@/utils/exportReports").then((mod) => mod.exportReportToPdf("Reports_Analytics", sections));
  }, [exportData]);

  const handleExportExcel = useCallback(() => {
    if (!exportData) return;
    import("@/utils/exportReports").then((mod) => {
      const all = [
        ...exportData.attendanceSummary.map((r) => ({ ...r, type: "Attendance" })),
        ...exportData.leaveSummary.map((r) => ({ ...r, type: "Leaves" })),
        ...exportData.payrollSummary.map((r) => ({ ...r, type: "Payroll" })),
      ];
      mod.exportToExcel(all, "full_report", "Reports & Analytics");
    });
  }, [exportData]);

  const handleGenerateReport = useCallback(() => {
    handleExportPdf();
  }, [handleExportPdf]);

  if (permLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  }

  if (!canViewReports) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
        <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <ReportsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        onGenerateReport={handleGenerateReport}
        canExport={canExport}
      />

      <DateFilter
        preset={preset}
        onPresetChange={setPreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      {error && (
        <div className="hrms-glass rounded-[20px] p-4 border border-rose-500/20 bg-rose-500/10 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <p className="text-xs font-semibold text-rose-600">{error}</p>
        </div>
      )}

      {/* Overview Dashboard */}
      {activeTab === "overview" && (
        <>
          <AnalyticsCards data={overview} loading={loading} />
          <AttendanceChart data={attendanceData} loading={loading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentAnalytics data={departmentData} loading={loading} />
            <PayrollChart data={payrollData} loading={loading} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveChart data={leaveData} loading={loading} />
            <ReportsInsights />
          </div>
          <EmployeeAnalyticsTable data={employeeAnalytics} loading={loading} />
          <ExportCenter data={exportData} />
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <>
          <AttendanceChart data={attendanceData} loading={loading} />
          {employeeAnalytics.length > 0 && (
            <EmployeeAnalyticsTable data={employeeAnalytics} loading={loading} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReportsInsights />
            </div>
          </div>
        </>
      )}

      {/* Leave Tab */}
      {activeTab === "leave" && (
        <>
          <LeaveChart data={leaveData} loading={loading} />
          {departmentData.length > 0 && (
            <DepartmentAnalytics data={departmentData} loading={loading} />
          )}
        </>
      )}

      {/* Payroll Tab */}
      {activeTab === "payroll" && (
        <>
          <PayrollChart data={payrollData} loading={loading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentAnalytics data={departmentData} loading={loading} />
            <ReportsInsights />
          </div>
        </>
      )}

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <>
          <EmployeeAnalyticsTable data={employeeAnalytics} loading={loading} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReportsInsights />
            </div>
          </div>
        </>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <>
          <DepartmentAnalytics data={departmentData} loading={loading} />
          {employeeAnalytics.length > 0 && (
            <EmployeeAnalyticsTable data={employeeAnalytics} loading={loading} />
          )}
        </>
      )}

      {/* Export Center always visible on overview */}
      {activeTab !== "overview" && (
        <ExportCenter data={exportData} />
      )}
    </div>
  );
}
