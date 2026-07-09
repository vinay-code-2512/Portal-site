"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString, isSunday } from "@/lib/format";
import type { UserProfile } from "./useCurrentUser";

export interface AttendanceRecord {
  id: string;
  uid: string;
  date: string;
  checkIn: any;
  checkOut: any;
  status: "present" | "late" | "absent" | "half-day";
  breaks?: any[];
  breakMinutes?: number;
  totalBreakMs?: number;
  selfie?: string;
  cityState?: string;
}

export interface WorkforceEntry {
  uid: string;
  name: string;
  photoURL?: string;
  department?: string;
  status: "present" | "break" | "late" | "absent" | "on-leave" | "checked-out";
  checkIn?: any;
  checkOut?: any;
  autoCheckedOut?: boolean;
  breakMinutes?: number;
}

export interface DepartmentInfo {
  name: string;
  count: number;
  present: number;
  total: number;
  attendancePercent: number;
}

export interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  lateArrivals: number;
  attendancePercent: number;
  checkedOutToday: number;
  onBreakNow: number;
  workforce: WorkforceEntry[];
  departments: DepartmentInfo[];
  employees: UserProfile[];
}

export function useAdminDashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const today = getLocalDateString(new Date());

    async function autoCheckoutIfNeeded() {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 19) return;

      const attSnap = await getDocs(
        query(
          collection(db, "attendance"),
          where("date", "==", today),
          where("checkOut", "==", null)
        )
      );

      const promises: Promise<any>[] = [];
      attSnap.forEach((d) => {
        const data = d.data();
        if (data.checkIn) {
          const sevenPm = new Date();
          sevenPm.setHours(19, 0, 0, 0);
          promises.push(
            updateDoc(doc(db, "attendance", d.id), {
              checkOut: Timestamp.fromDate(sevenPm),
              autoCheckedOut: true,
              updatedAt: serverTimestamp(),
            })
          );
        }
      });

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        if (isSunday(today)) {
          setEmployees([]);
          setTodayAttendance([]);
          setApprovedLeaves(new Set());
          return;
        }

        await autoCheckoutIfNeeded();

        const [usersSnap, attendanceSnap, leavesSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "employee"))),
          getDocs(query(collection(db, "attendance"), where("date", "==", today))),
          getDocs(
            query(
              collection(db, "leaves"),
              where("status", "==", "approved"),
              where("startDate", "<=", today)
            )
          ),
        ]);

        if (cancelled) return;

        const emps: UserProfile[] = [];
        usersSnap.forEach((d) => emps.push({ uid: d.id, ...d.data() } as UserProfile));
        setEmployees(emps);

        const attRecords: AttendanceRecord[] = [];
        attendanceSnap.forEach((d) => attRecords.push({ id: d.id, ...d.data() } as AttendanceRecord));
        setTodayAttendance(attRecords);

        const onLeaveUids = new Set<string>();
        leavesSnap.forEach((d) => {
          const data = d.data();
          if (data.endDate >= today) onLeaveUids.add(data.uid);
        });
        setApprovedLeaves(onLeaveUids);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  function calcBreakMinutes(rec: AttendanceRecord): number {
    if (rec.totalBreakMs) return Math.round(rec.totalBreakMs / 60000);
    if (!rec.breaks?.length) return 0;
    let total = 0;
    for (const b of rec.breaks) {
      if (b?.end) {
        total += b.end.toDate().getTime() - b.start.toDate().getTime();
      } else if (b?.start) {
        total += Date.now() - b.start.toDate().getTime();
      }
    }
    return Math.round(total / 60000);
  }

  const dashboardData = useMemo<AdminDashboardData>(() => {
    const total = employees.length;
    const attMap = new Map<string, AttendanceRecord>();
    for (const r of todayAttendance) {
      attMap.set(r.uid, r);
    }

    let present = 0, late = 0, checkedOut = 0, onBreak = 0;
    const workforce: WorkforceEntry[] = [];

    for (const emp of employees) {
      const rec = attMap.get(emp.uid);
      const isOnLeave = approvedLeaves.has(emp.uid);

      if (isOnLeave) {
        workforce.push({
          uid: emp.uid,
          name: emp.displayName || emp.fullName || emp.email || "Unknown",
          photoURL: emp.photoURL,
          department: (emp as any).department,
          status: "on-leave",
        });
        continue;
      }

      if (rec) {
        const hasOpenBreak = rec.breaks?.some((b: any) => b && !b.end);
        if (rec.checkOut) {
          checkedOut++;
          workforce.push({
            uid: emp.uid,
            name: emp.displayName || emp.fullName || emp.email || "Unknown",
            photoURL: emp.photoURL,
            department: (emp as any).department,
            status: "checked-out",
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
            autoCheckedOut: (rec as any).autoCheckedOut || undefined,
            breakMinutes: calcBreakMinutes(rec),
          });
        } else if (hasOpenBreak) {
          onBreak++;
          workforce.push({
            uid: emp.uid,
            name: emp.displayName || emp.fullName || emp.email || "Unknown",
            photoURL: emp.photoURL,
            department: (emp as any).department,
            status: "break",
            checkIn: rec.checkIn,
            breakMinutes: calcBreakMinutes(rec),
          });
        } else if (rec.status === "late") {
          late++;
          workforce.push({
            uid: emp.uid,
            name: emp.displayName || emp.fullName || emp.email || "Unknown",
            photoURL: emp.photoURL,
            department: (emp as any).department,
            status: "late",
            checkIn: rec.checkIn,
            breakMinutes: calcBreakMinutes(rec),
          });
        } else {
          present++;
          workforce.push({
            uid: emp.uid,
            name: emp.displayName || emp.fullName || emp.email || "Unknown",
            photoURL: emp.photoURL,
            department: (emp as any).department,
            status: "present",
            checkIn: rec.checkIn,
            breakMinutes: calcBreakMinutes(rec),
          });
        }
      } else {
        workforce.push({
          uid: emp.uid,
          name: emp.displayName || emp.fullName || emp.email || "Unknown",
          photoURL: emp.photoURL,
          department: (emp as any).department,
          status: "absent",
        });
      }
    }

    const onLeave = approvedLeaves.size;
    const absent = total - present - late - checkedOut - onBreak - onLeave;
    const attended = present + late + onBreak;
    const attendancePercent = total > 0 ? Math.round((attended / (total - onLeave)) * 100) : 0;

    const deptMap = new Map<string, { count: number; present: number; total: number }>();
    for (const emp of employees) {
      const dept = (emp as any).department || "Unassigned";
      if (!deptMap.has(dept)) deptMap.set(dept, { count: 0, present: 0, total: 0 });
      const entry = deptMap.get(dept)!;
      entry.count++;
      entry.total++;
      if (attMap.has(emp.uid) && !attMap.get(emp.uid)?.checkOut) {
        entry.present++;
      }
    }
    const departments: DepartmentInfo[] = [];
    deptMap.forEach((v, name) => {
      departments.push({
        name,
        count: v.count,
        present: v.present,
        total: v.total,
        attendancePercent: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
      });
    });

    return {
      totalEmployees: total,
      presentToday: present,
      absentToday: absent,
      onLeave,
      lateArrivals: late,
      attendancePercent,
      checkedOutToday: checkedOut,
      onBreakNow: onBreak,
      workforce,
      departments,
      employees,
    };
  }, [employees, todayAttendance, approvedLeaves]);

  return { data: dashboardData, loading, error };
}
