"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString } from "@/lib/format";

export interface AttendanceRecord {
  id: string;
  uid: string;
  date: string;
  checkIn: any;
  checkOut: any;
  status: "present" | "late" | "absent" | "half-day";
  breaks?: any[];
  breakMinutes?: number;
  selfie?: string;
  cityState?: string;
}

export interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  total: number;
}

export function useAttendance() {
  const { currentUser, loading: authLoading } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const uid = currentUser.uid;
    const today = getLocalDateString(new Date());
    const now = new Date();
    const firstOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
    const lastOfMonth = getLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    async function fetchAttendance() {
      try {
        setLoading(true);
        setError(null);

        const [todaySnap, monthlySnap] = await Promise.all([
          getDoc(doc(db, "attendance", `${uid}_${today}`)),
          getDocs(
            query(
              collection(db, "attendance"),
              where("uid", "==", uid),
              where("date", ">=", firstOfMonth),
              where("date", "<=", lastOfMonth)
            )
          ),
        ]);

        if (cancelled) return;

        if (todaySnap.exists()) {
          const todayData = todaySnap.data() as any;
          if (todayData.autoCheckedOut) todayData.status = "absent";
          setTodayRecord({ id: todaySnap.id, ...todayData } as AttendanceRecord);
        } else {
          setTodayRecord(null);
        }

        const records: AttendanceRecord[] = [];
        monthlySnap.forEach((d) => {
          const data = d.data() as any;
          if (data.autoCheckedOut) data.status = "absent";
          records.push({ id: d.id, ...data } as AttendanceRecord);
        });
        setMonthlyRecords(records);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAttendance();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  const monthlyStats = useMemo<MonthlyStats>(() => {
    const stats: MonthlyStats = { present: 0, late: 0, absent: 0, halfDay: 0, total: monthlyRecords.length };
    for (const r of monthlyRecords) {
      if (r.status === "present") stats.present++;
      else if (r.status === "late") stats.late++;
      else if (r.status === "absent") stats.absent++;
      else if (r.status === "half-day") stats.halfDay++;
    }
    return stats;
  }, [monthlyRecords]);

  return { todayRecord, monthlyRecords, monthlyStats, loading, error };
}
