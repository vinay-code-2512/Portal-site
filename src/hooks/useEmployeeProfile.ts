"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEmployee, getMonthlyAttendance, getEmployeeLeaves, getEmployeeActivityLog,
  type EmployeeData,
} from "@/lib/employees";

export interface ProfileAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  total: number;
}

export function useEmployeeProfile(uid: string | undefined) {
  const { currentUser, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || !uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const now = new Date();

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const uidStr = uid as string;
        const [emp, att, lev, act] = await Promise.all([
          getEmployee(uidStr),
          getMonthlyAttendance(uidStr, now.getFullYear(), now.getMonth() + 1),
          getEmployeeLeaves(uidStr, 5),
          getEmployeeActivityLog(uidStr, 20),
        ]);

        if (cancelled) return;
        setEmployee(emp);
        setAttendance(att);
        setLeaves(lev);
        setActivityLog(act);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [currentUser, authLoading, uid]);

  const attendanceSummary = useMemo<ProfileAttendanceSummary>(() => {
    const summary: ProfileAttendanceSummary = { present: 0, late: 0, absent: 0, halfDay: 0, total: attendance.length };
    for (const r of attendance) {
      if (r.status === "present") summary.present++;
      else if (r.status === "late") summary.late++;
      else if (r.status === "absent") summary.absent++;
      else if (r.status === "half-day") summary.halfDay++;
    }
    return summary;
  }, [attendance]);

  return { employee, attendance, attendanceSummary, leaves, activityLog, loading, error };
}
