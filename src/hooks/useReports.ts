"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getDashboardOverview,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeAnalytics,
  getDepartmentAnalytics,
  type DashboardOverview,
  type AttendanceReportData,
  type LeaveReportData,
  type PayrollReportData,
  type EmployeeAnalyticsRow,
  type DepartmentAnalyticsRow,
} from "@/lib/reports";

export type DateRangePreset = "today" | "thisWeek" | "thisMonth" | "thisQuarter" | "thisYear" | "custom";
export type ReportTab = "overview" | "attendance" | "leave" | "payroll" | "employees" | "departments";

export interface DateRange {
  start: string;
  end: string;
}

function computeRange(preset: DateRangePreset, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (preset === "today") return { start: today, end: today };

  if (preset === "thisWeek") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      start: mon.toISOString().slice(0, 10),
      end: sun.toISOString().slice(0, 10),
    };
  }

  if (preset === "thisMonth") {
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return {
      start: first,
      end: today,
    };
  }

  if (preset === "thisQuarter") {
    const q = Math.floor(now.getMonth() / 3);
    const first = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`;
    return { start: first, end: today };
  }

  if (preset === "thisYear") {
    return {
      start: `${now.getFullYear()}-01-01`,
      end: today,
    };
  }

  return {
    start: customStart || today,
    end: customEnd || today,
  };
}

export function useReports() {
  const { currentUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [preset, setPreset] = useState<DateRangePreset>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRange = useMemo(
    () => computeRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const now = new Date();
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
  const [leaveData, setLeaveData] = useState<LeaveReportData | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollReportData | null>(null);
  const [employeeAnalytics, setEmployeeAnalytics] = useState<EmployeeAnalyticsRow[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentAnalyticsRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);

      const promises: Promise<unknown>[] = [getDashboardOverview(reportYear, reportMonth)];

      if (activeTab === "attendance") promises.push(getAttendanceReport(dateRange.start, dateRange.end).then(setAttendanceData));
      if (activeTab === "leave") promises.push(getLeaveReport(dateRange.start, dateRange.end).then(setLeaveData));
      if (activeTab === "payroll") promises.push(getPayrollReport(reportYear, reportMonth).then(setPayrollData));
      if (activeTab === "employees") promises.push(getEmployeeAnalytics(dateRange.start, dateRange.end).then(setEmployeeAnalytics));
      if (activeTab === "departments") promises.push(getDepartmentAnalytics().then(setDepartmentData));

      if (activeTab === "overview") {
        promises.push(
          getAttendanceReport(dateRange.start, dateRange.end).then(setAttendanceData),
          getLeaveReport(dateRange.start, dateRange.end).then(setLeaveData),
          getPayrollReport(reportYear, reportMonth).then(setPayrollData),
          getEmployeeAnalytics(dateRange.start, dateRange.end).then(setEmployeeAnalytics),
          getDepartmentAnalytics().then(setDepartmentData),
        );
      }

      const results = await Promise.all(promises);
      const ov = results[0] as DashboardOverview | undefined;
      if (ov) setOverview(ov);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, dateRange, reportYear, reportMonth, activeTab]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const canExport = useMemo(
    () => !loading && !error,
    [loading, error]
  );

  return {
    activeTab,
    setActiveTab,
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    dateRange,
    reportYear,
    setReportYear,
    reportMonth,
    setReportMonth,
    overview,
    attendanceData,
    leaveData,
    payrollData,
    employeeAnalytics,
    departmentData,
    loading,
    error,
    refresh: loadAll,
    canExport,
  };
}
